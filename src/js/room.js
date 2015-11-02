var BubbleShooter = require('./bubble-shooter.js');
var Utils = require('./utils.js');
var Server = require('./server.js');

var Room = function(_game) {
    this.game = _game;
}    

Room.prototype = {

    create: function() 
    {
        BubbleShooter.joinRoom = false;

        if (!BubbleShooter.server) {
            BubbleShooter.server = new Server();
        }

        BubbleShooter.server.connect(function(error) {

            this.createButton('back', {position: {x : 66, y: 35}, callback: this.back, context: this});

            if (error) {
                return this.createLabel('error connecting to the server', {position: {x: 20, y: 80}});
            }

            this.createLabel('Select room', { position: {x : 10, y: 70}});
            this.createButton('Create room', {position: {x : 442, y: 35}, callback: this.createRoom, context: this});

            BubbleShooter.server.removeAllListeners();

            // notify
            BubbleShooter.server.once('create-room', function() {
                this.createListRooms();
            }, this);

            BubbleShooter.joinServer = BubbleShooter.server.connected();

            this.createListRooms(); 

        }.bind(this));
    },

    createLabel: function(text, data)
    {
        var bitmap = this.game.add.bitmapText(data.position.x, data.position.y, 'font', text, 20);
        return bitmap;
    },

    createButton: function(label, data)
    {
        data.label = label;
        return Utils.createButton(data)
    },

    createListRooms: function()
    {
        var width = 566;
        var height = 900;

        var background = BubbleShooter.game.add.sprite(10, 110, Utils.createRect(width, height, '#333'));
        var textLoading = this.createLabel('loading...', {position: {x: 20, y: 120}});

        var getRooms = function(error, rooms)
        {
            textLoading.destroy();
            rooms.reverse();
            if (rooms.length == 0) {
                return this.createLabel('no room was created', {position: {x: 20, y: 120}});
            }

            var position = { x: 20, y: 120 };

            for (var i = 0, len = rooms.length; i < len; i++) {

                var room = rooms[i];
                var size = room.players.length + '/2';
                var join = room.players.length < 2;

                var bgItem = BubbleShooter.game.add.sprite(position.x, position.y, Utils.createRect(545, 48, '#222'));
                this.createLabel(room.name, {position: {x: position.x + 10, y: position.y + 5}});
                this.createLabel(size, {position: {x: position.x + 240, y: position.y + 5}});
                var _this = this;

                if (join) {
                    var buttom = this.createButton('join', {
                        position: {x: position.x + 504, y: position.y + 25}, 
                        fontSize: 20, 
                        context: this,
                        callback: (function(room) {
                            return function() {          
                                this.join(room);
                            } 
                        })(room)
                    });
                    buttom.room = room;
                } else {
                    this.createLabel('Full', {position: {x: position.x + 480, y: position.y + 7}});
                }

                position.y += 60;
            }
        }
        BubbleShooter.server.getRooms(getRooms.bind(this));
    },

    join: function(room)
    {
        BubbleShooter.joinRoom = room;
        this.state.start('room-create'); 
    },

    back: function()
    {
        if (BubbleShooter.joinServer) {
            BubbleShooter.joinServer = false;
            BubbleShooter.server.disconnect();
        }
        this.state.start('menu');
    },

    createRoom: function()
    {
        this.state.start('room-create'); 
    },

} 

module.exports = Room;
