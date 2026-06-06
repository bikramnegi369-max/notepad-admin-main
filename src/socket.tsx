import { io } from "socket.io-client";

// const URL = "https://ns8qgl50-4444.inc1.devtunnels.ms";
const URL = "https://notepad-backend-f10dee9eba58.herokuapp.com";
const socket = io(URL, { autoConnect: false });


socket.onAny((event, ...args) => {
  console.log(event, args);
});

export default socket;