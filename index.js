const { createServer } = require("http");
const { Server } = require("socket.io");
const { generateCode, releaseCode } = require("./roomCodeManager");

const port = process.env.PORT || 5000;

const httpServer = createServer() 
const io = new Server(httpServer, { 
    cors: {
        origin: process.env.ORIGIN_URL || 'http://localhost:8080',
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
            state: 'hidden',
            id: roomCode,
            players: {},
        };
        rooms[roomCode].players[request.playerId] = {
            name: request.playerName,
            spectating: false,
            card: ''
        };
        callback(rooms[roomCode]);
    });

    socket.on("ROOM_JOIN_REQUEST", (request, callback) => {
        if(!io.sockets.adapter.rooms.get(request.roomCode)) {
            return callback(null);
        }

        socket.join(request.roomCode);

        if (!rooms[request.roomCode].players[request.playerId]) {
            rooms[request.roomCode].players[request.playerId] = {
                name: request.playerName,
                state: 'active',
                card: ''
            };
        }

        socket.to(request.roomCode).emit("ROOM_UPDATE", rooms[request.roomCode]);
        callback(rooms[request.roomCode]);
    });


    socket.on("PLAYER_UPDATE_REQUEST", (roomId, playerId, request, callback) => {
        if(!io.sockets.adapter.rooms.get(roomId)) {
            return callback(null);
        }

        rooms[roomId].players[playerId] = {
            ...rooms[roomId].players[playerId],
            ...request
        };

        socket.to(roomId).emit("ROOM_UPDATE", rooms[roomId]);
        callback(rooms[roomId]);
    });

    socket.on("ROOM_UPDATE_REQUEST", (roomId, state, callback) => {
        if(!io.sockets.adapter.rooms.get(roomId)) {
            return callback(null);
        }
        if (state != 'hidden' && state != 'reveal') {
            return;
        }

        rooms[roomId].state = state;

        if (state == 'hidden') {
            for (const player of Object.keys(rooms[roomId].players)) {
                rooms[roomId].players[player].card = '';
            }
        }

        socket.to(roomId).emit("ROOM_UPDATE", rooms[roomId]);
        callback(rooms[roomId]);
    });

    socket.on("PLAYER_LEAVE_REQUEST", (roomId, playerId, callback) => {
        if(!io.sockets.adapter.rooms.get(roomId)) {
            return callback(null);
        }

        delete rooms[roomId].players[playerId];
        socket.leave(roomId);
        
        socket.to(roomId).emit("ROOM_UPDATE", rooms[roomId]);
        callback(rooms[roomId]);
    });
});

io.sockets.adapter.on('delete-room', (room) => {
    releaseCode(room)
    delete rooms[room]
});

httpServer.listen(port, '0.0.0.0',() => console.log('listening on: ' + port));

