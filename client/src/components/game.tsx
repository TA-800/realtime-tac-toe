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

export default function Game({ setRoomJoined }: { setRoomJoined: React.Dispatch<React.SetStateAction<boolean>> }) {
    const { socket, connected } = useSocket();
    const [roomInfo, setRoomInfo] = useState({
        roomId: "",
        selfUsername: "",
        selfPlayerType: "",
        opponentUsername: "",
    });
    const [gameInfo, setGameInfo] = useState<GameInfoProps | null>(null);

    const handleGameInfo = (data: GameInfoProps) => {
        setGameInfo(data);
    };

    const handleInvalidMove = () => {
        alert("Invalid move");
    };

    const makeMove = (row: number, col: number) => {
        socket.emit("make-move", roomInfo.roomId, row, col, function (callback: { status: string; message: string }) {
            if (callback.status === "failure") {
                alert(callback.message);
                return;
            }
        });
    };

    const requestRematch = () => {
        socket.emit("rematch-request", roomInfo.roomId, function (callback: string) {
            console.log(callback);
        });
    };

    const handleGetOpponentUsername = (username: string) => {
        // The server has shared with you the username of the opponent
        setRoomInfo((prev) => {
            // Return the favor
            socket.emit("username-chain-second-client", prev.roomId, prev.selfUsername);

            return {
                ...prev,
                opponentUsername: username,
            };
        });
    };

    const handleGetOpponentUsernameFinal = (username: string) => {
        setRoomInfo((prev) => {
            return {
                ...prev,
                opponentUsername: username,
            };
        });
    };

    useEffect(() => {
        if (!connected) return;

        socket.emit(
            "get-self-information",
            function (callback: { selfUsername: string; roomId: string; selfPlayerType: "X" | "O" }) {
                setRoomInfo((prev) => ({
                    ...prev,
                    roomId: callback.roomId,
                    selfUsername: callback.selfUsername,
                    selfPlayerType: callback.selfPlayerType,
                }));
            }
        );

        socket.on("game-info", handleGameInfo);
        socket.on("invalid-move", handleInvalidMove);
        // When second player joins, server will send the username of the first player
        socket.on("username-chain-server", handleGetOpponentUsername);
        socket.on("username-chain-final", handleGetOpponentUsernameFinal);
        socket.on("player-disconnected", handlePlayerDisconnect);

        return () => {
            socket.off("game-info", handleGameInfo);
            socket.off("invalid-move", handleInvalidMove);
            socket.off("username-chain-server", handleGetOpponentUsername);
            socket.off("username-chain-final", handleGetOpponentUsernameFinal);
            socket.off("player-disconnected", handlePlayerDisconnect);
        };
    }, []);

    // Get usernames if they are empty
    useEffect(() => {
        // Don't do anything until we have a room ID
        if (!roomInfo.roomId) return;

        if (!roomInfo.opponentUsername) {
            socket.emit("username-chain-start", roomInfo.roomId, roomInfo.selfUsername);
        }

        // Have we gotten an opponent username but no game info?
        // Means we must have started the game but moved to a new page and back
        if (roomInfo.opponentUsername && !gameInfo) {
            socket.emit("make-move", roomInfo.roomId, -1, -1, function (callback: GameInfoProps) {
                setGameInfo(callback);
            });
        }
    }, [roomInfo]);

    const handlePlayerDisconnect = () => {
        alert("Opponent disconnected");
        setRoomJoined(false);
    };

    return (
        <div className="border-2 border-blue-500/50">
            <div className="flex flex-col">
                <p className="font-semibold">{roomInfo.selfUsername}</p>
                <p className="text-sm opacity-75">{roomInfo.roomId}</p>
                <p className="text-xs opacity-50">
                    {roomInfo.opponentUsername
                        ? `Playing against ${roomInfo.opponentUsername} (${roomInfo.selfPlayerType === "X" ? "O" : "X"})`
                        : "Waiting for a player..."}
                </p>
            </div>
            <p className="font-bold text-2xl text-center">GAME</p>
            {/* Board + Text chat container */}
            {gameInfo && (
                <div className="relative flex lg:flex-row flex-col gap-2">
                    <Board gameInfo={gameInfo} player={roomInfo.selfPlayerType}>
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
function Board({ children, gameInfo, player }: { children: React.ReactNode; gameInfo?: GameInfoProps; player: string }) {
    // Take up the full size of the parent
    return (
        // Container Positioner
        // <div className="w-full h-full border-2 flex flex-row justify-around items-center">
        <div className="w-full h-full grid grid-cols-3 gap-1">
            {/* Actual Game TTT Board */}
            <div className="bg-black/50 border-r-2 border-black w-full col-span-2 h-72 grid grid-rows-3 grid-cols-3 gap-1">
                {children}
            </div>
            {/* Informational Board */}
            <div className="flex flex-col items-center justify-center gap-4 border-l-2 border-black bg-black/20">
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
        <button ref={ref} {...rest} className={`${className ?? ""} bg-zinc-900 hover:bg-zinc-800 border-black/20 rounded-none`}>
            {children}
        </button>
    );
});

function TextChat() {
    return (
        <div className="h-72 w-full flex flex-col gap-2 bg-zinc-900">
            {/* Text container with scrollbar */}
            <div className="w-full h-full bg-black overflow-y-scroll"></div>
            {/* Input + Send button */}
            <div className="w-full flex flex-row gap-2">
                <input className="w-full p-2 bg-black rounded-md" placeholder="Enter message"></input>
                <button className="btn">Send</button>
            </div>
        </div>
    );
}
