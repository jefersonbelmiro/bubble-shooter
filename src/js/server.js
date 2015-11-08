var BubbleShooter = require('./bubble-shooter.js');
var ROOM_STATE_CREATED = 'created';
var ROOM_STATE_PLAYING = 'playing';

function Server()
{
    this.socket = null;
    this.events = {};
    this.host = '104.131.181.48';
    // this.host = '127.0.0.1';
    this.port = 8080;
    this.path = 'http://'+this.host+':'+this.port;
    this.updateOnConnect = false;
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
    this.socket.removeAllListeners();
    this.registryDefaultEvents();
    return true;
}

Server.prototype.connected = function()
{
    return this.socket && this.socket.connected;
}

Server.prototype.connect = function(done)
{
    if (this.socket) {
        if (false == this.connected()) {
            var error = !this.socket.connect();
        }
        return done(error);
    }
    var connect = function()
    {
        var socket = io(this.path, {port: this.port, secure: false});
        this.socket = socket.connect();

        if (!this.socket) {
            console.error('path', this.path, this.port);
            console.error('io', io);
            console.error('socket', this.socket);
            return done('error connecting to the server');
        } 

        this.registryDefaultEvents();

        done();
    }

    connect.call(this);

    // this.requireSocketLibray(function(error) {
    //     if (error) {
    //         return done(error);
    //     }
    //     connect.call(this);
    // }.bind(this));
}

Server.prototype.registryDefaultEvents = function()
{
    var _this = this;
    this.socket.on('connect', function() {
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
        _this.updateOnConnect = true;
        console.log('disconnect');
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
    return this.socket.disconnect();
}

Server.prototype.getRooms = function(done)
{
    this.emit('get-rooms', {}, done);
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
