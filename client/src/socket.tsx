import { io } from "socket.io-client";

export const socket = io("http://localhost:3001", {
    /* By default, the Socket.IO client opens a connection to the server right away. 
    Prevent this with autoConnect false, must use socket.connect() manually then. */
    autoConnect: false,
});
