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
        // console.log("UseEffect from useSocketHook.tsx");

        if (!socket.connected) {
            // console.log("Connecting to socket...");
            socket.connect();
        }

        socket.on("connect", onConnect);
        socket.on("disconnect", onDisconnect);

        return () => {
            // console.log("Cleaning up...");
            socket.off("connect", onConnect);
            socket.off("disconnect", onDisconnect);
        };
    }, [socket]);

    return { socket, connected };
}
