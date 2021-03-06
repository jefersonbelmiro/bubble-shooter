var BubbleShooter = require('./bubble-shooter.js');
var UI = require('./ui.js');
var Bubble = require('./bubble.js');
var Utils = require('./utils.js');

var Board = function(player) 
{
    this.player = player;
    this.side = player.side;

    this.x = 0;
    this.y = 0;

    this.grid = [];
    this.maxRows = 0;
    this.maxCols = 0;
}

Board.prototype = {

    setGrid : function(grid)
    {
        this.grid = grid;
        this.maxRows = this.grid.length;
        this.maxCols = this.grid[0].length;
    },

    getGrid : function()
    {
        return this.grid;
    },

    createGrid: function(maxRows, maxCols)
    {
        this.maxRows = maxRows;
        this.maxCols = maxCols;
        var grid = [];

        for(var row = 0; row < this.maxRows; row++) {

            grid[row] = [];
            var mod = row % 2 === 0;

            for (var col = 0; col < this.maxCols; col++) {

                // last col
                if (!mod && col >= this.maxCols - 1) {
                    continue;
                } 

                grid[row][col] = Bubble.getRandomSprite();
            }
        }
        return grid;
    },

    create: function() 
    {
        var separatorHeight = 0;//UI.board.separatorHeight/2;

        this.height =UI.board.height - separatorHeight;
        this.width = UI.bubble.size * this.maxCols;

        if (BubbleShooter.game.width > this.width) {
            this.x = (BubbleShooter.game.width - this.width)/2;
        }

        if (this.side == BubbleShooter.PLAYER_SIDE_TOP) {
            this.y = 0;

            var limitLine = BubbleShooter.entities.create(
                this.x, this.player.shooter.y + this.player.shooter.height/2, 
                Utils.createRect(UI.board.width, UI.board.separatorHeight, 'red')
            );
        }

        if (this.side == BubbleShooter.PLAYER_SIDE_BOTTOM) {

            this.y = this.height + separatorHeight;

            // fix shooter position
            this.player.shooter.y = this.y + this.height - this.player.shooter.y;
            this.player.shooter.hand.y = this.player.shooter.y;

            var limitLine = BubbleShooter.entities.create(
                this.x, this.player.shooter.y - this.player.shooter.height/2, 
                Utils.createRect(UI.board.width, UI.board.separatorHeight, 'red')
            );
        } 

        this.player.shooter.bringToTop();
        limitLine.alpha = 0.5; 

        var grid = this.grid.slice(0);
        this.grid = [];

        for (var row = 0, rows = grid.length; row < rows; row++) {
            this.grid[row] = [];
            for (var col = 0, cols = grid[row].length; col < cols; col++) {
                var tag = grid[row][col];
                var bubble = Bubble.create(this.player, row, col, tag);
                bubble.fixPositionByGrid();
                this.grid[row][col] = bubble;
            }
        }
    },

    addBubble : function(bubble) 
    {
        if(!this.grid[bubble.row]) {
            this.grid[bubble.row] = [];
        }

        if (this.grid[bubble.row][bubble.col]) {
            console.error('addBubble rewrite grid', bubble.row, bubble.col);
        }

        this.grid[bubble.row][bubble.col] = bubble;
    }, 

    removeBubble : function(bubble, animation) 
    {
        delete this.grid[bubble.row][bubble.col];

        if (!animation) {
            return bubble.kill();
        }

        // bubble.bringToTop();
        //
        // var x = Utils.getRandomInt(bubble.width * 4, -bubble.width * 4); 
        //
        // var start = {
            //     x : bubble.x + x,
            //     y :bubble.y - bubble.height * 2
            // };
            // var end = {
                //     x :  start.x, 
                //     y : BubbleShooter.game.height,
                // };
                //
                // // var ease = Phaser.Easing.Elastic.InOut;
                // // var ease = Phaser.Easing.Bounce.Out;
                // var ease = Phaser.Easing.Elastic.OutIn;
                // var anim = BubbleShooter.game.add.tween(bubble);
                // anim.to({ x: [start.x, end.x], y: [start.y, end.y]}, 400, ease);
                // anim.onComplete.add(function() {
                    //     bubble.kill();
            // });
            // anim.start();
            // return;

            if (animation == 'remove') {
                var anim = BubbleShooter.game.add.tween(bubble.scale);
                anim.to({x:0, y: 0}, 200);
            }
            if (animation == 'pop') {
                var anim = BubbleShooter.game.add.tween(bubble);

                if (this.side == BubbleShooter.PLAYER_SIDE_TOP) {
                    anim.to({x: bubble.x, y: bubble.y - bubble.radius * 2}, 100);
                    anim.to({x: bubble.x + bubble.radius, y: this.height}, 200);
                } else {
                    anim.to({x: bubble.x, y: bubble.y - bubble.radius * 2}, 100);
                    anim.to({x: bubble.x + bubble.radius, y: BubbleShooter.game.height}, 200);
                }
            }
            anim.onComplete.add(function() {
                bubble.kill();
            });
            anim.start();
    },

    getBubbleAt : function(row, col) 
    {
        if (!this.grid[row] || !this.grid[row][col]) {
            return false;
        }
        return this.grid[row][col];
    },

    getBubblesAround : function(curRow, curCol)
    {
        var bubbles = [];
        var mod =  curRow % 2 === 0;

        for (var rowNum = curRow - 1; rowNum <= curRow + 1; rowNum++) {

            for (var colNum = curCol - 1; colNum <= curCol + 1; colNum++) {

                if (colNum == curCol && rowNum == curRow) {
                    continue;
                }

                if (!mod && rowNum != curRow && colNum === curCol - 1) {
                    continue;
                }

                if (mod && rowNum != curRow && colNum === curCol + 1) {
                    continue;
                }

                var bubbleAt = this.getBubbleAt(rowNum, colNum);
                if (bubbleAt) {
                    bubbles.push(bubbleAt);
                }
            }
        }

        return bubbles;
    },

    getGroup : function(bubble, found, differentColor) 
    {
        var found = found || {};
        var curRow = bubble.row;
        var curCol = bubble.col;

        if (!found[curRow]) {
            found[curRow] = {};
        }
        if (!found.list) {
            found.list = [];
        }
        if (found[curRow][curCol]) {
            return found;
        }

        found[curRow][curCol] = bubble;
        found.list.push(bubble);

        var surrounding = this.getBubblesAround(curRow, curCol);

        for (var i = 0; i < surrounding.length; i++) {
            var bubbleAt = surrounding[i];
            if (bubbleAt.tag == bubble.tag || differentColor) {
                found = this.getGroup(bubbleAt, found, differentColor);
            }
        }
        return found;
    }, 

    findOrphans : function()
    {
        var connected = [], groups = [], orphaned = [];

        for(var row = 0; row < this.grid.length; row++) {
            connected[row] = [];
        }

        for(var col = 0; col < this.grid[0].length; col++) {
            var bubble = this.getBubbleAt(0, col);
            if(bubble && !connected[0][col]){
                var group = this.getGroup(bubble, {}, true);
                group.list.forEach(function(bubble) {
                    connected[bubble.row][bubble.col] = true;
                });
            }
        }

        for (var row = 0; row < this.grid.length; row++) {
            for (var col = 0; col < this.grid[row].length; col++) {
                var bubble = this.getBubbleAt(row, col);
                if (bubble && !connected[row][col]) {
                    orphaned.push(bubble);
                }
            }
        }

        return orphaned;
    },

    checkMatches : function(bubble)
    {
        var group = this.getGroup(bubble);
        var _this = this;

        if (group.list.length < 3) {
            return false;
        }

        group.list.forEach(function(bubble) {
            _this.removeBubble(bubble, 'remove');
        });
    },

    checkOrphans : function() 
    {
        var _this = this;
        this.findOrphans().forEach(function(bubble) {
            _this.removeBubble(bubble, 'pop');
        }); 
    },

    getRemaining : function() 
    {
        var remaining = [];
        for (var row = 0; row < this.grid.length; row++) {
            for (var col = 0; col < this.grid[row].length; col++) {
                var bubble = this.getBubbleAt(row, col);
                if (bubble) {
                    remaining.push(bubble);
                }
            }
        }
        return remaining;
    },

    getNextBubbleTag : function(remaining)
    {
        var tag, diff = [], remaining = remaining || this.getRemaining();
        remaining.forEach(function(bubble) {
            if (diff.indexOf(bubble.tag) === -1) {
                diff.push(bubble.tag);
            }
        });

        if (diff.length <= 2) {
            return diff[Utils.getRandomInt(0, diff.length - 1)];
        } 

        Bubble.getRandomSprite();
    },

    getGridMetaData : function()
    {
        var grid = [];
        for (var row = 0; row < this.grid.length; row++) {
            grid[row] = [];
            for (var col = 0; col < this.grid[row].length; col++) {
                var bubble = this.getBubbleAt(row, col); 
                grid[row][col] = bubble ? bubble.getMetaData() : bubble;
            }
        }
        return grid;
    },

    getMetaData : function()
    {
        return {
            x: this.x,
            y: this.y,
            width: this.width,
            height: this.height,
            side : this.side,
            grid: this.getGridMetaData(),
        }
    }

};

module.exports = Board;
