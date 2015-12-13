var BubbleShooter = require('./bubble-shooter.js');
var UI = require('./ui.js');
var Bubble = require('./bubble.js');
var Utils = require('./utils.js');
var Collision = require('./collision.js');

var Shooter = function(player) {

    Phaser.Sprite.call(this, BubbleShooter.game, BubbleShooter.game.world.centerX, 0, 'arrow');
    BubbleShooter.entities.add(this);

    player.shooter = this;
    this.player = player;

    this._loaded = false;
    this._loading = false;
    this._queue = []; 

    // this.scale.setTo(0.2);
    this.anchor.setTo(0.5, 0.9);
    // this.anchor.setTo(0.5, 0.75);

    this.y = this.height;

    if (player.side == BubbleShooter.PLAYER_SIDE_TOP) {
        this.rotation = Utils.degreesToRadians(180);
    }

    if (player.side == BubbleShooter.PLAYER_SIDE_BOTTOM) {
        this.angle = 0;
    }

    this.createHand();
    this.createHandAnimations();
}

Shooter.prototype = Object.create(Phaser.Sprite.prototype);
Shooter.prototype.constructor = Shooter;

Shooter.prototype.fire = function(done, trajectory) {

    var bubble = this.bubble;

    if (!bubble || !this._loaded) {
        return false;
    }

    bubble.visible = true;
    this.hand.angle = this.angle;
    this.hand.play(bubble.tag, 20);

    var distance = 20;
    var dx = Math.sin(this.rotation) * distance;
    var dy = Math.cos(this.rotation) * distance;


    if (this.player.side === BubbleShooter.PLAYER_SIDE_TOP) {
    } else {
        console.log('fire', dx, dy);
        var tween = BubbleShooter.game.add.tween(this.hand);
        tween.to({x: this.hand.x + dx, y: this.hand.y - dy}, 200);
        tween.to({x: this.hand.x, y: this.hand.y}, 200);
        tween.to({rotation: 0}, 10);
        tween.start();
    }


    this.bubble = null; 
    var trajectory = trajectory || Collision.trajectory(this.position, this.rotation, this.player.board);
    bubble.rotation = this.rotation;
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
    bubble.visible = false;

    this.hand.frameName = 'hand1_' + bubble.tag;
    this.hand.visible = true;

    var done = function() {
        this.bubble = bubble;
        this._loading = false;
        this._loaded = true;
    };

    if (true || force) {
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

Shooter.prototype.createHand = function()
{
    this.hand = BubbleShooter.game.add.sprite(this.x, this.y, 'hand', 'hand1_green');
    BubbleShooter.entities.add(this.hand);

    this.hand.anchor.setTo(0.44, 0.44);
    this.hand.scale.setTo(UI.bubble.scale);
    this.hand.angle = this.angle;
    this.hand.visible = false;
}

Shooter.prototype.createHandAnimations = function()
{
    function onComplete()
    {
        if (this.bubble) {
            this.hand.frameName = 'hand1_' + this.bubble.frameName;
        }
    }

    for (var i = 0, len = Bubble.TAGS.length; i < len; i++) {

        var tag = Bubble.TAGS[i];
        var animation = this.hand.animations.add(tag, ['hand1_' + tag, 'hand2_' + tag, 'hand3_' + tag, 'hand4_' + tag]);
        animation.onComplete.add(onComplete.bind(this));
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
