// This file is socket handler
import { useEffect, useState, useRef } from "react";
import { socket } from "../socket";
import Chat, { Message } from "../components/chat";

export default function GamePage() {
    const [socketId, setSocketId] = useState("");
    const [username, setUsername] = useState("");
    const [roomJoined, setRoomJoined] = useState("");
    const [roomMsgs, setRoomMsgs] = useState<Message[]>([
        { content: "Hello", username: "John" },
        { content: "Hi", username: "Jane" },
        { content: "How are you?", username: "John" },
        { content: "I'm fine", username: "Jane" },
    ]);
    const [disableJoinButton, setDisableJoinButton] = useState(true);
    const joinRoomRef = useRef<HTMLInputElement>(null);

    const onConnect = () => {
        console.log("Connected to server");
        setSocketId(socket.id);
    };

    const onDisconnect = () => {
        console.log("Disconnected from server");
        setSocketId("");
    };

    const onUserConnected = (msg: any) => {
        console.log(msg);
    };

    const handleJoin = (roomId: string) => {
        socket.emit("join-room", { username: username, roomId: roomId });
        setRoomJoined(roomId);
    };

    const handleReceiveMessage = (msg: Message) => {
        // Will also receive message sent by this client
        setRoomMsgs((prev) => [...prev, msg]);
    };

    const emitMessage = (msg: Message) => {
        socket.emit("send-message", { ...msg, roomId: roomJoined });
    };

    useEffect(() => {
        socket.connect();
        socket.on("connect", onConnect);
        socket.on("disconnect", onDisconnect);
        socket.on("user-connected", onUserConnected);
        socket.on("receive-message", handleReceiveMessage);

        return () => {
            socket.off("connect", onConnect);
            socket.off("disconnect", onDisconnect);
            socket.off("user-connected", onUserConnected);
            socket.off("receive-message", handleReceiveMessage);
            socket.disconnect();
        };
    }, []);

    if (!socketId) return <div>Connecting to server...</div>;

    return (
        <>
            {roomJoined.length > 0 && (
                <div>
                    <Chat
                        roomId={roomJoined}
                        username={username}
                        emitMessage={emitMessage}
                        handleReceiveMessage={handleReceiveMessage}
                        roomMsgs={roomMsgs}
                    />
                </div>
            )}
            {roomJoined.length <= 0 && (
                <div className="h-full w-full @container">
                    <div className="flex flex-col gap-5">
                        <div className="flex flex-col gap-1">
                            <span className="text-sm opacity-75 pl-1">Set your username here.</span>
                            <div className="flex flex-row gap-2">
                                <input
                                    onChange={(e) => setUsername(e.target.value)}
                                    placeholder="Username"
                                    className="bg-black p-2 rounded-md border-2 border-white/20"
                                />
                            </div>
                        </div>
                        <div className="flex flex-col gap-1">
                            <span className="text-sm opacity-75 pl-1">Enter Room ID below to join room.</span>
                            <div className="flex flex-row gap-2">
                                <input
                                    ref={joinRoomRef}
                                    onChange={(e) => {
                                        // If input is empty, disable join button
                                        if (e.target.value === "") setDisableJoinButton(true);
                                        else setDisableJoinButton(false);
                                    }}
                                    placeholder="Room ID"
                                    className="bg-black p-2 rounded-md border-2 border-white/20"
                                />
                                <button
                                    className="bg-blue-700 px-4 rounded-md"
                                    disabled={disableJoinButton}
                                    onClick={() => handleJoin(joinRoomRef.current!.value)}>
                                    Join
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
