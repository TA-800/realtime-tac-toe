// Import TicTacToe class
const TicTacToe = require("./logic.js");

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

// Set up a Set to store available rooms
const availableRooms = new Set();

// Start game for a given room
function startGame(roomId) {
    console.log(`Starting game for room ${roomId}`);

    let gameInstance = new TicTacToe();

    // Get game information like board (populated cells), current player, and winner, then emit it to all clients in the room
    function emitGameInfo() {
        io.to(roomId).emit("game-information", gameInstance.getGameInformation());
    }

    // emitGameInfo();
    io.to(roomId).emit("game-start", gameInstance.getGameInformation());

    // Listen for moves made by clients
    // io.to(roomId).on("make-move", (row, col, callback) => {
    //     let result = gameInstance.makeMove(row, col);
    //     if (result === 0) {
    //         // Invalid move
    //         callback(0);
    //     } else if (result === 1) {
    //         // Valid move, game still in progress
    //         callback(1);
    //     } else if (result === 2) {
    //         // Valid move, game over
    //         callback(2);
    //     } else {
    //         // Valid move, game over, tie
    //         callback(3);
    //     }
    //     emitGameInfo();
    // });
}

/* Initiate and detect events & connections on the socket.io server. 
Regular HTTP requests won't work because socket.io connections operate differently,
and the code below will only handle on socket.io rtc connections. */
io.on("connection", (socket) => {
    /* The socket parameter represents an individual connection to the Socket.IO server.
    Each time a client connects to the server, a new socket object is created to represent that connection.
    Each socket object can be thought of as a representation of a user or a client that is connected to the server. */

    console.log(socket.id + " connected.");
    let username = "";

    /* The events being listened for are emitted by the client whose socket is in the socket parameter.
    There is no reason to check if the events are being emitted by the client of the socket parameter
    or by another client somewhere else globally. */

    socket.on("disconnect", () => {
        console.log(socket.id + " disconnected.");
    });

    socket.on("search-for-room", (callback) => {
        // Return all available rooms
        callback([...availableRooms]);
    });

    socket.on("attempt-join-room", (roomId, providedUsername, callback) => {
        username = providedUsername;

        // Check if room already has two members
        const room = io.sockets.adapter.rooms.get(roomId);
        // rooms.get(roomId) will return array of socket ids in that room

        // If there was no one in the room
        if (!room || room.size == 0) {
            socket.join(roomId);
            availableRooms.add(roomId);
            callback({
                status: "success",
                waiting: true,
                message: `${username} joined ${roomId}.`,
            });
        }
        // If there was one person in the room
        else if (room.size == 1) {
            socket.join(roomId);
            availableRooms.delete(roomId);
            // Sending waiting: false means that the new client can send message to server to start game
            callback({
                status: "success",
                waiting: false,
                message: `${username} joined ${roomId}.`,
            });
        }
        // If there were already two people in the room (this could happen when custom roomId is typed in to enter)
        else {
            callback({
                status: "failure",
                waiting: true,
                message: `${roomId} is full.`,
            });
        }
    });

    socket.on("start-game", (roomId) => {
        console.log(roomId);
        startGame(roomId);
    });
});

server.listen(3000, () => {
    console.log("Server running on port 3000");
});
