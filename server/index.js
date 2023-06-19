/* Built-in library for creating HTTP servers and making HTTP requests. */
const http = require("http");

/* Import and create an Express application instance, which provides a set of methods for defining routes, handling requests, and sending responses.
Provides middleware options.  */
const express = require("express");
const app = express();
const cors = require("cors");
app.use(cors());

const { Server } = require("socket.io");

/* Create a server instance which will listen for incoming HTTP requests and respond with data.
Pass app to createServer to tell http library to use Express app instance to handle incoming HTTP requests,
because app is an instance of a request handler function, which is compatible with the http library's createServer method.
 */
const server = http.createServer(app);

/* Connect the socket io to the server we just created */
const io = new Server(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"],
    },
});

/* Initiate and detect events & connections on the socket.io server. 
Regular HTTP requests won't work because socket.io connections operate differently,
and the code below will only handle on socket.io rtc connections. */
io.on("connection", (socket) => {
    console.log("User connected: " + socket.id);

    socket.on("disconnect", () => {
        console.log("User disconnected: " + socket.id);
    });
});

server.listen(3001, () => {
    console.log("Server running on port 3001");
});
