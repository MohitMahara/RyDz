import { io } from "socket.io-client"

const socket = io(
  import.meta.env.VITE_BACKEND_URL ?? "http://localhost:5000",
  {
    autoConnect: false,
    transports: ["websocket"],
    auth: (cb) => {
      const data = localStorage.getItem("rydz-auth")
      const token = data ? JSON.parse(data)?.token : null

      cb({ token })
    },
  }
)

export default socket