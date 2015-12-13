var BubbleShooter = require('./bubble-shooter.js');
var ROOM_STATE_CREATED = 'created';
var ROOM_STATE_PLAYING = 'playing';

function Server()
{
    this.socket = null;
    this.events = {};
    // this.host = '104.131.181.48';
    this.host = '127.0.0.1';
    this.port = 8080;
    this.path = 'http://'+this.host+':'+this.port;
    this.updateOnConnect = false;
    this.userDisconnect = false;
}

Server.prototype.send = function(data)
{
    return this.socket.send(data);
}

Server.prototype.emit = function(key, data, done)
{
    if (!this.socket) {
        return setTimeout(function() {
            return this.emit(key, data, done);
        }.bind(this), 100);
    }
    return this.socket.emit(key, data, done);
}

Server.prototype.on = function(key, done, context)
{
    this.events[key] = context ? done.bind(context) : done;
    this.socket.on(key, this.events[key]);
}

Server.prototype.once = function(key, done, context)
{
    this.removeListener(key);
    this.on(key, done, context);
},

Server.prototype.removeListener = function(key)
{
    if (this.events[key]) {
        this.socket.removeListener(key, this.events[key]);
    }
}

Server.prototype.removeAllListeners = function()
{
    return this.socket.removeAllListeners();
}

Server.prototype.connected = function()
{
    return this.socket && this.socket.connected;
}

Server.prototype.connect = function(done)
{
    var error = false;
    var errorMessage = 'no connection with server\ntry again later';

    if (!this.socket) {
        //reconnectionAttempts: 5
        this.socket = io(this.path, {port: this.port, secure: false});
    }

    if (!this.connected()) {
        this.socket = this.socket.connect();
    }

    if (!this.socket) {
        return done(errorMessage);
    } 

    this.removeAllListeners();
    this.registryDefaultEvents();

    var attempts = 0;
    this.socket.on('connect_error', function() {

        console.log('socket.on connect_error', attempts+1);

        if (++attempts > 6) {
            console.log('connect_error abort');
            attempts = 0;
            this.disconnect();
            done(errorMessage);
        } 

    }.bind(this));  

    this.socket.on('connect', done);
}

Server.prototype.registryDefaultEvents = function()
{
    var _this = this;
    this.socket.on('connect', function() {
        _this.userDisconnect = false;
        console.log('connect', _this.updateOnConnect);
        var data = {
            playerID : BubbleShooter.nickname,
            reconnect : _this.updateOnConnect,
        };
        _this.socket.emit('join', data, function(error) {
            if (error) console.error('join error', error);
        });
    });

    this.socket.on('disconnect', function() { 
        _this.updateOnConnect = !_this.userDisconnect;
        console.log('disconnect', _this.updateOnConnect);
    }); 

    this.socket.on('error', function() {
        console.error('socket.on error:', arguments);
    });
}

Server.prototype.ping = function(done)
{
    console.log('ping');
    var last = Date.now();
    this.socket.emit('ping', function() {
        console.log('pong');
        done(Date.now() - last);
    });
}

Server.prototype.disconnect = function()
{
    this.userDisconnect = true;
    this.socket.disconnect();
}

Server.prototype.requireSocketLibray = function(done)
{
    if (window.io) {
        return done();
    }
    
    var head = document.getElementsByTagName('head')[0];
    var node = document.createElement('script');
    node.addEventListener('load', function() {
        done(false);
    });
    node.addEventListener('error', function() {
        console.error('erro ao carregar script');
        done('Error');
    });
    node.src = this.path + '/socket.io/socket.io.js';
    node.async = true;
    head.appendChild(node);
}

module.exports = Server;
