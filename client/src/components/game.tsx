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

export default function Game({ username, roomId }: { username: string; roomId: string }) {
    const { socket, connected } = useSocket();
    // const [isGameOn, setIsGameOn] = useState(true);
    const [gameInfo, setGameInfo] = useState<GameInfoProps | null>(null);
    // const [isCurrentPlayer, setIsCurrentPlayer] = useState(false);

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

    useEffect(() => {
        if (!connected) return;

        socket.on("game-start", handleGameStart);
        socket.on("game-info", handleGameInfo);
        socket.on("invalid-move", handleInvalidMove);

        return () => {
            socket.off("game-start", handleGameStart);
            socket.off("game-info", handleGameInfo);
            socket.off("invalid-move", handleInvalidMove);
        };
    }, []);

    return (
        <div className="border-2 border-blue-500/50">
            <div className="flex flex-col gap-1">
                <p className="font-semi-bold">{username}</p>
                <p className="text-sm opacity-75">{roomId}</p>
                <p className="text-xs opacity-50">{gameInfo ? "Player 2 joined." : "Waiting for a player..."}</p>
            </div>
            <p className="font-bold text-2xl text-center">GAME</p>
            {/* Board + Text chat container */}
            {gameInfo && (
                <div className="flex lg:flex-row flex-col gap-2">
                    {gameInfo.winner === null && (
                        <Board gameInfo={gameInfo}>
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
                    )}
                    {gameInfo && gameInfo.winner !== null && <WinScreen winner={gameInfo.winner} />}
                    <TextChat />
                </div>
            )}
        </div>
    );
}

// Wrapper function to align all cells in a row
function Board({ children, gameInfo }: { children: React.ReactNode; gameInfo?: GameInfoProps }) {
    // Take up the full size of the parent
    return (
        // Container Positioner
        // <div className="w-full h-full border-2 flex flex-row justify-around items-center">
        <div className="w-full h-full border-2 grid grid-cols-3 gap-1">
            {/* Actual Board */}
            <div className="bg-black/50 w-full col-span-2 h-72 grid grid-rows-3 grid-cols-3 gap-1">{children}</div>
            {/* Informational Board */}
            <div className="flex flex-col gap-4 w-full h-full border-2 border-white/20 bg-zinc-900">
                <span>Current Player: {gameInfo!.currentPlayer}</span>
                <span>Winner: {gameInfo!.winner ?? "No one yet."}</span>
                <span>Moves: {gameInfo!.moves}</span>
            </div>
        </div>
    );
}

function WinScreen({ winner }: { winner: string }) {
    return (
        <div className="flex flex-col justify-center items-center gap-4 w-full h-72 border-2 border-white/20 bg-zinc-800">
            <p className="text-4xl font-black">Winner: {winner}</p>
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
        <div className="h-72 w-full flex flex-col gap-2 bg-zinc-900 border-2 border-white/20">
            <div className="w-full h-full bg-black overflow-y-scroll"></div>
            <div className="w-full flex flex-row gap-2">
                <input className="w-full p-2 bg-black rounded-md" placeholder="Enter message"></input>
                <button className="px-4 bg-blue-600 rounded-md">Send</button>
            </div>
        </div>
    );
}
