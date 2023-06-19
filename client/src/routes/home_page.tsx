/* This will be the page that initiates connection to socket.io server. */
import io from "socket.io-client";

/* Start a "socket" connection to socket.io server. */
const socket = io("http://localhost:3001");

export default function HomePage() {
    return <div>Hello Homepage!</div>;
}
