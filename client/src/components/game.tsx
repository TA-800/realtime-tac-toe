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

export default function Game() {
    const { socket, connected } = useSocket();
    const [moveMadeResponse, setMoveMadeResponse] = useState("");
    const [rematchRequester, setRematchRequester] = useState("");
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
        console.log(`Making move at ${rowIndex}, ${colIndex}`);
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
        console.log("Move was made");
        console.log(gameState ?? "Nothing");
        setGameInfo(gameState);
    };

    const requestRematch = () => {
        socket.emit("request rematch", roomInfo.roomName, roomInfo.self);
    };

    const handleRematchRequest = (requesterUsername: string) => {
        setRematchRequester(requesterUsername);
    };

    // Get information about room state whenever component is mounted + set up socket listeners
    useEffect(() => {
        if (!connected) return;

        // Get information about room
        socket.emit("get room info", (callback: RoomInfoProps) => {
            console.log(callback);
            setRoomInfo(callback);
        });

        socket.on("player joined", handleNewJoin);
        socket.on("game start", handleGameStart);
        socket.on("made move", handleMoveMade);
        socket.on("rematch request", handleRematchRequest);

        return () => {
            socket.off("player joined", handleNewJoin);
            socket.off("game start", handleGameStart);
            socket.off("made move", handleMoveMade);
            socket.off("rematch request", handleRematchRequest);
        };
    }, []);

    // Get information about game state whenever component is mounted (after we have roomInfo)
    useEffect(() => {
        if (!roomInfo.roomName) return;

        socket.emit("get game info", roomInfo.roomName, (callback: { gameState: GameInfoProps | null }) => {
            console.log(callback);
            if (!callback.gameState) {
                if (!roomInfo.opponent) {
                    console.log("No opponent so no game yet.");
                    return;
                }

                // If we have an opponent but no game, then a game must be started
                console.log("Asking server to start game");
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
        <div className="border-2 border-blue-500/50">
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
                <span>You are Player {selfSymbol}</span>
                <span>Current Player: {gameInfo.currentPlayer}</span>
                <span>Winner: {gameInfo.winner ?? "No one"}</span>
                <span>Moves Made: {gameInfo.moves}</span>
                {moveMadeResponse && <span>{moveMadeResponse}</span>}
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
