import mongoose from "mongoose";

/**
 * MongoDB connection, safe for both a long-lived server and serverless.
 *
 * On Vercel every cold start executes this module afresh, but warm invocations
 * reuse the same Node context. Without caching, each cold start would open a
 * new connection pool and never close it — Atlas' connection limit is reached
 * within minutes of real traffic and the API starts refusing requests.
 *
 * The cache is parked on `globalThis` rather than a module-level variable
 * because the module registry itself can be discarded between invocations.
 */
const DB_NAME = "JAIN_PLACEMENT";

/**
 * Repair the two ways an Atlas connection string is most often pasted wrong.
 *
 * Atlas shows the cluster host with :27017 in some places, but the driver
 * rejects a port on a mongodb+srv:// URI outright — the whole point of SRV is
 * that the port comes from DNS. The result is a total outage with a message
 * ("mongodb+srv URI cannot have port number") that never reaches the user,
 * because it happens at connect time rather than in a request.
 *
 * Normalising here means a copy-paste slip degrades to a log warning instead
 * of taking the site down. Credentials are never logged.
 */
function normaliseUri(raw) {
  let uri = String(raw).trim().replace(/^["']|["']$/g, "");
  const warnings = [];

  const schemeEnd = uri.indexOf("://");
  if (schemeEnd === -1) return { uri, warnings };

  const scheme = uri.slice(0, schemeEnd);
  const rest = uri.slice(schemeEnd + 3);

  // A missing '@' separator is detected but deliberately NOT repaired.
  //
  // Atlas' copy button yields user:password@host, but the '@' is easily lost
  // when the password is typed over the <password> placeholder by hand. The
  // result parses as host:port and fails complaining about a port the user
  // never wrote — which is why this is called out explicitly.
  //
  // It cannot be fixed automatically: with the password glued to the hostname
  // there is no reliable boundary between them ("Secret123cluster0.x.mongodb
  // .net" could split either way), and guessing wrong yields a connection to
  // a nonexistent host — a worse and far more confusing failure than this one.
  if (!rest.includes("@")) {
    warnings.push(
      "MONGO_URI has no '@' between the password and the host. Atlas strings are " +
        "mongodb+srv://USER:PASSWORD@cluster.xxxxx.mongodb.net/ — the '@' is missing " +
        "and must be added to the stored value; it cannot be inferred safely."
    );
  }

  // Split on the LAST '@' in the whole remainder rather than the first '/'.
  // An unencoded '/' inside the password would otherwise truncate the
  // authority and hide the host entirely — which is a real possibility here,
  // since Atlas passwords are frequently pasted without percent-encoding.
  const lastAt = rest.lastIndexOf("@");
  const userinfo = lastAt === -1 ? "" : rest.slice(0, lastAt + 1);
  const afterAuth = lastAt === -1 ? rest : rest.slice(lastAt + 1);

  const slash = afterAuth.indexOf("/");
  const q = afterAuth.indexOf("?");
  const hostEnd =
    slash === -1 ? (q === -1 ? afterAuth.length : q) : q === -1 ? slash : Math.min(slash, q);

  let hosts = afterAuth.slice(0, hostEnd);
  const tail = afterAuth.slice(hostEnd);

  if (scheme === "mongodb+srv" && /:\d+/.test(hosts)) {
    hosts = hosts.replace(/:\d+/g, "");
    warnings.push(
      "MONGO_URI contained a port number, which mongodb+srv:// does not allow — it has been ignored."
    );
  }

  return { uri: `${scheme}://${userinfo}${hosts}${tail}`, warnings };
}

/**
 * A connection-string shape safe to put in logs: everything between "://" and
 * the last "@" is replaced. Without this, a bad URI produces an error the
 * operator cannot act on, because the one thing they need to see is the one
 * thing that must never be printed.
 */
function redactUri(raw) {
  const uri = String(raw ?? "").trim();
  const schemeEnd = uri.indexOf("://");
  if (schemeEnd === -1) return `<unparseable, length ${uri.length}>`;

  const scheme = uri.slice(0, schemeEnd);
  const rest = uri.slice(schemeEnd + 3);
  const lastAt = rest.lastIndexOf("@");

  // FAIL CLOSED. An earlier version printed `rest` verbatim when it found no
  // '@', on the assumption that meant "no credentials present". A URI missing
  // its '@' separator — which is exactly the malformed case this diagnostic
  // exists to catch — still contains the username and password, so that
  // assumption leaked them straight into the logs. When the boundary cannot
  // be located, nothing beyond the scheme may be shown.
  if (lastAt === -1) {
    return `${scheme}://<malformed: no '@' separator, length ${rest.length}>`;
  }

  return `${scheme}://<user>:<password>@${rest.slice(lastAt + 1)}`;
}

const cache = globalThis.__mongooseCache ?? { conn: null, promise: null };
globalThis.__mongooseCache = cache;

export const dbConnection = async () => {
  if (cache.conn) return cache.conn;

  if (!process.env.MONGO_URI) {
    throw new Error("MONGO_URI is not set.");
  }

  const { uri, warnings } = normaliseUri(process.env.MONGO_URI);
  warnings.forEach((w) => console.warn(w));

  if (!cache.promise) {
    cache.promise = mongoose
      .connect(uri, {
        dbName: DB_NAME,
        // Serverless functions are short-lived; a large pool per instance
        // multiplies across concurrent invocations and exhausts Atlas.
        maxPoolSize: 10,
        // Fail fast instead of letting a request hang until the platform
        // timeout, which produces a far less diagnosable 504.
        serverSelectionTimeoutMS: 10_000,
        // With buffering on, queries issued before the connection is ready
        // queue silently and then time out; better to surface the error.
        bufferCommands: false,
      })
      .then((m) => {
        console.log("Connected to database.");
        return m;
      })
      .catch((err) => {
        // Log the shape that was actually attempted. A connection failure is
        // almost always a malformed URI, and this is the only way to see how
        // it was malformed without exposing the credentials.
        console.error("Mongo connect failed for:", redactUri(uri));
        // Clear the promise so the next request retries rather than
        // permanently reusing a rejected one.
        cache.promise = null;
        throw err;
      });
  }

  cache.conn = await cache.promise;
  return cache.conn;
};
