import { useCallback, useContext, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { FiBell, FiCheck } from "react-icons/fi";
import { Context } from "../../main";
import { api } from "../../lib/api";
import { cn } from "../../lib/cn";
import { getSocket } from "../../socket";
import { Menu } from "../ui";

/**
 * Notification bell.
 *
 * Reads from /api/v1/notification and listens on the socket room the server
 * already opens per user. Written to degrade silently: if the endpoint is not
 * deployed yet the bell simply shows nothing rather than erroring, so the
 * shell does not depend on backend rollout order.
 */

const timeAgo = (iso) => {
  const seconds = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (seconds < 60) return "just now";
  const units = [
    ["d", 86400],
    ["h", 3600],
    ["m", 60],
  ];
  for (const [suffix, secs] of units) {
    const n = Math.floor(seconds / secs);
    if (n >= 1) return `${n}${suffix} ago`;
  }
  return "just now";
};

const NotificationBell = () => {
  const { isAuthorized } = useContext(Context);
  const [items, setItems] = useState([]);
  const [unread, setUnread] = useState(0);

  const load = useCallback(async () => {
    try {
      const { data } = await api.get("/api/v1/notification");
      setItems(data.notifications ?? []);
      setUnread(data.unread ?? 0);
    } catch {
      // Endpoint absent or unauthenticated — an empty bell is the correct
      // fallback, not a toast the user can do nothing about.
      setItems([]);
      setUnread(0);
    }
  }, []);

  useEffect(() => {
    if (!isAuthorized) return;
    load();
  }, [isAuthorized, load]);

  useEffect(() => {
    if (!isAuthorized) return;

    const socket = getSocket();
    const onNew = (notification) => {
      setItems((prev) => [notification, ...prev].slice(0, 20));
      setUnread((n) => n + 1);
    };

    socket.on("notification:new", onNew);
    if (!socket.connected) socket.connect();

    return () => socket.off("notification:new", onNew);
  }, [isAuthorized]);

  const markAllRead = async () => {
    setUnread(0);
    setItems((prev) => prev.map((n) => ({ ...n, read: true })));
    try {
      await api.post("/api/v1/notification/read-all");
    } catch {
      /* optimistic — a failed sync corrects itself on next load */
    }
  };

  return (
    <Menu
      menuLabel="Notifications"
      className="w-80 p-0"
      trigger={
        <span className="relative grid size-10 place-items-center rounded-full text-[var(--text-secondary)] transition-colors hover:bg-[var(--surface-hover)] hover:text-[var(--text-primary)]">
          <FiBell className="size-[18px]" aria-hidden="true" />
          <span className="sr-only">
            Notifications{unread > 0 ? `, ${unread} unread` : ""}
          </span>
          {unread > 0 && (
            <span
              data-numeric
              className="absolute top-1 right-1 grid min-w-4 place-items-center rounded-full bg-[var(--color-danger-500)] px-1 text-[0.625rem] font-bold text-white"
            >
              {unread > 9 ? "9+" : unread}
            </span>
          )}
        </span>
      }
    >
      <div className="flex items-center justify-between border-b border-[var(--border)] px-4 py-3">
        <p className="text-sm font-semibold text-[var(--text-primary)]">Notifications</p>
        {unread > 0 && (
          <button
            type="button"
            onClick={markAllRead}
            className="flex items-center gap-1 text-xs font-medium text-[var(--brand)] hover:underline"
          >
            <FiCheck className="size-3" /> Mark all read
          </button>
        )}
      </div>

      <div className="max-h-80 overflow-y-auto">
        {items.length === 0 ? (
          <p className="px-4 py-8 text-center text-sm text-[var(--text-tertiary)]">
            You&rsquo;re all caught up.
          </p>
        ) : (
          <ul>
            {items.map((n) => (
              <li key={n._id}>
                <Link
                  to={n.link || "/app/dashboard"}
                  className={cn(
                    "block border-b border-[var(--border)] px-4 py-3 transition-colors last:border-0 hover:bg-[var(--surface-hover)]",
                    !n.read && "bg-[var(--brand-subtle)]/40"
                  )}
                >
                  <p className="text-sm font-medium text-[var(--text-primary)]">{n.title}</p>
                  {n.body && (
                    <p className="mt-0.5 line-clamp-2 text-xs text-[var(--text-secondary)]">
                      {n.body}
                    </p>
                  )}
                  <p className="mt-1 text-[0.6875rem] text-[var(--text-tertiary)]">
                    {timeAgo(n.createdAt)}
                  </p>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </Menu>
  );
};

export default NotificationBell;
