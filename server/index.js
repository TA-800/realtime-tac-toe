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
        origin: ["http://localhost:5173", "https://realtime-tac-toe.onrender.com"],
        methods: ["GET", "POST"],
    },
});

let availableRooms = [];
// Map of room names to TicTacToe instances
let gameInstances = new Map();
// Map of room names to rematch requests
let rematchRequests = [];
// Max number of connections to prevent arrays and maps from growing too large
const MAX_CONNECTIONS = 100;

/* Initiate and detect events & connections on the socket.io server. 
Regular HTTP requests won't work because socket.io connections operate differently,
and the code below will only handle on socket.io rtc connections. */
io.on("connection", (socket) => {
    /* The socket parameter represents an individual connection to the Socket.IO server.
    Each time a client connects to the server, a new socket object is created to represent that connection.
    Each socket object can be thought of as a representation of a user or a client that is connected to the server. */
    if (io.engine.clientsCount > MAX_CONNECTIONS) {
        // Tell client to disconnect if there are too many connections
        io.to(socket.id).emit("too many connections");
        socket.disconnect();
        return;
    }

    // Do not allow user to join if username is empty or only whitespace
    if (!socket.handshake.auth.username || !socket.handshake.auth.username.trim()) {
        io.to(socket.id).emit("invalid username");
        socket.disconnect();
        return;
    }

    socket.data.username = socket.handshake.auth.username;
    console.log(`${socket.data.username} (${socket.id}) connected.`);

    /* The events being listened for are emitted by the client whose socket is in the socket parameter.
    There is no reason to check if the events are being emitted by the client of the socket parameter
    or by another client somewhere else globally. */

    socket.on("disconnect", () => {
        console.log(`${socket.data.username} (${socket.id}) disconnected.`);
    });

    socket.on("disconnecting", () => {
        let currentRoom = [...socket.rooms][1];

        // Make other player leave
        io.to(currentRoom).emit("player left");
        io.socketsLeave(currentRoom);

        // Remove room from available rooms, gameInstances map and rematchRequests
        availableRooms = availableRooms.filter((room) => room !== currentRoom);
        gameInstances.delete(currentRoom);
        rematchRequests = rematchRequests.filter((room) => room !== currentRoom);
    });

    socket.on("get username", (callback) => {
        callback(socket.data.username);
    });

    socket.on("get room usernames", async (roomName) => {
        // Get all usernames in a room
        const usersOfRoom = await io.in(roomName).fetchSockets();

        callback({
            usernames: usersOfRoom.map((socket) => socket.data.username),
        });
    });

    socket.on("join room", async (roomName, callback) => {
        if (!roomName) {
            callback({ status: "failure", playerSymbol: null, message: "Room name is required." });
            return;
        }

        // Do not let user join more than 1 (technically 2) rooms
        if (socket.rooms.size > 2) {
            // First room is always the socket's own room identified by its socket id
            callback({ status: "failure", playerSymbol: null, message: "Already in a room." });
            return;
        }

        // Add room to available rooms if it doesn't exist
        if (!availableRooms.includes(roomName)) {
            availableRooms.push(roomName);
        }

        // Get the number of users in the room
        const usersOfRoom = await io.in(roomName).fetchSockets();
        const length = usersOfRoom.length;

        if (length >= 2) {
            callback({ status: "failure", playerSymbol: null, message: "Room is full." });
            return;
        }

        // Join the room
        socket.join(roomName);
        // Every time a player joins a room, assign them a symbol
        let playerSymbol = length === 0 ? "X" : "O";
        socket.data.playerSymbol = playerSymbol;
        // Notify the other player in the room (if there is one) that new player has joined
        socket.broadcast.to(roomName).emit("player joined", socket.data.username);

        callback({
            status: "success",
            playerSymbol,
            message: "Joined room.",
        });
    });

    socket.on("check joined room", (callback) => {
        let roomName = [...socket.rooms][1];
        callback(roomName ?? "");
    });

    // Get information about joined room (roomName, selfUsername + symbol, opponentUsername)
    socket.on("get room info", async (callback) => {
        // Get the joined room name
        let roomName = [...socket.rooms][1];

        if (!roomName) {
            callback(null);
            return;
        }

        // Get username and player symbol
        let self = socket.data.username;
        let selfSymbol = socket.data.playerSymbol;
        // Get opponent username
        let opponent = "";
        let roomSockets = await io.in(roomName).fetchSockets();

        // If there is more than 1 socket in the room, get the opponent's username
        if (roomSockets.length > 1) opponent = roomSockets.filter((roomSocket) => socket.id !== roomSocket.id)[0].data.username;

        callback({
            roomName,
            self,
            selfSymbol,
            opponent,
        });
    });

    // Get information about game in joined room (getGameState)
    socket.on("get game info", (roomName, callback) => {
        // Get game instance of room
        let gameInstance = gameInstances.get(roomName);
        callback({
            // If game instance does not exist for the room then send null
            gameState: gameInstance ? gameInstance.getGameState() : null,
        });
    });

    // List of joinable rooms (filtered out games that have >= 2 users)
    socket.on("get game rooms", async (callback) => {
        const joinableRoomsPromises = availableRooms.map(async (roomName) => {
            const usersOfRoom = await io.in(roomName).fetchSockets();
            return { roomName, userCount: usersOfRoom.length };
        });

        const joinableRooms = await Promise.all(joinableRoomsPromises);

        const filteredRooms = joinableRooms.filter((room) => room.userCount < 2);

        const joinableRoomNames = filteredRooms.map((room) => room.roomName);

        callback(joinableRoomNames);
    });

    socket.on("start game", (roomName, callback) => {
        // If game instance already exists then do not create a new one
        let gameInstance = gameInstances.get(roomName);
        if (gameInstance) {
            callback(`game has already started for ${roomName}`);
            return;
        }

        // Create a new game instance
        gameInstance = new TicTacToe();
        gameInstances.set(roomName, gameInstance);

        io.in(roomName).emit("game start", gameInstance.getGameState());

        callback(`game started for ${roomName}`);
    });

    socket.on("make move", (roomName, row, col, callback) => {
        // Check if room name is provided
        if (!roomName) {
            callback("no room name provided");
            return;
        }
        // Check if game instance exists for the room
        let gameInstance = gameInstances.get(roomName);
        if (!gameInstance) return;

        // Call makeMove with row & col on it as parameters
        let result = gameInstance.makeMove(socket.data.playerSymbol, row, col);

        if (result <= 1) {
            callback(result === 0 ? "Not your turn" : "Invalid Move");
            return;
        }
        if (result > 1) {
            callback("successful move");
            io.in(roomName).emit("made move", gameInstance.getGameState());
        }
    });

    socket.on("request rematch", (roomName, requesterUsername) => {
        if (rematchRequests.includes(roomName)) {
            // Remove that room from rematchRequests array
            rematchRequests = rematchRequests.filter((room) => room !== roomName);
            // Begin rematch
            let gameInstance = gameInstances.get(roomName);
            gameInstance.reset();
            // Notify players
            io.to(roomName).emit("game start", gameInstance.getGameState());
        } else {
            rematchRequests.push(roomName);
            io.to(roomName).emit("rematch request", requesterUsername);
        }
    });

    socket.on("send message", (content) => {
        // Don't send empty messages or messages with only whitespace
        if (!content || !content.trim()) return;

        // Get room
        let roomName = [...socket.rooms][1];
        let username = socket.data.username;

        io.to(roomName).emit("receive msg", { content: content, username: username });
    });
});

// Display server status
app.get("/", (req, res) => {
    res.send("Server is running.");
});

// Clear all rooms and game instances
app.get("/clear", (req, res) => {
    availableRooms = [];
    gameInstances = new Map();
    rematchRequests = [];
    res.send("Cleared.");
});

server.listen(3000, () => {
    console.log("Server running on port 3000");
});
