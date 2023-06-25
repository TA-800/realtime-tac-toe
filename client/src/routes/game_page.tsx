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
                        <input className="input" type="text" name="username" id="username" placeholder="Username" />
                        <button className="btn" type="submit">
                            Connect
                        </button>
                    </form>
                </div>
            )}
            {connected && loading && <div>Loading room information...</div>}
            {connected && !roomName && !loading && (
                <div className="space-y-4">
                    <span>Playing as {username}</span>
                    <hr className="hr" />
                    <form onSubmit={handleRoomSubmit} className="flex flex-col gap-1">
                        <input className="input" type="text" name="roomName" id="roomName" placeholder="Room Name" required />
                        {roomJoinError && (
                            <div>
                                <span className="text-red-500 text-sm opacity-75">{roomJoinError}</span>
                            </div>
                        )}
                        <div className="flex flex-row gap-1">
                            <button className="btn">Join Room</button>
                            <button className="btn" type="button" onClick={handleSearchRooms}>
                                Room Search
                            </button>
                        </div>
                    </form>
                    {/* List of rooms */}
                    <div className="h-64 w-64 overflow-y-scroll bg-black flex flex-col gap-1 p-2">
                        {gameRooms.map((roomName, index) => {
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
            {connected && roomName && <Game />}
        </div>
    );
}
