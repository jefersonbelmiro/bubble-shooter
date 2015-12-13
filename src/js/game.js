var BubbleShooter = require('./bubble-shooter.js');
var Utils = require('./utils.js');
var UI = require('./ui.js');
var AI = require('./ai.js');
var Bubble = require('./bubble.js');
var Player = require('./player.js');
var fpsText;

var Game = function(_game) {
    this.game = _game;
}    

var _enemyQueue = [];

function _nextTick(fn)
{
    return setTimeout(fn, 16.666);
}

BubbleShooter.nextTick = _nextTick;

function _processEnemyQueue() 
{
    var player = BubbleShooter.enemy;

    if (player.shooter._loading) {
        return _nextTick(_processEnemyQueue);
    }

    var data = _enemyQueue.shift();

    if (!data) {
        return false;
    }

    if (!player.shooter.bubble) {
        console.error('1]_processEnemyQueue', data.tag);
        // player.shooter.reload(true, data.tag);
    }

    if (player.shooter.bubble.tag != data.tag) {
        console.error('2]_processEnemyQueue', player.shooter.bubble.tag, data.tag);
        console.error('2.1]_processEnemyQueue', _enemyQueue.length, _enemyQueue);
        player.shooter.bubble.tag = data.tag;
        player.shooter.bubble.frameName = data.tag;
    }

    console.log('enemy fire', player.shooter.bubble.tag);

    player.shooter.angle = 180 - data.angle;
    player.fire();
    player.shooter.reload();

    return true;
}

Game.prototype = {

    create: function() 
    {
        BubbleShooter.CurrenteState = this;
        BubbleShooter.state = 'stated';
        BubbleShooter.finishedByServer = false;

        var background = this.game.add.image(0, 0, 'sprites', 'board_bg');
        background.width = this.game.width;
        background.height = this.game.height;

        // false - window.blur pausa game
        this.game.stage.disableVisibilityChange = true;

        // true ignora delta time quando game nao esta em 60fps
        this.game.forceSingleUpdate = true

        this.game.time.advancedTiming = true;
        fpsText = this.game.add.text(0, 5, '00', {font: '16px Arial', fill: '#000'});
        // fpsText.x = this.game.width - fpsText.width - 5;
        fpsText.x = 5;
        this.latency = 0;

        BubbleShooter.entities = BubbleShooter.game.add.group();

        var bubblesGroup = BubbleShooter.game.add.group();
        // bubblesGroup.enableBody = true;

        BubbleShooter.entities.add(bubblesGroup);
        BubbleShooter.entities.bubbles = bubblesGroup;

        BubbleShooter.separator = BubbleShooter.entities.create(
            0, BubbleShooter.game.world.centerY, 
            Utils.createRect(UI.board.width, UI.board.separatorHeight, '#333')
        );
        BubbleShooter.separator.anchor.setTo(0, 0.5);

        if (BubbleShooter.game.width > BubbleShooter.separator.width) {
            BubbleShooter.separator.x = (BubbleShooter.game.width - BubbleShooter.separator.width)/2;
        } 

        this.createPlayers(this.attachEvents);

        BubbleShooter.entities.bringToTop(BubbleShooter.entities.bubbles);
    },

    createPlayers : function(done)
    {

        if (BubbleShooter.mode == BubbleShooter.MODES.SINGLEPLAYER) {

            BubbleShooter.player = new Player('You', BubbleShooter.PLAYER_SIDE_BOTTOM);
            BubbleShooter.enemy = new Player('Computer', BubbleShooter.PLAYER_SIDE_TOP);

            var maxRows = Math.round(UI.maxRows/3) + 1; 
            var maxCols = UI.maxCols; 

            if (BubbleShooter.debug) {

                var playerGrid = BubbleShooter.player.board.createGrid(maxRows, maxCols).slice(0);
                BubbleShooter.player.board.setGrid(playerGrid.slice(0));
                BubbleShooter.enemy.board.setGrid(playerGrid.slice(0)); 
            } else {

                BubbleShooter.player.board.setGrid(BubbleShooter.player.board.createGrid(maxRows, maxCols));
                BubbleShooter.enemy.board.setGrid(BubbleShooter.enemy.board.createGrid(maxRows, maxCols));
            }

            BubbleShooter.player.board.create();
            BubbleShooter.enemy.board.create();

            if (false == BubbleShooter.debug) {
                BubbleShooter.player.shooter.load(Bubble.getRandomSprite());
                BubbleShooter.enemy.shooter.load(Bubble.getRandomSprite());
            }

            var bubbleTag = BubbleShooter.debug ? Bubble.getRandomSprite() : null;
            BubbleShooter.player.shooter.reload(true, bubbleTag);
            BubbleShooter.enemy.shooter.reload(true, bubbleTag);

            if (false == BubbleShooter.debug) {
                BubbleShooter.computer = new AI(BubbleShooter.enemy);
            }

            BubbleShooter.player.enemy = BubbleShooter.enemy;
            BubbleShooter.enemy.enemy = BubbleShooter.player;

            return done.call(this);
        }

        if (BubbleShooter.mode == BubbleShooter.MODES.MULTIPLAYER) {

            var _this = this;
            BubbleShooter.server.removeAllListeners();
            BubbleShooter.server.on('player-fire', function(data, done) {

                console.log('player-fire', data);
                BubbleShooter.enemy.shooter.load(data.load);

                _enemyQueue.push(data);
                _processEnemyQueue();

                done();
            });

            BubbleShooter.server.on('player-reload', function(tags, done) {

                console.log('player-reload', tags);

                BubbleShooter.player.shooter.load(tags);
                BubbleShooter.player.shooter.reload();

                done();
            });

            BubbleShooter.server.on('finish', function(winnerID) {

                BubbleShooter.finishedByServer = true;

                console.log('finish: ', winnerID);
                if (winnerID == BubbleShooter.player.id) {
                    _this.finish(BubbleShooter.player);
                } else {
                    _this.finish(BubbleShooter.enemy);
                }
            });

            // @todo - change player/enemy to p1/p2
            var room = BubbleShooter.room;
            var p1 = room.players[0];
            var p2 = room.players[1];

            if (BubbleShooter.nickname == p2.id) {

                BubbleShooter.player = new Player(p2.id, BubbleShooter.PLAYER_SIDE_BOTTOM);
                BubbleShooter.enemy = new Player(p1.id, BubbleShooter.PLAYER_SIDE_TOP);

                BubbleShooter.player.board.setGrid(p2.grid);
                BubbleShooter.enemy.board.setGrid(p1.grid);

                BubbleShooter.player.shooter.load(p2.bubbles);
                BubbleShooter.enemy.shooter.load(p1.bubbles);

            } else {

                BubbleShooter.player = new Player(p1.id, BubbleShooter.PLAYER_SIDE_BOTTOM);
                BubbleShooter.enemy = new Player(p2.id, BubbleShooter.PLAYER_SIDE_TOP);

                BubbleShooter.player.board.setGrid(p1.grid);
                BubbleShooter.enemy.board.setGrid(p2.grid);

                BubbleShooter.player.shooter.load(p1.bubbles);
                BubbleShooter.enemy.shooter.load(p2.bubbles);
            } 

            BubbleShooter.player.board.create();
            BubbleShooter.enemy.board.create();

            BubbleShooter.player.shooter.reload(true);
            BubbleShooter.enemy.shooter.reload(true);

            BubbleShooter.player.enemy = BubbleShooter.enemy;
            BubbleShooter.enemy.enemy = BubbleShooter.player;

            // ;(function getLatency() {
            //
            //     var updateLatency = function(latency) {
            //         _this.latency = latency;
            //         getLatency();
            //     }
            //
            //     setTimeout(function() {
            //         BubbleShooter.server.ping(updateLatency)
            //     }, 2000); 
            // })();

            return done.call(this);
        }
    },

    attachEvents : function() 
    {
        this.game.input.addMoveCallback(this.inputMove, this);
        this.game.input.onUp.add(this.inputUp, this);
        this.game.canvas.style.cursor = 'crosshair';
    },

    detachEvents : function()
    {
        this.game.input.deleteMoveCallback(this.inputMove, this);
        this.game.input.onUp.remove(this.inputUp, this);
        this.game.canvas.style.cursor = 'default';
    },

    update : function() 
    {
        fpsText.setText(this.time.fps + ' | ' + this.latency);
    },

    render : function() 
    {
        // var _this = this;
        // BubbleShooter.player.bubbles.forEachAlive(function(bubble) {
            //     this.game.debug.body(bubble);
            // }.bind(this));
    },

    inputUp : function(input, event) 
    {
        if (this.isMultiplayer()) {

            if (!BubbleShooter.player.shooter._loaded) {
                return false;
            }

            var data = {
                playerId : BubbleShooter.player.id,
                angle : BubbleShooter.player.shooter.angle,
                tag : BubbleShooter.player.shooter.bubble.tag,
            } 

            BubbleShooter.server.emit('player-fire', data);
        } else {

            var bubbleTag = Bubble.getRandomSprite();
            BubbleShooter.player.shooter.load(bubbleTag); 

            if (BubbleShooter.debug) {
                BubbleShooter.enemy.shooter.load(bubbleTag); 
                BubbleShooter.enemy.fire();
                BubbleShooter.enemy.shooter.reload();
            }
        }

        BubbleShooter.player.fire();
        BubbleShooter.player.shooter.reload();
    }, 

    inputMove : function(input, x, y, fromClick) 
    {
        var rotation = this.game.math.angleBetween(BubbleShooter.player.shooter.x, BubbleShooter.player.shooter.y, x, y);

        // fix rotation: imagem deveria estar apontada para direita, esta para cima
        rotation += 1.57079633;

        // BubbleShooter.player.shooter.rotation = rotation;
        BubbleShooter.player.shooter.setRotation(rotation);
        // BubbleShooter.player.shooter.showTrajectory();
    
        if (BubbleShooter.debug) {
            BubbleShooter.enemy.shooter.angle = 180 - BubbleShooter.player.shooter.angle; 
        }
    },

    finish: function(winner) 
    {
        if (BubbleShooter.state == 'finished') {
            return false;
        }
        BubbleShooter.state = 'finished';

        var loser = BubbleShooter.player == winner ? BubbleShooter.enemy : BubbleShooter.player;

        console.log('game has finished', winner.id);

        if (this.isMultiplayer()) {

            // BubbleShooter.server.emit('debug-queue', BubbleShooter._queue);

            if (!BubbleShooter.finishedByServer) {
                // BubbleShooter.finishedByServer = true;
                var room = BubbleShooter.room;
                var data = {
                    winnerID: winner.id,
                    room: {
                        id : room.id,
                        players: [
                            { id: room.players[0].id},
                            { id: room.players[1].id},
                        ],
                        state: room.state,
                    }, 
                };
                console.log('BubbleShooter.server.emit(finish)', data);
                BubbleShooter.server.emit('finish', data);
            }
        } else {
            if (false == BubbleShooter.debug) {
                BubbleShooter.computer.stop();
            }
        }

        this.detachEvents();

        this.createModalLayer();


        var won = BubbleShooter.player == winner;
        var fingerKey = won ? 'win_finger' : 'lose_finger';
        var textKey = won ? 'you_won' : 'you_lose';

        var finger = this.game.add.sprite(this.game.world.centerX, this.game.world.centerY, 'sprites', fingerKey);
        finger.anchor.setTo(0.5);
        finger.y += 80;

        var text = this.game.add.sprite(this.game.world.centerX, this.game.world.centerY, 'sprites', textKey);
        text.anchor.setTo(0.5);
        text.y -= 120;



        var textMenu = this.game.add.bitmapText(this.game.world.centerX, 0, 'dunkin', 'Menu', 30);
        textMenu.alpha = 0;
        textMenu.scale.setTo(0);
        textMenu.anchor.setTo(0.5);

        textMenu.inputEnabled = true;
        textMenu.events.onInputDown.add(function() {
            this.state.start('menu');
        }, this);

        this.game.add.tween(textMenu).to({ alpha: 1, y: 60 }, 500, Phaser.Easing.Back.Out, true, 500); 
        this.game.add.tween(textMenu.scale).to({x: 1, y: 1}, 500, Phaser.Easing.Back.Out, true, 700);

        
        return;







        var textWinLabel = winner.id + ' WIN!';
        var textWinPosition = {
            x : winner.board.x + winner.board.width/2,
            y:  winner.board.y + winner.board.height/2
        };
        var textWin = this.game.add.bitmapText(textWinPosition.x, textWinPosition.y, 'dunkin', textWinLabel, 30);
        textWin.anchor.setTo(0.5);
        textWin.alpha = 0.7;

        var textLoseLabel = loser.id + ' LOSE!';
        var textLosePosition = {
            x : loser.board.x + loser.board.width/2,
            y:  loser.board.y + loser.board.height/2
        };
        var textLose = this.game.add.bitmapText(textLosePosition.x, textLosePosition.y, 'dunkin', textLoseLabel, 30);
        textLose.anchor.setTo(0.5);
        textLose.alpha = 0.7;

        var menuButton = Utils.createButton({
            label: 'Menu',
            position: {x : this.game.world.centerX, y: this.game.world.centerY},
            callback : function() {
                this.state.start('menu'); 
            },
            context: this,
            alpha: 1,
        });
    },

    isMultiplayer: function() {
        return BubbleShooter.mode == BubbleShooter.MODES.MULTIPLAYER;
    },

    createModalLayer: function() 
    {
        var rect =  Utils.createRect(BubbleShooter.game.width, BubbleShooter.game.height, 'rgba(25, 25, 25, 0.9)');
        var modal = BubbleShooter.entities.create(0, 0, rect); 
        modal.bringToTop();
        return modal;
    },

} 

module.exports = Game;
