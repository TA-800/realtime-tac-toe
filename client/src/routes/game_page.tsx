import Button from "../components/button";
import Game from "../components/game";
import useSocket from "../components/useSocketHook";
import { useState, useEffect } from "react";

export default function GamePage() {
    const { socket, connected } = useSocket();
    const [username, setUsername] = useState("");
    const [gameRooms, setGameRooms] = useState<string[]>([]);
    const [roomName, setRoomName] = useState("");
    const [roomJoinError, setRoomJoinError] = useState("");
    const [connectError, setConnectError] = useState("");
    const [loading, setLoading] = useState(true);
    const [isAttemptingConnection, setIsAttemptingConnection] = useState(false);

    const onUsernameSubmit = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setIsAttemptingConnection(true);
        const username = (event.target as HTMLFormElement).username.value;
        setUsername(username);
        socket.auth = { username };
        socket.connect();
    };

    // Disconnect Error
    const handleConnectError = (err: Error) => {
        console.log(`%c${err}`, `color: #ff0000`);
        setUsername("");
    };

    // List of joinable rooms on search
    const handleSearchRooms = () => {
        socket.emit("get game rooms", (callback: string[]) => {
            console.log(callback);
            setGameRooms(callback);
        });
    };

    // socket.emit ("join room" with roomName & callback) and error handling
    const handleEmitRoomSearch = (roomName: string) => {
        socket.emit("join room", roomName, (callback: { status: string; playerSymbol: "X" | "O" | null; message: string }) => {
            console.log(callback);
            if (callback.status === "failure") {
                setRoomName("");
                setRoomJoinError(callback.message);
                return;
            }
            setRoomJoinError("");
            setRoomName(roomName);
        });
    };

    // Attempt join room on button click
    const handleRoomSubmit = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        const roomName = (event.target as HTMLFormElement).roomName.value;
        handleEmitRoomSearch(roomName);
    };

    const onTooManyConnections = () => {
        setConnectError("Server maxed out, retry later!");
    };

    useEffect(() => {
        socket.on("connect_error", handleConnectError);

        socket.on("too many connections", onTooManyConnections);

        if (!connected) return;

        if (connected) setIsAttemptingConnection(false);

        // Check if we have already connected before
        socket.emit("check joined room", (roomNameCallback: string) => {
            // Callback will be a roomName string
            setRoomName(roomNameCallback);
            setLoading(false);
        });

        return () => {
            socket.off("connect_error", handleConnectError);
            socket.off("too many connections", onTooManyConnections);
        };
    }, [connected]);

    return (
        <div>
            {/* Header: Server connection status + Disconnect button */}
            <div className="flex sm:flex-row sm:gap-10 flex-col gap-1 sm:items-center justify-between">
                <span className="text-sm opacity-75">
                    Server connection status: {connected ? "Connected." : "Not connected."}
                </span>
                {connected && (
                    <Button secondary className="h-9" onPress={() => socket.disconnect()}>
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
                            <path d="M2.22 2.22a.75.75 0 011.06 0l6.783 6.782a1 1 0 01.935.935l6.782 6.783a.75.75 0 11-1.06 1.06l-6.783-6.782a1 1 0 01-.935-.935L2.22 3.28a.75.75 0 010-1.06zM3.636 16.364a9.004 9.004 0 01-1.39-10.936L3.349 6.53a7.503 7.503 0 001.348 8.773.75.75 0 01-1.061 1.061zM6.464 13.536a5 5 0 01-1.213-5.103l1.262 1.262a3.493 3.493 0 001.012 2.78.75.75 0 01-1.06 1.06zM16.364 3.636a9.004 9.004 0 011.39 10.937l-1.103-1.104a7.503 7.503 0 00-1.348-8.772.75.75 0 111.061-1.061zM13.536 6.464a5 5 0 011.213 5.103l-1.262-1.262a3.493 3.493 0 00-1.012-2.78.75.75 0 011.06-1.06z" />
                        </svg>

                        <span>Disconnect</span>
                    </Button>
                )}
            </div>
            {!connected && (
                <div>
                    <form onSubmit={onUsernameSubmit} className="flex flex-col gap-2 mt-1">
                        <input className="input" type="text" name="username" id="username" placeholder="Username" required />
                        <Button type="submit" isDisabled={isAttemptingConnection}>
                            {isAttemptingConnection ? (
                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    viewBox="0 0 20 20"
                                    fill="currentColor"
                                    className="w-5 h-5 animate-spin animate-pulse">
                                    <path
                                        fillRule="evenodd"
                                        d="M15.312 11.424a5.5 5.5 0 01-9.201 2.466l-.312-.311h2.433a.75.75 0 000-1.5H3.989a.75.75 0 00-.75.75v4.242a.75.75 0 001.5 0v-2.43l.31.31a7 7 0 0011.712-3.138.75.75 0 00-1.449-.39zm1.23-3.723a.75.75 0 00.219-.53V2.929a.75.75 0 00-1.5 0V5.36l-.31-.31A7 7 0 003.239 8.188a.75.75 0 101.448.389A5.5 5.5 0 0113.89 6.11l.311.31h-2.432a.75.75 0 000 1.5h4.243a.75.75 0 00.53-.219z"
                                        clipRule="evenodd"
                                    />
                                </svg>
                            ) : (
                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    viewBox="0 0 20 20"
                                    fill="currentColor"
                                    className="w-5 h-5">
                                    <path d="M16.364 3.636a.75.75 0 00-1.06 1.06 7.5 7.5 0 010 10.607.75.75 0 001.06 1.061 9 9 0 000-12.728zM4.697 4.697a.75.75 0 00-1.061-1.06 9 9 0 000 12.727.75.75 0 101.06-1.06 7.5 7.5 0 010-10.607z" />
                                    <path d="M12.475 6.465a.75.75 0 011.06 0 5 5 0 010 7.07.75.75 0 11-1.06-1.06 3.5 3.5 0 000-4.95.75.75 0 010-1.06zM7.525 6.465a.75.75 0 010 1.06 3.5 3.5 0 000 4.95.75.75 0 01-1.06 1.06 5 5 0 010-7.07.75.75 0 011.06 0zM11 10a1 1 0 11-2 0 1 1 0 012 0z" />
                                </svg>
                            )}
                            <span>Connect</span>
                        </Button>
                        {connectError && <p className="text-red-500 font-semibold">{connectError}</p>}
                    </form>
                </div>
            )}
            {connected && loading && <div>Loading room information...</div>}
            {connected && !roomName && !loading && (
                <div className="p-2">
                    <p>Playing as {username}</p>
                    <hr className="hr mt-1 mb-2" />
                    <form onSubmit={handleRoomSubmit} className="flex flex-col gap-2 mb-2">
                        <input className="input" type="text" name="roomName" id="roomName" placeholder="Room Name" required />
                        {roomJoinError && (
                            <div>
                                <span className="text-red-500 text-sm opacity-75">{roomJoinError}</span>
                            </div>
                        )}
                        <div className="flex flex-row gap-1">
                            {/* Plus Icon */}
                            <Button type="submit">
                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    viewBox="0 0 20 20"
                                    fill="currentColor"
                                    className="w-5 h-5">
                                    <path
                                        fillRule="evenodd"
                                        d="M10 18a8 8 0 100-16 8 8 0 000 16zm.75-11.25a.75.75 0 00-1.5 0v2.5h-2.5a.75.75 0 000 1.5h2.5v2.5a.75.75 0 001.5 0v-2.5h2.5a.75.75 0 000-1.5h-2.5v-2.5z"
                                        clipRule="evenodd"
                                    />
                                </svg>

                                <span>Join</span>
                            </Button>
                            <Button type="button" onPress={handleSearchRooms}>
                                {/* Magnifying glass icon */}
                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    viewBox="0 0 20 20"
                                    fill="currentColor"
                                    className="w-5 h-5">
                                    <path d="M6.5 9a2.5 2.5 0 115 0 2.5 2.5 0 01-5 0z" />
                                    <path
                                        fillRule="evenodd"
                                        d="M10 18a8 8 0 100-16 8 8 0 000 16zM9 5a4 4 0 102.248 7.309l1.472 1.471a.75.75 0 101.06-1.06l-1.471-1.472A4 4 0 009 5z"
                                        clipRule="evenodd"
                                    />
                                </svg>

                                <span>Find</span>
                            </Button>
                        </div>
                    </form>
                    {/* List of rooms */}
                    <div className="h-64 w-64 overflow-y-scroll bg-black flex flex-col gap-1 p-2 rounded-md border-2 border-white/20">
                        {!gameRooms.length && (
                            <div>
                                <p className="opacity-75 text-sm">
                                    <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        viewBox="0 0 20 20"
                                        fill="currentColor"
                                        className="w-5 h-5 inline-block align-top">
                                        <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
                                    </svg>
                                    <span>No rooms found</span>.
                                </p>
                                <p className="opacity-50 text-xs">Try again or create one yourself!</p>
                            </div>
                        )}
                        {gameRooms.length > 0 &&
                            gameRooms.map((roomName, index) => {
                                return (
                                    <button
                                        onClick={() => handleEmitRoomSearch(roomName)}
                                        key={index}
                                        className="bg-slate-800 p-2 rounded hover:border-white/20 border-2 border-white/0 transition">
                                        {roomName}
                                    </button>
                                );
                            })}
                    </div>
                </div>
            )}
            {connected && roomName && <Game setRoomName={setRoomName} />}
        </div>
    );
}
