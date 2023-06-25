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

type RoomInfoProps = {
    roomName: string;
    self: string;
    selfSymbol: "X" | "O";
    opponent: string;
};

export default function Game({ setRoomName }: { setRoomName: React.Dispatch<React.SetStateAction<string>> }) {
    const { socket, connected } = useSocket();
    const [moveMadeResponse, setMoveMadeResponse] = useState("");
    const [rematchRequester, setRematchRequester] = useState("");
    const [playerLeft, setPlayerLeft] = useState(false);
    const [gameInfo, setGameInfo] = useState<GameInfoProps>({
        board: [
            [null, null, null],
            [null, null, null],
            [null, null, null],
        ],
        currentPlayer: "X",
        winner: null,
        moves: 0,
    });
    const [roomInfo, setRoomInfo] = useState<RoomInfoProps>({
        roomName: "",
        self: "",
        selfSymbol: "X",
        opponent: "",
    });

    const makeMove = (rowIndex: number, colIndex: number) => {
        socket.emit("make move", roomInfo.roomName, rowIndex, colIndex, (callback: string) => {
            setMoveMadeResponse(callback);
        });
    };

    const handleNewJoin = (opponentUsername: string) => {
        setRoomInfo((prev) => ({ ...prev, opponent: opponentUsername }));
    };

    const handleGameStart = (gameState: GameInfoProps) => {
        setMoveMadeResponse("");
        setRematchRequester("");
        setGameInfo(gameState);
    };

    const handleMoveMade = (gameState: GameInfoProps) => {
        setGameInfo(gameState);
    };

    const requestRematch = () => {
        socket.emit("request rematch", roomInfo.roomName, roomInfo.self);
    };

    const handleRematchRequest = (requesterUsername: string) => {
        setRematchRequester(requesterUsername);
    };

    // This will unmount the game component (when player leaves)
    const handlePlayerLeft = () => {
        setPlayerLeft(true);
    };

    // Get information about room state whenever component is mounted + set up socket listeners
    useEffect(() => {
        if (!connected) return;

        // Get information about room
        socket.emit("get room info", (callback: RoomInfoProps) => {
            setRoomInfo(callback);
        });

        socket.on("player joined", handleNewJoin);
        socket.on("game start", handleGameStart);
        socket.on("made move", handleMoveMade);
        socket.on("rematch request", handleRematchRequest);
        socket.on("player left", handlePlayerLeft);

        return () => {
            socket.off("player joined", handleNewJoin);
            socket.off("game start", handleGameStart);
            socket.off("made move", handleMoveMade);
            socket.off("rematch request", handleRematchRequest);
            socket.off("player left", handlePlayerLeft);
        };
    }, []);

    // Get information about game state whenever component is mounted (after we have roomInfo)
    useEffect(() => {
        if (!roomInfo.roomName) return;

        socket.emit("get game info", roomInfo.roomName, (callback: { gameState: GameInfoProps | null }) => {
            if (!callback.gameState) {
                if (!roomInfo.opponent) {
                    return;
                }

                // If we have an opponent but no game, then a game must be started
                socket.emit("start game", roomInfo.roomName, (callback: string) => {
                    // on success: game started for ${roomName}
                    console.log(callback);
                });
                return;
            }
            setGameInfo(callback.gameState);
        });
    }, [roomInfo]);

    return (
        <div className="relative border-2 border-blue-500/50">
            <div className="flex flex-col">
                <p className="font-semibold">{roomInfo.self ?? "Retreiving information..."}</p>
                <p className="text-sm opacity-75">{roomInfo.roomName}</p>
                <p className="text-xs opacity-50">
                    {roomInfo.opponent
                        ? `Playing against ${roomInfo.opponent} (${roomInfo.selfSymbol === "X" ? "O" : "X"})`
                        : "Waiting for Player 2..."}
                </p>
            </div>
            {/* Board + Text chat container */}
            {roomInfo.opponent && (
                <>
                    <p className="font-bold text-2xl text-center">GAME</p>
                    <div className="relative flex lg:flex-row flex-col gap-2">
                        <Board
                            rematchRequester={rematchRequester}
                            requestRematch={requestRematch}
                            selfSymbol={roomInfo.selfSymbol}
                            gameInfo={gameInfo}
                            moveMadeResponse={moveMadeResponse}>
                            {gameInfo.board.map((row, rowIndex) => {
                                return row.map((cell, colIndex) => {
                                    return (
                                        <Cell
                                            onClick={() => makeMove(rowIndex, colIndex)}
                                            key={rowIndex + colIndex + (cell ?? "")}>
                                            {cell}
                                        </Cell>
                                    );
                                });
                            })}
                        </Board>
                        <TextChat />
                    </div>
                </>
            )}
            {playerLeft && (
                <div className="absolute top-0 left-0 w-full h-full bg-zinc-900/80 flex flex-col justify-center items-center">
                    <span>Player has disconnected</span>
                    <button onClick={() => setRoomName("")} className="btn mt-1">
                        Okay
                    </button>
                </div>
            )}
        </div>
    );
}

// Wrapper function to align all cells in a row
function Board({
    children,
    selfSymbol,
    moveMadeResponse,
    gameInfo,
    requestRematch,
    rematchRequester,
}: {
    children: React.ReactNode;
    selfSymbol: "X" | "O";
    moveMadeResponse: string;
    gameInfo: GameInfoProps;
    requestRematch: () => void;
    rematchRequester: string;
}) {
    // Take up the full size of the parent
    return (
        // Container Positioner
        <div className="relative w-full h-full grid grid-cols-3 gap-1">
            {/* Actual Game TTT Board */}
            <div className="bg-black/50 border-r-2 border-black w-full col-span-2 h-72 grid grid-rows-3 grid-cols-3 gap-1">
                {children}
            </div>
            {/* Informational Board */}
            <div className="flex flex-col items-center justify-center gap-4 border-l-2 border-black bg-black/20">
                <div className="grid grid-flow-row grid-cols-3 gap-y-1">
                    <div className="col-span-2 sm:text-sm text-xs">
                        <span className="opacity-75">You're Player</span>
                    </div>
                    <div>{selfSymbol}</div>
                    <div className="col-span-2 sm:text-sm text-xs">
                        <span className="opacity-75">Current Player</span>
                    </div>
                    <div>{gameInfo.currentPlayer}</div>
                    <div className="col-span-2 sm:text-sm text-xs">
                        <span className="opacity-75">Winner</span>
                    </div>
                    <div>{gameInfo.winner ?? "No one"}</div>
                    <div className="col-span-2 sm:text-sm text-xs">
                        <span className="opacity-75">Moves Made</span>
                    </div>
                    <div>{gameInfo.moves}</div>
                </div>
                {moveMadeResponse && (
                    <span
                        className={`${
                            moveMadeResponse.includes("success") ? "text-green-600" : "text-red-600"
                        } text-sm opacity-75`}>
                        {moveMadeResponse}
                    </span>
                )}
            </div>
            {/* Game over screen */}
            {(gameInfo.winner !== null || gameInfo.moves === 9) && (
                <div className="absolute top-0 left-0 w-full h-full bg-zinc-900/80 flex flex-col justify-center items-center">
                    <span className="text-5xl font-black mt-auto">{gameInfo.winner ? `${gameInfo.winner} wins!` : "Draw."}</span>
                    <button
                        onClick={(e) => {
                            e.currentTarget.disabled = true;
                            requestRematch();
                        }}
                        className="btn mt-auto">
                        Rematch
                    </button>
                    {rematchRequester && <p className="text-xs opacity-50">{rematchRequester} is requesting rematch.</p>}
                </div>
            )}
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
