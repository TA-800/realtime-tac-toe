import useSocket from "./useSocketHook";
import { useEffect } from "react";

type GameInfoProps = {
    board: [
        [string | null, string | null, string | null],
        [string | null, string | null, string | null],
        [string | null, string | null, string | null]
    ];
    currentPlayer: "X" | "O";
    winner: string | null;
};

export default function Game({ username }: { username: string }) {
    const { socket, connected } = useSocket();

    const handleGameStart = (data: GameInfoProps) => {
        console.log("Game started");
        console.log(data);
    };

    useEffect(() => {
        if (!connected) return;

        socket.on("game-start", handleGameStart);

        return () => {
            socket.off("game-start", handleGameStart);
        };
    }, []);

    return <div>Username: {username}</div>;
}
