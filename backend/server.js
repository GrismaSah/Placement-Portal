import http from "http";
import app from "./app.js";
import cloudinary from "cloudinary";
import { initSocket } from "./socket.js";


cloudinary.v2.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// socket.io needs the underlying HTTP server, so create it explicitly rather
// than letting app.listen() build one internally.
const server = http.createServer(app);
initSocket(server);

server.listen(process.env.PORT, () => {
  console.log(`Server running at port ${process.env.PORT}`);
});
