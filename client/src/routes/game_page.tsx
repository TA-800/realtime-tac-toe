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
    const [loading, setLoading] = useState(true);

    const onUsernameSubmit = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
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

    useEffect(() => {
        socket.on("connect_error", handleConnectError);

        // Check if we have already connected before
        socket.emit("check joined room", (roomNameCallback: string) => {
            // Callback will be a roomName string
            setRoomName(roomNameCallback);
            setLoading(false);
        });

        return () => {
            socket.off("connect_error", handleConnectError);
        };
    }, []);

    return (
        <div>
            <span className="text-sm opacity-75">Server connection status: {connected ? "Connected." : "Not connected."}</span>
            {!connected && (
                <div>
                    <form onSubmit={onUsernameSubmit} className="flex flex-col gap-1">
                        <input className="input" type="text" name="username" id="username" placeholder="Username" required />
                        <Button type="submit">
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
                                <path d="M12.232 4.232a2.5 2.5 0 013.536 3.536l-1.225 1.224a.75.75 0 001.061 1.06l1.224-1.224a4 4 0 00-5.656-5.656l-3 3a4 4 0 00.225 5.865.75.75 0 00.977-1.138 2.5 2.5 0 01-.142-3.667l3-3z" />
                                <path d="M11.603 7.963a.75.75 0 00-.977 1.138 2.5 2.5 0 01.142 3.667l-3 3a2.5 2.5 0 01-3.536-3.536l1.225-1.224a.75.75 0 00-1.061-1.06l-1.224 1.224a4 4 0 105.656 5.656l3-3a4 4 0 00-.225-5.865z" />
                            </svg>
                            <span>Connect</span>
                        </Button>
                    </form>
                </div>
            )}
            {connected && loading && <div>Loading room information...</div>}
            {connected && !roomName && !loading && (
                <div className="space-y-4">
                    <p>Playing as {username}</p>
                    <hr className="hr" />
                    <form onSubmit={handleRoomSubmit} className="flex flex-col gap-1">
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
                    <div className="h-64 w-64 overflow-y-scroll bg-black flex flex-col gap-1 p-2">
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
