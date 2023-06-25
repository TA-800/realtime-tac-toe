// Convenience hook
import { useEffect, useContext, useState } from "react";
import { SocketContext } from "../context/socket";

export default function useSocket() {
    const socket = useContext(SocketContext);
    const [connected, setConnected] = useState(socket.connected);

    const onConnect = () => {
        setConnected(true);
    };
    const onDisconnect = () => {
        setConnected(false);
    };

    useEffect(() => {
        socket.on("connect", onConnect);
        socket.on("disconnect", onDisconnect);

        socket.onAny((event, ...args) => {
            // Fancy logging
            console.log(`%cEvent: ${event}, Args: ${args}`, "color: #00ff00");
        });

        return () => {
            socket.off("connect", onConnect);
            socket.off("disconnect", onDisconnect);
        };
    }, []);

    return { socket, connected };
}
