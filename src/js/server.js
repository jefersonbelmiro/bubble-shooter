;(function(exports) {

    var ROOM_STATE_CREATED = 'created';
    var ROOM_STATE_PLAYING = 'playing';

    function Server()
    {
        this.socket = null;
        this.events = {};
        this.host = '104.131.181.48';
        // this.host = '127.0.0.1';
        this.port = 8888;
        this.path = 'http://'+this.host+':'+this.port;
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
        if (this.socket) {
            if (false == this.connected()) {
                var error = !this.socket.connect();
            }
            return done(error);
        }
        var connect = function()
        {
            this.socket = io(this.path);
            var connected = this.socket.connect(); 
            if (!connected) {
                return done('error connecting to the server');
            }
            done();
        }
        this.requireSocketLibray(function(error) {
            if (error) {
                return done(error);
            }
            connect.call(this);
        }.bind(this));
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
        var head = document.getElementsByTagName('head')[0];
        var node = document.createElement('script');
        node.addEventListener('load', function() {
            done(false);
        });
        node.addEventListener('error', function() {
            done('Error');
        });
        node.src = this.path + '/socket.io/socket.io.js';
        node.async = true;
        head.appendChild(node);
    }

    exports.Server = Server;

})(BubbleShoot);
