const { createServer } = require("http");
const { Server } = require("socket.io");
const { generateCode, releaseCode } = require("./roomCodeManager");
const { request } = require("https");

const port = process.env.PORT || 8524;

const httpServer = createServer() 
const io = new Server(httpServer, { 
    cors: {
        origin: process.env.ORIGIN_URL || 'http://localhost:5173',
        methods: ["GET", "POST"]
    }
});

var rooms = {};

io.on("connection", (socket) => {
    console.log('connected: ' + socket.id);

    socket.on("ROOM_CREATE_REQUEST", (request, callback) => {
        const roomCode = generateCode();
        socket.join(roomCode);
        rooms[roomCode] = {
            id: roomCode,
            players: {},
        };
        rooms[roomCode].players[request.playerId] = {
            name: '???',
            state: 'active'
        };
        callback(rooms[roomCode]);
    });

    socket.on("ROOM_JOIN_REQUEST", (request, callback) => {
        if(!io.sockets.adapter.rooms.get(request.roomCode)) {
            return callback(null);
        }

        socket.join(request.roomCode);

        rooms[request.roomCode].players[request.playerId] = {
            name: '???',
            state: 'active'
        };

        socket.to(request.roomCode).emit("ROOM_UPDATE", rooms[request.roomCode]);
        callback(rooms[request.roomCode]);
    });


    socket.on("PLAYER_UPDATE_REQUEST", (roomId, playerId, request, callback) => {
        rooms[roomId].players[playerId] = {
            ...rooms[roomId].players[playerId],
            ...request
        };

        socket.to(roomId).emit("ROOM_UPDATE", rooms[roomId]);
        callback(rooms[roomId]);
    });
});

io.sockets.adapter.on('delete-room', (room) => {
    releaseCode(room)
    delete rooms[room]
});

// Server listening to port 3000 
httpServer.listen(port, () => console.log('listening on: ' + port));

