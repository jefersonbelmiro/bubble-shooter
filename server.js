var path = require('path');
var app = require('express')();
var http = require('http').createServer(app);
// var io = require('socket.io')(http, {origins: '*:*'});
var io = require('socket.io')(http, {origins: '*:*'});
var REQUEST_PATH = path.dirname(__dirname);

var clients = {};
var clientsByPlayer = {};
var playersByClient = {};
var rooms = [];
var roomByPlayer = {};

var PORT = 8080;
var TAGS = ['green', 'blue', 'yellow', 'red', 'magenta', 'orange'];
var STATE_CREATED = 'created';
var STATE_PLAYING = 'playing';

var PlayerDataQueue = {

    queue : {},
    running : {},
    attempts : {}
    tick : 30,
    limit : 30,

    nextTick : function(playerID, retry)
    {
        if (retry) {
            this.attempts[playerID] = this.attempts[playerID] + 1 || 1 ; 
            if (this.attempts[playerID] >= this.limit) {
                return clearTimeout(this.running[playerID]);
            }
        }
        return this.running[playerID] = setTimeout(this.send(playerID), this.tick);
    },

    add : function(playerID, key, data) 
    {
        if (!this.queue[playerID]) {
            this.queue[playerID] = [];
        }

        this.queue[playerID].push({key: key: data: data});
    },

    remove : function(playerID, data)
    {
        var index = this.queue[playerID].indexOf(data);
        if (index) {
            this.queue[playerID].splice(index);
        }
    },

    stop : function(playerID)
    {
        var tick = this.running[playerID];
        if (tick) {
            clearTimeout(tick);
        }
        delete this.queue[playerID];
        delete this.running[playerID];
        delete this.attempts[playerID];
    },

    send : function(playerID) 
    {
        var queue = this.queue[playerID];

        if (!queue || queue.length == 0) {
            return false;
        }

        var _this = this;
        var client = clientsByPlayer[playerID];

        if (!client) {
            return this.nextTick(playerID);
        }

        var running = this.running[playerID];
        if (running) {
            return this.nextTick(playerID, true);
        }

        var data = queue[0];

        client.emit(data.key, data, function() {
            _this.remove(playerID, data);
        });
    },

};

function getRoom(id)
{
    for (var i = 0, len = rooms.length; i < len; i++) {
        var room = rooms[i];
        if (room.id == id) {
            return room;
        }
    }
    return false;
}

function removeRoom(id)
{
    for (var i = 0, len = rooms.length; i < len; i++) {
        var room = rooms[i];
        if (room && room.id == id) {
            rooms.splice(i, 1);
        }
    }
    return false;
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

// io.set('origins', '*:*');
//
// app.use(function (req, res, next) {
//     res.header("Access-Control-Allow-Origin", "*");
//     res.header("Access-Control-Allow-Headers", "Cache-Control, Pragma, Origin, Authorization, Content-Type, X-Requested-With");
//     res.header("Access-Control-Allow-Methods", "GET, PUT, POST");
//     if ('OPTIONS' === req.method) {
//         res.status(204).send();
//     }
//     else {
//         next();
//     }
// });

io.on('connection', function(socket) {

    clients[socket.id] = socket;
    console.log('a user connected', Object.keys(clients).length, socket.id);

    socket.on('ping', function(done) {
        console.log('ping');
        done();
    });

    socket.on('disconnect', function() {

        console.log('a user disconnect', playersByClient[socket.id], Object.keys(clients).length, socket.id); 

        var playerId = playersByClient[socket.id];

        for (var i = 0, len = rooms.length; i < len; i++) {

            var room = rooms[i];

            if (!room) {
                continue;
            }

            var p1 = room.players[0];
            var p2 = room.players[1];

            if (p1.id == playerId) {
                if (p2) {
                    var p2Client = clients[clientsByPlayer[p2.id]];
                    
                    if (p2Client) {
                        p2Client.emit('host-close-room');
                    }
                }
                removeRoom(room.id);
                break;
            }

            if (p2 && p2.id == playerId) {
                room.players.pop();
                var p1Client = clients[clientsByPlayer[p1.id]];
                if (p1Client) {
                    p1Client.emit('player-leave-room', room);
                }
                break;
            } 
        }

        delete clientsByPlayer[playerId];
        delete playersByClient[socket.id];
        delete clients[socket.id];

        PlayerDataQueue.stop(playerId);
    });

    socket.on('join', function(playerId, done) {

        console.log('join', playerId);

        if (clientsByPlayer[playerId]) {
            return done('Nickname '+ playerId +' is already taken');
        }

        clientsByPlayer[playerId] = socket.id;
        playersByClient[socket.id] = playerId;
        done(false);
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
            enemyID = clientsByPlayer[p2.id];
        } else {
            enemyID = clientsByPlayer[p1.id];
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
