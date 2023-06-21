import useSocket from "./useSocketHook";
import { ComponentProps, forwardRef, useEffect, useState } from "react";

type GameInfoProps = {
    board: [
        [string | null, string | null, string | null],
        [string | null, string | null, string | null],
        [string | null, string | null, string | null]
    ];
    currentPlayer: "X" | "O";
    winner: string | null;
    moves: number;
};

export default function Game({ username, roomId, player }: { username: string; roomId: string; player: "X" | "O" }) {
    const { socket, connected } = useSocket();
    const [opponentUsername, setOpponentUsername] = useState("");
    const [gameInfo, setGameInfo] = useState<GameInfoProps | null>(null);

    const handleGameStart = (data: GameInfoProps) => {
        console.log("Game started");
        console.log(data);
        setGameInfo(data);
    };

    const handleInvalidMove = () => {
        console.log("Invalid move");
    };

    const handleGameInfo = (data: GameInfoProps) => {
        console.log("Game info");
        console.log(data);
        setGameInfo(data);
    };

    const makeMove = (row: number, col: number) => {
        console.log("Making move");
        socket.emit("make-move", roomId, row, col, function (callback: { status: string; message: string }) {
            if (callback.status === "failure") {
                alert(callback.message);
                return;
            } else console.log("Move made");
        });
    };

    const requestRematch = () => {
        socket.emit("rematch-request", roomId, function (callback: string) {
            console.log(callback);
        });
    };

    const handleGetOpponentUsername = (data: string) => {
        setOpponentUsername(data);
        // Share your username with opponent
        socket.emit("client-share-username", roomId, username);
    };

    const handleGetOpponentUsernameFinal = (data: string) => {
        setOpponentUsername(data);
    };

    useEffect(() => {
        if (!connected) return;

        // Different from "start-game" emitted by client
        socket.on("game-start", handleGameStart);
        socket.on("game-info", handleGameInfo);
        socket.on("invalid-move", handleInvalidMove);
        // When second player joins, server will send the username of the first player
        socket.on("server-share-username", handleGetOpponentUsername);
        socket.on("server-share-username-final", handleGetOpponentUsernameFinal);

        return () => {
            socket.off("game-start", handleGameStart);
            socket.off("game-info", handleGameInfo);
            socket.off("invalid-move", handleInvalidMove);
            socket.off("server-share-username", handleGetOpponentUsername);
            socket.off("server-share-username-final", handleGetOpponentUsernameFinal);
        };
    }, []);

    return (
        <div className="border-2 border-blue-500/50">
            <div className="flex flex-col">
                <p className="font-semibold">{username}</p>
                <p className="text-sm opacity-75">{roomId}</p>
                <p className="text-xs opacity-50">
                    {gameInfo ? `Playing against ${opponentUsername} (${player === "X" ? "O" : "X"})` : "Waiting for a player..."}
                </p>
            </div>
            <p className="font-bold text-2xl text-center">GAME</p>
            {/* Board + Text chat container */}
            {gameInfo && (
                <div className="relative flex lg:flex-row flex-col gap-2">
                    <Board gameInfo={gameInfo} player={player}>
                        {gameInfo.board.map((row, rowIndex) => {
                            return row.map((cell, colIndex) => {
                                return (
                                    <Cell onClick={() => makeMove(rowIndex, colIndex)} key={rowIndex + colIndex}>
                                        {cell}
                                    </Cell>
                                );
                            });
                        })}
                    </Board>
                    {gameInfo && (gameInfo.winner !== null || gameInfo.moves === 9) && (
                        <WinScreen winner={gameInfo.winner ?? "No one."} requestRematch={requestRematch} />
                    )}
                    <TextChat />
                </div>
            )}
        </div>
    );
}

// Wrapper function to align all cells in a row
function Board({ children, gameInfo, player }: { children: React.ReactNode; gameInfo?: GameInfoProps; player: "X" | "O" }) {
    // Take up the full size of the parent
    return (
        // Container Positioner
        // <div className="w-full h-full border-2 flex flex-row justify-around items-center">
        <div className="w-full h-full grid grid-cols-3 gap-1">
            {/* Actual Board */}
            <div className="bg-black/50 border-r-2 border-white/20 rounded-lg w-full col-span-2 h-72 grid grid-rows-3 grid-cols-3 gap-1">
                {children}
            </div>
            {/* Informational Board */}
            <div className="flex flex-col items-center justify-center gap-4 rounded-lg border-l-2 border-white/20 bg-black/20">
                <span>You are Player {player}</span>
                <span>Current Player: {gameInfo!.currentPlayer}</span>
                <span>Winner: {gameInfo!.winner ?? "None"}</span>
                <span>Moves Made: {gameInfo!.moves}</span>
            </div>
        </div>
    );
}

function WinScreen({ winner, requestRematch }: { winner: string; requestRematch: () => void }) {
    const [waitingForRematch, setWaitingForRematch] = useState(false);

    return (
        <div className="absolute top-0 left-0 flex flex-col items-center w-full h-72 bg-zinc-800/50">
            <p className="text-4xl font-black mt-auto">Winner: {winner}</p>
            <div className="mt-auto -translate-y-1 flex flex-col items-center">
                <button
                    onClick={(e) => {
                        requestRematch();
                        setWaitingForRematch(true);
                        // Disable button
                        (e.target as HTMLButtonElement).disabled = true;
                    }}
                    className="btn">
                    Rematch?
                </button>
                {waitingForRematch && <p className="text-xs opacity-50">Waiting for opponent...</p>}
            </div>
        </div>
    );
}

const Cell = forwardRef<HTMLButtonElement, ComponentProps<"button">>(function Cell({ className, children, ...rest }, ref) {
    return (
        // Give the cell same background color (but not transparent) to only keep the borders
        <button ref={ref} {...rest} className={`${className ?? ""} bg-zinc-900 hover:bg-zinc-800 border-black/20 rounded-lg`}>
            {children}
        </button>
    );
});

function TextChat() {
    return (
        <div className="h-72 w-full flex flex-col gap-2 bg-zinc-900">
            <div className="w-full h-full bg-black overflow-y-scroll"></div>
            <div className="w-full flex flex-row gap-2">
                <input className="w-full p-2 bg-black rounded-md" placeholder="Enter message"></input>
                <button className="btn">Send</button>
            </div>
        </div>
    );
}