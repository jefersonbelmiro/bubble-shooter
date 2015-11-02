var BubbleShooter = require('./bubble-shooter.js');
var Utils = require('./utils.js');

var RoomCreate = function(_game) {

    this.entities = [];
    this.game = _game;
}    

RoomCreate.prototype = {

    create: function() 
    {
        this.game.stage.disableVisibilityChange = true;

        delete this.room;
        BubbleShooter.server.removeAllListeners();

        this.createButton('back', {position: {x : 66, y: 35}, callback: this.back, context: this});
        var background = BubbleShooter.game.add.sprite(10, 110, Utils.createRect(566, 900, '#333'));
        var data = { player : {id: BubbleShooter.nickname}};

        this.text = this.createLabel('Connecting to server...', { position: {x : 10, y: 70}});

        // join
        if (BubbleShooter.joinRoom) {
            data.room = BubbleShooter.joinRoom.id;
            BubbleShooter.server.emit('join-room', data, function(error, room) {
                if (error) {
                    console.error(error);
                    return this.back();
                }
                this.updateList(room);
            }.bind(this)); 

            BubbleShooter.server.once('host-close-room', function(room) {
                this.room = false;
                this.back();
            }, this);

            BubbleShooter.server.once('play', function(room) {
                BubbleShooter.room = room;
                this.state.start('game');
            }, this);

            return;
        }

        // another player join room
        BubbleShooter.server.once('player-join-room', function(room) {
            this.updateList(room)
        }, this);

        // another player leave room
        BubbleShooter.server.once('player-leave-room', function(room) {
            this.updateList(room)
        }, this);

        // create
        BubbleShooter.server.emit('create-room', data, function(error, room) {
            this.updateList(room);
        }.bind(this)); 
    },

    updateList : function(room)
    {
        this.clearEntities();
        this.room = room;
        this.text.setText(room.name);
        var itemData = { position: {x : 20, y: 120}};
        for (var i = 0, len = room.players.length; i < len; i++) {

            this.createItem('#' + (i + 1) + ' - ' + room.players[i].id, itemData);
            itemData.position.y += 55;
        }

        if (BubbleShooter.nickname == room.host.id) {
            var playButton = this.createButton('Play', {position: {x : 525, y: 35}, callback: this.play, context: this});
            this.entities.push(playButton);
        }
    },

    play: function()
    {
        var room = this.room;
        var _this = this;

        if (!room) {
            return alert('Error: room not found');
        }

        if (room.players.length < 2) {
            return alert('room is not full');
        }

        BubbleShooter.server.emit('play', room, function(error, room) {

            console.log('play', room);
            BubbleShooter.room = room;
            _this.state.start('game');
        });
    },

    createItem: function(label, data)
    {
        var width = 545;
        var height = 48;
        var background = BubbleShooter.game.add.sprite(data.position.x, data.position.y, Utils.createRect(width, height, '#222'));
        var label = this.createLabel(label, {position: {x: data.position.x + 10, y: data.position.y + 5}});
        var button = this.createButton('ready', {position: {x: data.position.x + 493, y: data.position.y + 24}, fontSize: 20, background: '#333'})
        this.entities.push(background);
        this.entities.push(label);
        this.entities.push(button);
    },

    clearEntities: function()
    {
        for (var i = 0, len = this.entities.length; i < len; i++) {
            if (this.entities[i]) {
                this.entities[i].destroy();
            }
        }
        this.entities = [];
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

    back: function()
    {
        var back = function()
        {
            this.state.start('room');
        }

        if (!this.room) {
            return back.call(this);
        }

        var data = { player : {id: BubbleShooter.nickname}, room : this.room.id};
        return BubbleShooter.server.emit('leave-room', data, back.bind(this));
    },

} 

module.exports = RoomCreate;
