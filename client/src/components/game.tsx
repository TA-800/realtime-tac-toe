import TextChat from "./text";
import useSocket from "./useSocketHook";
import { ComponentProps, forwardRef, useEffect, useState } from "react";
import sword from "../icons8-sword.png";
import Button from "./button";

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
    const { socket } = useSocket();
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

    const handlePlayerLeft = () => {
        setPlayerLeft(true);
    };

    // Get information about room state whenever component is mounted + set up socket listeners
    useEffect(() => {
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
        <div className="relative mt-1">
            <div className="flex flex-col">
                <p className="flex gap-1 items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
                        <path d="M10 8a3 3 0 100-6 3 3 0 000 6zM3.465 14.493a1.23 1.23 0 00.41 1.412A9.957 9.957 0 0010 18c2.31 0 4.438-.784 6.131-2.1.43-.333.604-.903.408-1.41a7.002 7.002 0 00-13.074.003z" />
                    </svg>
                    <span className="font-semibold">{roomInfo.self ?? "Retreiving information..."}</span>
                </p>
                <p className="flex gap-2.5 items-center">
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                        className="w-3.5 h-3.5 translate-x-0.5">
                        <path
                            fillRule="evenodd"
                            d="M8.157 2.175a1.5 1.5 0 00-1.147 0l-4.084 1.69A1.5 1.5 0 002 5.251v10.877a1.5 1.5 0 002.074 1.386l3.51-1.453 4.26 1.763a1.5 1.5 0 001.146 0l4.083-1.69A1.5 1.5 0 0018 14.748V3.873a1.5 1.5 0 00-2.073-1.386l-3.51 1.452-4.26-1.763zM7.58 5a.75.75 0 01.75.75v6.5a.75.75 0 01-1.5 0v-6.5A.75.75 0 017.58 5zm5.59 2.75a.75.75 0 00-1.5 0v6.5a.75.75 0 001.5 0v-6.5z"
                            clipRule="evenodd"
                        />
                    </svg>

                    <span className="text-sm opacity-75">{roomInfo.roomName}</span>
                </p>
                <p className="flex gap-3 items-center">
                    <img width={12} height={12} src={sword} className="filter invert translate-x-0.5" />
                    <span className="text-xs opacity-50">
                        {roomInfo.opponent
                            ? `Playing against ${roomInfo.opponent} (${roomInfo.selfSymbol === "X" ? "O" : "X"})`
                            : "Waiting for Player 2..."}
                    </span>
                </p>
            </div>
            {/* Board + Text chat container */}
            {roomInfo.opponent && (
                <>
                    <div className="flex justify-center items-center mt-4 mb-1">
                        <div className="w-full h-0.5 bg-white/10 translate-y-0.5"></div>
                        <p className="font-bold text text-center mx-2">GAME</p>
                        <div className="w-full h-0.5 bg-white/10 translate-y-0.5"></div>
                    </div>
                    <div className="relative flex lg:flex-row flex-col gap-4">
                        <Board
                            rematchRequester={rematchRequester}
                            requestRematch={requestRematch}
                            selfSymbol={roomInfo.selfSymbol}
                            gameInfo={gameInfo}
                            moveMadeResponse={moveMadeResponse}>
                            {gameInfo.board.map((row, rowIndex) => {
                                return row.map((cell, colIndex) => {
                                    let roundedCorners = "";
                                    if (rowIndex === 0 && colIndex === 0) roundedCorners = "rounded-tl";
                                    else if (rowIndex === 0 && colIndex === 2) roundedCorners = "rounded-tr";
                                    else if (rowIndex === 2 && colIndex === 0) roundedCorners = "rounded-bl";
                                    else if (rowIndex === 2 && colIndex === 2) roundedCorners = "rounded-br";

                                    return (
                                        <Cell
                                            // disable if game is over
                                            disabled={gameInfo.winner !== null || gameInfo.moves === 9 || playerLeft}
                                            className={`${roundedCorners}`}
                                            onClick={() => makeMove(rowIndex, colIndex)}
                                            key={rowIndex + colIndex + (cell ?? "")}>
                                            <span>{cell}</span>
                                        </Cell>
                                    );
                                });
                            })}
                        </Board>
                        <TextChat isDisabled={playerLeft} />
                    </div>
                </>
            )}
            {playerLeft && (
                <div className="absolute top-0 left-0 w-full h-full bg-zinc-900/80 flex flex-col justify-center items-center">
                    <span>Player has disconnected</span>
                    <Button onPress={() => setRoomName("")} className="btn mt-1">
                        Okay
                    </Button>
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
            <div className="bg-white/20 border-2 border-white/5 w-full col-span-2 h-72 grid grid-rows-3 grid-cols-3 gap-1 rounded">
                {children}
            </div>
            {/* Information Board */}
            <div className="flex flex-col items-center justify-center gap-4 p-2 bg-black/40 border-2 border-white/20 rounded">
                <div className="grid grid-flow-row grid-cols-3 gap-y-1 items-center">
                    <div className="col-span-2 text-xs">
                        <span className="opacity-75">You're Player</span>
                    </div>
                    <div className="text-sm text-end">{selfSymbol}</div>
                    <div className="col-span-2 text-xs">
                        <span className="opacity-75">Current Player</span>
                    </div>
                    <div className="text-sm text-end">{gameInfo.currentPlayer}</div>
                    <div className="col-span-2 text-xs">
                        <span className="opacity-75">Winner</span>
                    </div>
                    <div className="text-sm text-end">{gameInfo.winner ?? "N/A"}</div>
                    <div className="col-span-2 text-xs">
                        <span className="opacity-75">Moves Made</span>
                    </div>
                    <div className="text-sm text-end">{gameInfo.moves}</div>
                </div>
                {moveMadeResponse && (
                    <span
                        className={`${
                            moveMadeResponse.includes("success") ? "text-green-600" : "text-red-600"
                        } text-sm opacity-75 font-bold`}>
                        {moveMadeResponse}
                    </span>
                )}
            </div>
            {/* Game over screen */}
            {(gameInfo.winner !== null || gameInfo.moves === 9) && (
                <div className="absolute top-0 left-0 w-full h-full bg-zinc-900/80 flex flex-col justify-center items-center">
                    <span className="text-5xl font-black mt-auto">{gameInfo.winner ? `${gameInfo.winner} wins!` : "Draw."}</span>
                    <Button
                        onPress={(e) => {
                            // Disable button on click
                            // No other way to disable button (without state or ref) through e.target
                            (e.target as HTMLButtonElement).disabled = true;
                            e.target.ariaDisabled = "true";
                            requestRematch();
                        }}
                        className="btn mt-auto">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
                            <path
                                fillRule="evenodd"
                                d="M15.312 11.424a5.5 5.5 0 01-9.201 2.466l-.312-.311h2.433a.75.75 0 000-1.5H3.989a.75.75 0 00-.75.75v4.242a.75.75 0 001.5 0v-2.43l.31.31a7 7 0 0011.712-3.138.75.75 0 00-1.449-.39zm1.23-3.723a.75.75 0 00.219-.53V2.929a.75.75 0 00-1.5 0V5.36l-.31-.31A7 7 0 003.239 8.188a.75.75 0 101.448.389A5.5 5.5 0 0113.89 6.11l.311.31h-2.432a.75.75 0 000 1.5h4.243a.75.75 0 00.53-.219z"
                                clipRule="evenodd"
                            />
                        </svg>
                        <span>Rematch</span>
                    </Button>
                    {rematchRequester && <p className="text-xs opacity-50">{rematchRequester} is requesting rematch.</p>}
                </div>
            )}
        </div>
    );
}
const Cell = forwardRef<HTMLButtonElement, ComponentProps<"button">>(function Cell({ className, children, ...rest }, ref) {
    return (
        // Give the cell same background color (but not transparent) to only keep the borders
        <button
            ref={ref}
            {...rest}
            className={`${className ?? ""} bg-black/90 hover:bg-black/60 active:bg-black/30 text-5xl font-black transition-all`}>
            {children}
        </button>
    );
});
