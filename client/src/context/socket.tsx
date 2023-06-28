import { io } from "socket.io-client";
import { createContext, useEffect, useState } from "react";

let url = import.meta.env.VITE_SERVER_URL || "http://localhost:3000";
const socket = io(url, {
    autoConnect: false,
});

/* Create context (the type of information that components will look for when consuming / reading from providers). */
const SocketContext = createContext({ socket, socketConnected: false });

/* Provider function that already has default value of the socket whose connection path has been established. */
function SocketProvider({ children }: { children: React.ReactNode }) {
    const [socketConnected, setSocketConnected] = useState(false);

    const handleOnAny = (event: string, ...args: any[]) => {
        // Fancy logging for debugging
        console.log(`%cEvent: ${event}, Args: ${args}`, "color: #00ff00");
    };
    const onConnect = () => {
        console.log(`%cConnected to server`, "color: #00ff00");
        setSocketConnected(true);
    };
    const onDisconnect = () => {
        console.log(`%cDisconnected from server`, "color: #ff0000");
        setSocketConnected(false);
    };

    useEffect(() => {
        // Add event listeners
        socket.on("connect", onConnect);
        socket.onAny(handleOnAny);
        socket.on("disconnect", onDisconnect);

        // Remove event listeners
        return () => {
            socket.off("connect", onConnect);
            socket.offAny(handleOnAny);
            socket.off("disconnect", onDisconnect);
        };
    }, []);

    return (
        <SocketContext.Provider
            value={{
                socket,
                socketConnected,
            }}>
            {children}
        </SocketContext.Provider>
    );
}

export { SocketProvider, SocketContext };
