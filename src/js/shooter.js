var BubbleShooter = require('./bubble-shooter.js');
var UI = require('./ui.js');
var Bubble = require('./bubble.js');
var Utils = require('./utils.js');
var Collision = require('./collision.js');

var Shooter = function(player) {

    Phaser.Sprite.call(this, BubbleShooter.game, BubbleShooter.game.world.centerX, 0, 'sprites2', 'shooter');
    BubbleShooter.entities.add(this);

    player.shooter = this;
    this.player = player;

    this._loaded = false;
    this._loading = false;
    this._queue = []; 

    this.scale.setTo(0.3);
    this.anchor.setTo(0.5, 0.75);

    this.y = this.height/4;

    if (player.side == BubbleShooter.PLAYER_SIDE_TOP) {
        this.rotation = Utils.degreesToRadians(180);
    }

    if (player.side == BubbleShooter.PLAYER_SIDE_BOTTOM) {
        this.angle = 0;
    }
}

Shooter.prototype = Object.create(Phaser.Sprite.prototype);
Shooter.prototype.constructor = Shooter;

Shooter.prototype.fire = function(done, trajectory) {

    var bubble = this.bubble;

    if (!bubble || !this._loaded) {
        return false;
    }

    this.bubble = null; 
    var trajectory = trajectory || Collision.trajectory(this.position, Utils.degreesToRadians(this.angle), this.player.board);
    bubble.move(trajectory, done);
    return true;
};

Shooter.prototype.getBitmapData = function() {

    if (!this.bmd) {
        this.bmd = BubbleShooter.game.add.bitmapData(this.player.board.width, this.player.board.height);
        var sprite = BubbleShooter.game.add.sprite(this.player.board.x, this.player.board.y, this.bmd);
        BubbleShooter.entities.add(sprite);
    }
    return this.bmd;
}

Shooter.prototype.showTrajectory = function() {

    return false;
    var trajectory = Collision.trajectory(this.position, this.rotation, this.player.board);

    var bmd = this.getBitmapData();
    var context = bmd.context;
    var board = this.player.board;

    bmd.clear();
    context.strokeStyle = "#666";
    context.beginPath();
    context.lineWidth = 3;
    context.setLineDash([7]);

    context.moveTo(this.position.x - board.x, this.position.y - board.y);
    trajectory.forEach(function(step, index) {
        context.lineTo(step.position.x - board.x, step.position.y - board.y);
    }.bind(this));
    context.stroke();
};

Shooter.prototype.load = function(tag)
{
    if (Array.isArray(tag)) {
        return this._queue = this._queue.concat(tag);
    }
    this._queue.push(tag);
}

Shooter.prototype.getNextTag = function()
{
    return this._queue.shift();
}

Shooter.prototype.reload = function(force, nextTag) {

    if (this.bubble || this._loading) {
        return false;
    }

    this._loading = true;
    this._loaded = false;

    var nextTag = nextTag || this.getNextTag();

    if (!nextTag) {
        return false;
    }

    var bubble = Bubble.create(this.player, null, null, nextTag);

    bubble.anchor.setTo(0.5)
    bubble.position.set(this.x, this.y);

    var done = function() {
        this.bubble = bubble;
        this._loading = false;
        this._loaded = true;
    };

    // @todo - debug
    // if (BubbleShooter.enemy.id == this.player.id && BubbleShooter.mode == BubbleShooter.MODES.MULTIPLAYER) {
        //     force = true;
        // }

        if (force) {
            return BubbleShooter.nextTick(done.bind(this));
        }

        var scale = UI.bubble.scale;
        bubble.scale.setTo(0.001);
        var anim = BubbleShooter.game.add.tween(bubble.scale);
        anim.to({x: scale, y: scale}, 333);
        anim.onComplete.add(done.bind(this));
        anim.start();

        return true;
};

Shooter.prototype.setRotation = function(rotation) 
{
    this.rotation = rotation;

    if (this.player.side == BubbleShooter.PLAYER_SIDE_BOTTOM && Math.abs(this.angle) > 85) {
        this.angle = this.angle > 0 ? 85 : -85;
    }

    if (this.player.side == BubbleShooter.PLAYER_SIDE_TOP && Math.abs(this.angle) < 95) {
        this.angle = this.angle > 0 ? 95 : -95;
    }
}

Shooter.prototype.getMetaData = function()
{
    return {
        x : this.x,
        y: this.y,
        position : {
            x : this.x,
            y : this.y,
        },
        rotation : this.rotation,
    }
}

module.exports = Shooter;
