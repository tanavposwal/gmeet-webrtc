import express from "express";
import http from "http";
import { Server, Socket } from "socket.io";

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "http://localhost:5173",
  },
});

type Room = {
  [roomId: string]: {
    users: string[];
  };
};

const rooms: Room = {};

io.on("connection", (socket: Socket) => {
  console.log("A user connected:", socket.id);

  socket.on("disconnect", () => {
    console.log("A user disconnected:", socket.id);
    for (const roomId in rooms) {
      rooms[roomId].users = rooms[roomId].users.filter((id) => id !== socket.id);
      if (rooms[roomId].users.length === 0) delete rooms[roomId];
    }
  });

  socket.on("join", ({ roomId }: { roomId: string }) => {
    if (!rooms[roomId]) rooms[roomId] = { users: [] };
    if (!rooms[roomId].users.includes(socket.id)) {
      rooms[roomId].users.push(socket.id);
    }
    console.log(`${socket.id} joined room ${roomId}`);
  });

  socket.on("localDescription", ({ description }: { description: RTCSessionDescriptionInit }) => {
    const roomId = Object.keys(rooms).find((room) => rooms[room].users.includes(socket.id));
    if (roomId) {
      rooms[roomId].users.forEach((userId) => {
        if (userId !== socket.id) {
          io.to(userId).emit("localDescription", { description, senderId: socket.id });
        }
      });
    }
  });

  socket.on("remoteDescription", ({ description }: { description: RTCSessionDescriptionInit }) => {
    const roomId = Object.keys(rooms).find((room) => rooms[room].users.includes(socket.id));
    if (roomId) {
      rooms[roomId].users.forEach((userId) => {
        if (userId !== socket.id) {
          io.to(userId).emit("remoteDescription", { description, senderId: socket.id });
        }
      });
    }
  });

  socket.on("iceCandidate", ({ candidate }: { candidate: RTCIceCandidateInit }) => {
    const roomId = Object.keys(rooms).find((room) => rooms[room].users.includes(socket.id));
    if (roomId) {
      rooms[roomId].users.forEach((userId) => {
        if (userId !== socket.id) {
          io.to(userId).emit("iceCandidate", { candidate, senderId: socket.id });
        }
      });
    }
  });
});

server.listen(3000, () => {
  console.log("Server listening on *:3000");
});
