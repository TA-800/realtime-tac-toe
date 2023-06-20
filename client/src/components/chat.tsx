import { useState } from "react";

export type Message = {
    content: string;
    username: string;
};

export default function Chat({
    roomId,
    username,
    roomMsgs,
    emitMessage,
    handleReceiveMessage,
}: {
    roomId: string;
    username: string;
    roomMsgs: Message[];
    emitMessage: (msg: Message) => void;
    handleReceiveMessage: (msg: Message) => void;
}) {
    const [messageInput, setMessageInput] = useState("");

    return (
        <div className="bg-zinc-950 border-2 border-white/20 rounded-md p-2">
            <div className="flex flex-col gap-2 h-48 overflow-y-scroll">
                {roomMsgs.map((msg, i) => (
                    <Messasge key={i} content={msg.content} username={msg.username} />
                ))}
            </div>
            <div className="mt-2 flex flex-row gap-2">
                <input
                    type="text"
                    onChange={(e) => setMessageInput(e.target.value)}
                    value={messageInput}
                    className="bg-gray-700 rounded-md p-2 w-full text-white"
                    placeholder={`Type as ${username} `}
                />
                <button
                    disabled={messageInput.length <= 0}
                    onClick={() => {
                        emitMessage({ content: messageInput, username: username });
                        setMessageInput("");
                    }}
                    className="bg-blue-600 hover:bg-blue-700 rounded-md px-4 py-2">
                    Send
                </button>
            </div>
        </div>
    );
}

function Messasge({ content, username }: Message) {
    return (
        <div className="bg-gray-700 rounded-md p-2">
            <p className="font-bold">{username}:</p>
            <p>{content}</p>
        </div>
    );
}
