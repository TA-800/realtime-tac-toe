import Game from "../components/game";
import useSocket from "../components/useSocketHook";
import { createRef, useState } from "react";

export default function GamePage() {
    const { socket, connected } = useSocket();
    const [availableRooms, setAvailableRooms] = useState<string[]>([]);
    const [roomJoined, setRoomJoined] = useState<string>("");
    const [username, setUsername] = useState<string>("");
    // const [playerNumber, setPlayerNumber] = useState<number | null>(null);
    const inputRef = createRef<HTMLInputElement>();
    const usernameRef = createRef<HTMLInputElement>();

    const searchRooms = () => {
        socket.emit("search-for-room", function (callback: string[]) {
            console.log(callback);
            setAvailableRooms(callback);
        });
    };

    const joinRoom = (roomName: string, providedUsername: string) => {
        socket.emit(
            "attempt-join-room",
            roomName,
            providedUsername,
            function (callback: { status: string; player: number; message: string }) {
                console.log(callback);
                if (callback.status === "success") {
                    setUsername(providedUsername);
                    setRoomJoined(roomName);
                    if (callback.player === 2) {
                        // If player joined has number 2, that means two players have joined the room and we can start the game
                        socket.emit("start-game", roomName);
                        /* This event needs to be emitted client-side because server (apparently) doesn't wait for player's join event to fully complete
                        (which means server can emit start-game before player has fully successfully joined the room). */
                    }
                }
                if (callback.status === "failure") {
                    alert(callback.message);
                    return;
                }
            }
        );
    };

    if (!connected) {
        return <div>Connecting...</div>;
    }

    return (
        <>
            Your socket id is: {socket.id}
            {roomJoined && (
                <div>
                    <Game username={username} roomId={roomJoined} />
                </div>
            )}
            {!roomJoined && (
                <div className="flex flex-col">
                    <div className="flex flex-col gap-2 w-72">
                        <input
                            ref={usernameRef}
                            placeholder="Username"
                            className="bg-zinc-900 border-2 border-white/20 rounded-md px-4 py-2 "
                        />
                        <input
                            ref={inputRef}
                            placeholder="Room ID"
                            className="bg-zinc-900 border-2 border-white/20 rounded-md px-4 py-2 "
                        />
                        <div className="flex flex-row justify-between">
                            <button
                                onClick={() => joinRoom(inputRef.current!.value, usernameRef.current!.value)}
                                className="bg-blue-600 rounded-md px-4 py-2 ">
                                Join room
                            </button>
                            <button onClick={() => searchRooms()} className="bg-blue-600 rounded-md px-4 py-2">
                                Search rooms
                            </button>
                        </div>
                        {/* Available rooms */}
                        <div className="bg-zinc-800 w-full h-64 overflow-y-scroll">
                            {availableRooms.map((room, i) => (
                                <div key={i}>{room}</div>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
