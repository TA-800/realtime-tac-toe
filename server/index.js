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
const gameInstances = new Map();
const rematchRequests = new Map();

// Send game information to both players in a given room
function emitGameInfo(roomId, gameInstance) {
    if (!gameInstance) gameInstance = gameInstances.get(roomId);
    io.to(roomId).emit("game-info", gameInstance.getGameInformation());
}

// Start game for a given room
function startGame(roomId) {
    // console.log(`Starting game for room ${roomId}`);

    // This if statement isn't necessary ...
    if (!gameInstances.has(roomId)) {
        gameInstances.set(roomId, new TicTacToe());
    }

    const gameInstance = gameInstances.get(roomId);
    gameInstance.reset();

    io.to(roomId).emit("game-start", gameInstance.getGameInformation());
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
    let player = null;

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
            player = 1;
            socket.join(roomId);
            availableRooms.add(roomId);
            callback({
                status: "success",
                player: player,
                message: `${username} joined ${roomId}.`,
            });
        }
        // If there was one person in the room
        else if (room.size == 1) {
            player = 2;
            socket.join(roomId);
            // Share (2nd player) joining player's username with other player
            io.to(roomId).emit("server-share-username", username);
            availableRooms.delete(roomId);
            callback({
                status: "success",
                // Player 2 is always the second player to join and the callback will emit start-game event
                player: player,
                message: `${username} joined ${roomId}.`,
            });
        }
        // If there were already two people in the room (this could happen when custom roomId is typed in to enter)
        else {
            player = null;
            callback({
                status: "failure",
                player: player,
                message: `${roomId} is full.`,
            });
        }
    });

    socket.on("start-game", (roomId) => {
        startGame(roomId);
    });

    socket.on("client-share-username", (roomId, providedUsername) => {
        // Emit first player's username to second player
        socket.broadcast.to(roomId).emit("server-share-username-final", providedUsername);
    });

    socket.on("make-move", (roomId, row, col, callback) => {
        const gameInstance = gameInstances.get(roomId);

        // First, check if current player is the one making the move
        if (gameInstance.getCurrentPlayerAsNumber() !== player) {
            callback({
                status: "failure",
                message: "It is not your turn.",
            });
            return;
        }

        const moveResult = gameInstance.makeMove(row, col);

        // 0 -> no move was made (invalid move), 1 -> move was made, 2 -> move made and game is over with winner, 3 -> move made and game is over with draw
        if (moveResult === 0) {
            io.to(roomId).emit("invalid-move");
        }
        callback({
            status: "success",
            message: "Move made.",
        });
        emitGameInfo(roomId, gameInstance);
    });

    socket.on("rematch-request", (roomId) => {
        // Update rematchRequests map (roomId -> number of requests)
        if (!rematchRequests.has(roomId)) rematchRequests.set(roomId, 1);
        else rematchRequests.set(roomId, rematchRequests.get(roomId) + 1);

        // If both players have requested a rematch, start a new game
        if (rematchRequests.get(roomId) === 2) {
            rematchRequests.delete(roomId);
            startGame(roomId);
        }
    });
});

server.listen(3000, () => {
    console.log("Server running on port 3000");
});
