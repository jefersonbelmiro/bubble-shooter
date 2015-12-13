var BubbleShooter = require('./bubble-shooter.js');
var Utils = require('./utils.js');
var UI = require('./ui.js');

function Bubble(player, row, col, spriteName)
{
    Phaser.Sprite.call(this, BubbleShooter.game, 0, 0, 'sprites', spriteName || Bubble.getRandomSprite());
    BubbleShooter.entities.bubbles.add(this);

    this.player = player;

    // this.body.collideWorldBounds = true;
    // this.body.bounce.setTo(1);
    
    this.tag = spriteName || this.frameName;

    this.scale.setTo(UI.bubble.scale);
    this.anchor.setTo(0.5);
    this.row = row;
    this.col = col;

    // this.height = UI.bubble.size;
    // this.width = UI.bubble.size;

    this.radius = UI.bubble.radius;
}

if (self.Phaser) {
    Bubble.prototype = Object.create(Phaser.Sprite.prototype);
    Bubble.prototype.constructor = Bubble;
}

Bubble.prototype.getGridByPosition = function(position) 
{
    var topSide = this.player.side == BubbleShooter.PLAYER_SIDE_TOP; 
    var board = this.player.board;
    var position = position || this.position;

    var row = Math.floor( (position.y - board.y) / UI.board.rowHeight);

    if (topSide) {
        var row = Math.floor( (board.height - position.y) / UI.board.rowHeight);
    }

    var marginLeft = row % 2 == 0 ? UI.bubble.radius : UI.bubble.radius * 2; 
    var col = (position.x - board.x + marginLeft) / UI.bubble.size;

    col = Math.round(col);

    if (col > UI.maxCols) {
        col = UI.maxCols;
    }

    if(row % 2 == 1) {
        col -= 2;
    }
    if(row % 2 == 0) {
        col -= 1;
    }

    return { row : row, col : col };
}

Bubble.prototype.fixGridByPosition = function(position) 
{
    var grid = this.getGridByPosition(position);
    this.row = grid.row;
    this.col = grid.col;

    if (BubbleShooter.debug) {
        console.log('fixGridByPosition', this.player.id, position, grid);
    }
} 

Bubble.prototype.getPositionByGrid = function(grid) 
{
    var grid = grid || {row : this.row, col : this.col};

    if (grid.row === undefined || grid.col === undefined) {
        console.error('getPositionByGrid', grid.row, grid.col);
        return false;
    }

    var topSide = this.player.side == BubbleShooter.PLAYER_SIDE_TOP;
    var x = this.player.board.x;
    var y = this.player.board.y; 

    if (grid.row % 2 == 0) {
        x += UI.bubble.radius;
    } else {
        x += UI.bubble.radius * 2;
    }

    if (topSide) {
        y += this.player.board.height;
        y -= grid.row * UI.board.rowHeight;
        y -= UI.bubble.radius;
    } else {
        y += grid.row  * UI.board.rowHeight;
        y += UI.bubble.radius;
    }                                      

    return { x : x + (grid.col * UI.bubble.size), y : y};
} 

Bubble.prototype.fixPositionByGrid = function(grid) 
{
    var position = this.getPositionByGrid(grid);
    this.position.setTo(position.x, position.y);

    this.createDebugText();
} 

Bubble.prototype.move = function(steps, done, attach) 
{
    if (false === Array.isArray(steps)) {
        return console.error('invalid parameters, expected Array of steps');
    } 

    this.state = BubbleShooter.BUBBLE_STATE_FIRING;
    var attach = attach == undefined ? true : attach;
    var throwAnim = BubbleShooter.game.add.tween(this);

    steps.forEach(function(step) {
        throwAnim.to({x : step.position.x, y: step.position.y}, step.duration);
    });

    if (attach) {
        var position = steps.pop().position;
        this.fixGridByPosition(position);
        this.player.board.addBubble(this);
        this._endPosition = this.getPositionByGrid();
    }

    throwAnim.onComplete.add(function() {

        if (attach) {
            this.state = BubbleShooter.BUBBLE_STATE_ON_BOARD;
            this.fixPositionByGrid();
            delete this._endPosition;
        }
        if (done) {
            done(this);
        }
    }.bind(this));

    throwAnim.start();
}

Bubble.prototype.getMetaData = function()
{
    return {
        tag: this.tag,
        radius: this.radius,
        row: this.row,
        col: this.col,
        x: this.x,
        y: this.y,
        position : {
            x : this.x,
            y : this.y,
        },
        _endPosition : this._endPosition,
        state : this.state,
    }
}

Bubble.prototype.createDebugText = function() 
{
    if (!BubbleShooter.debug) {
        return false;
    }

    if (!this.debugText) {
        var style = { font: "20px Arial", fill: "#000" };  
        var text = BubbleShooter.game.add.text(0, 0, '', style);
        text.anchor.setTo(0.5);
        this.addChild(text);
        this.debugText = text;
    }

    if (this.row == undefined || this.col == undefined) {
        return this.debugText.setText('');
    }

    this.debugText.setText(String(this.row) + ' - ' + String(this.col));
}

Bubble.create = function(player, row, col, spriteName)
{
    var bubble = BubbleShooter.entities.bubbles.getFirstDead(); 
    var spriteName = spriteName || Bubble.getRandomSprite();

    if (bubble) {
        bubble.revive();
        bubble.row = row;
        bubble.col = col;
        bubble.frameName = spriteName;
        bubble.tag = spriteName;
        bubble.scale.setTo(UI.bubble.scale);
        bubble.player = player;
        bubble.visible = true;
    }

    if (!bubble) {
        bubble = new Bubble(player, row, col, spriteName);
    } 

    bubble.createDebugText();

    return bubble;
}

Bubble.TAGS = ['green', 'blue', 'yellow', 'red', 'magenta', 'orange'];

Bubble.getRandomSprite = function()
{
    return Bubble.TAGS[Utils.getRandomInt(0, Bubble.TAGS.length - 1)];
} 

module.exports = Bubble;
