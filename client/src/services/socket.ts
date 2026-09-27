import { io } from "socket.io-client"

const socket = io(import.meta.env.VITE_SOCKET_URL ?? "http://localhost:5000", {
  autoConnect: false,
  transports: ["websocket"],
  auth: (cb) => {
    cb({ token: localStorage.getItem("rydz_token") })
  },
})

export default socket
