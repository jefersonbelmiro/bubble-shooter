var path = require('path');
var app = require('express')();
var http = require('http').createServer(app);
// var io = require('socket.io')(http, {origins: '*:*'});
var io = require('socket.io')(http, {origins: '*:*'});
var REQUEST_PATH = path.dirname(__dirname);

var clients = {};
var clientsByPlayer = {};
var rooms = {};

var PORT = 8080;
var TAGS = ['green', 'blue', 'yellow', 'red', 'magenta', 'orange'];
var STATE_CREATED = 'created';
var STATE_PLAYING = 'playing';

var PlayerDataQueue = require('./src/js/PlayerDataQueue.js');

var ProjectionAtTop = {
    
    angle : function(angle) {
        return 180 - angle;
    },

    trajectory : function(trajectory, board)
    {
        // x é igual
        // y diminiur da altura do board: board.y + board.height - trajectory.position.y
        return trajectory;
    },
}

function debug(message) 
{
    var now = new Date();
    var args = Array.prototype.slice.call(arguments);
    var time =  [
        '[', now.getFullYear(), '-', now.getMonth() + 1, '-', now.getDate(), ' ',
        now.getHours(), ':', now.getMinutes(), ':', now.getSeconds(), ":", now.getMilliseconds(), ']',
    ];

    args.unshift(time.join(''));
    console.log.apply(this, args);
}

function getRandomInt(min, max) 
{
    return Math.floor(Math.random() * (max - min + 1)) + min;
} 

function getRandomTag() 
{
    return TAGS[getRandomInt(0, TAGS.length - 1)];
}

function createGrid(maxRows, maxCols)
{
    var grid = [];

    for(var row = 0; row < maxRows; row++) {
    
        grid[row] = [];
        var mod = row % 2 === 0;

        for (var col = 0; col < maxCols; col++) {

            // last col
            if (!mod && col >= maxCols - 1) {
                continue;
            } 

            grid[row][col] = getRandomTag();
        }
    }

    return grid;
}

function createBubbles(len)
{
    var bubbles = [];

    for (var i = 0; i < len; i++) {
        bubbles.push(getRandomTag());
    }

    return bubbles;
}

io.on('connection', function(socket) {

    clients[socket.id] = socket;
    console.log('a user connected', Object.keys(clients).length, socket.id);

    socket.on('ping', function(done) {
        console.log('ping');
        done();
    });

    // @todo - verificar se socket.id ao cair mantem o id
    socket.on('disconnect', function() {

    });

    socket.on('join', function(data, done) {

        clients[socket.id] = socket;
        clientsByPlayer[data.playerID] = socket.id;
        playersByClient[socket.id] = data.playerID;

        done(false);

        if (data.reconnect) {
            if (playersAttempts[data.playerID]) {
                clearTimeout(playersAttempts[data.playerID]);
            }
            PlayerDataQueue.send(data.playerID);
        }
    });

    socket.on('player-fire', function(data, done) {

        var room = roomByPlayer[data.playerId];
        var p1 = room.players[0];
        var p2 = room.players[1];
        var tagsLoad = createBubbles(1);
        var playerID = data.playerId;
        var dataSend = {angle: data.angle, tag: data.tag, load: tagsLoad};

        console.log('player-fire', playerID);

        if (data.playerId == p1.id) {
            enemyID = p2.id;
        } else {
            enemyID = p1.id;
        }

        PlayerDataQueue.add(playerID, 'player-reload', tagsLoad);
        PlayerDataQueue.add(enemyID, 'player-fire', dataSend);
    });

    socket.on('finish', function(data) {

        console.log('game-finish', data);
        var p1 = data.room.players[0];
        var p2 = data.room.players[1];
        var client;
        console.log(' - game-finish', p1, p2);

        if (p1.id == data.winnerID) {
            client = clients[clientsByPlayer[p2.id]];
        } else {
            client = clients[clientsByPlayer[p1.id]];
        }
        client.emit('finish', data.winnerID);
        removeRoom(data.room.id);
    });

    socket.on('play', function(room, done) {

        var p1 = room.players[0];
        var p2 = room.players[1];
        var maxRows = 3;
        var maxCols = 8;

        p1.grid = createGrid(maxRows, maxCols);
        p1.bubbles = createBubbles(3);

        p2.grid = createGrid(maxRows, maxCols);
        p2.bubbles = createBubbles(3);

        var p2Client = clients[clientsByPlayer[p2.id]];

        if (!p2Client) {
            console.error('play - error', p1, p2);
            return done('player 2 client not found', room);
        }

        p2Client.emit('play', room);

        console.log('play', p1.bubbles, p2.bubbles);

        done(false, room);
    });

    socket.on('get-rooms', function(data, done) {
        done(false, rooms);
    });

    socket.on('leave-room', function(data, done) {

        console.log('leave-room', data.player.id);
        var room = getRoom(data.room);

        if (!room) {
            return done('Room not found');
        }

        var p1 = room.players[0];
        var p2 = room.players[1];

        console.log('  - leave-room', data, room, clientsByPlayer);

        if (data.player.id == p1.id) {
            if (p2) {
                clients[clientsByPlayer[p2.id]].emit('host-close-room');
                delete roomByPlayer[p2.id];
            }
            delete roomByPlayer[p1.id];
            removeRoom(data.room);
            return done(false);
        }

        delete roomByPlayer[p2.id];
        room.players.pop();
        var hostClient = clients[clientsByPlayer[p1.id]];
        hostClient.emit('player-leave-room', room);
        done(false);
    });

    socket.on('join-room', function(data, done) {

        console.log('join-room', data.player.id);
        var room = getRoom(data.room); 

        if (!room) {
            return done('Room not found');
        }

        if (room.players.length == 2) {
            return done('the room is full');
        }

        var p1 = room.players[0];
        room.players.push(data.player);
        console.log(' - join-room', room, p1);

        roomByPlayer[data.player.id] = room;
        var hostClient = clients[clientsByPlayer[p1.id]];
        
        if (!hostClient) {
            console.error('host client not found!');
            console.error(' - room', room);
            console.error(' - data', data);
            console.error(' - clientsByPlayer', clientsByPlayer);
            console.error(' - clients', Object.keys(clients));
            return done('host client not found!');
        }

        hostClient.emit('player-join-room', room);

        done(false, room);
    });

    socket.on('create-room', function(data, done) {

        console.log('create-room', data.player.id);
        var id = 'room-'+ (rooms.length < 10 ? '0'+rooms.length : rooms.length);
        var room = {
            id : id,
            name: data.name || id,
            host : data.player,
            players: [
                data.player,
            ],
            state : STATE_CREATED,
        }
        rooms.push(room);
        roomByPlayer[data.player.id] = room;
        done(false, room);

        socket.broadcast.emit('create-room');
    });

});

// app.get('/ping', function(req, res) {
//     res.send('pong');
// });

http.listen(PORT, function() {
    console.log('listening on ' + PORT);
});
