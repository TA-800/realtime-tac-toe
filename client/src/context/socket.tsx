import { io } from "socket.io-client";
import { createContext } from "react";

/* Start a websocket connection to the server. */
const socket = io("http://localhost:3000", {
    autoConnect: false,
});

/* Create context (the type of information that components will look for when consuming / reading from providers). */
const SocketContext = createContext(socket);

/* Provider function that already has default value of the socket whose connection path has been established. */
function SocketProvider({ children }: { children: React.ReactNode }) {
    return <SocketContext.Provider value={socket}>{children}</SocketContext.Provider>;
}

export { SocketProvider, SocketContext };
