// Convenience hook
import { useContext } from "react";
import { SocketContext } from "../context/socket";

export default function useSocket() {
    const { socket, socketConnected: connected } = useContext(SocketContext);

    return { socket, connected };
}
