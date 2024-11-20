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
		roomId: string,
		users: string[]
	};
}

type User = {
	[userId: string]: {
		roomId: string
	};
}

const rooms: Room = {};
const users: User = {};

io.on("connection", (socket: Socket) => {
	console.log("a user connected " + socket.id);

	// user disconnects
	socket.on("disconnect", () => {
		Object.keys(rooms).map((roomId) => {
			rooms[roomId].users = rooms[roomId].users.filter((x) => x !== socket.id);
		});
		delete users[socket.id];
	});
	
	// user join a meeting
	socket.on("join", (params: {roomId: string}) => {
		const roomId = params.roomId;
		users[socket.id] = {
			roomId: roomId,
		};
		if (!rooms[roomId]) {
			rooms[roomId] = {
				roomId,
				users: [],
			};
		}
		rooms[roomId].users.push(socket.id);
		console.log("user added to room " + roomId);
	});

	socket.on("localDescription", (params: {description: string}) => {
		let roomId = users[socket.id].roomId;

		let otherUsers = rooms[roomId].users;
		otherUsers.forEach((otherUser) => {
			if (otherUser !== socket.id) {
				io.to(otherUser).emit("localDescription", {
					description: params.description,
				});
			}
		});
	});

	socket.on("remoteDescription", (params: {description: string}) => {
		let roomId = users[socket.id].roomId;
		let otherUsers = rooms[roomId].users;

		otherUsers.forEach((otherUser) => {
			if (otherUser !== socket.id) {
				io.to(otherUser).emit("remoteDescription", {
					description: params.description,
				});
			}
		});
	});

	socket.on("iceCandidate", (params: {candidate: string}) => {
		let roomId = users[socket.id].roomId;
		let otherUsers = rooms[roomId].users;

		otherUsers.forEach((otherUser) => {
			if (otherUser !== socket.id) {
				io.to(otherUser).emit("iceCandidate", {
					candidate: params.candidate,
				});
			}
		});
	});

	socket.on("iceCandidateReply", (params: {candidate: string}) => {
		let roomId = users[socket.id].roomId;
		let otherUsers = rooms[roomId].users;

		otherUsers.forEach((otherUser) => {
			if (otherUser !== socket.id) {
				io.to(otherUser).emit("iceCandidateReply", {
					candidate: params.candidate,
				});
			}
		});
	});
});

server.listen(3000, () => {
	console.log("listening on *:3000");
});
