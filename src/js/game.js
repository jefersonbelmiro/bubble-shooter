;(function(global) {

    'use strict';

    var fpsText;

    var Game = function(_game) {
        this.game = _game;
    }    

    Game.prototype = {

        create: function() 
        {
            BubbleShoot.CurrenteState = this;
            BubbleShoot.state = 'stated';
            BubbleShoot.finishedByServer = false;

            this.game.stage.disableVisibilityChange = true;
            // var background = this.game.add.tileSprite(0, 0, BubbleShoot.UI.width, BubbleShoot.UI.height, "background");
            // background.alpha = 0.8;

            this.game.time.advancedTiming = true;
            fpsText = this.game.add.text(0, 5, '00', {font: '16px Arial', fill: '#ccc'});
            fpsText.x = this.game.width - fpsText.width - 5;

            BubbleShoot.entities = BubbleShoot.game.add.group();

            var bubblesGroup = BubbleShoot.game.add.group();
            bubblesGroup.enableBody = true;

            BubbleShoot.entities.add(bubblesGroup);
            BubbleShoot.entities.bubbles = bubblesGroup;

            var separator = BubbleShoot.entities.create(
                0, BubbleShoot.game.world.centerY, 
                Utils.createRect(BubbleShoot.UI.board.width, BubbleShoot.UI.board.separatorHeight)
            );
            separator.anchor.setTo(0, 0.5);

            this.createPlayers(function() {
                this.configureCollision();
                this.attachEvents();
            });

            BubbleShoot.entities.bringToTop(BubbleShoot.entities.bubbles);
        },

        createPlayers : function(done)
        {

            if (BubbleShoot.mode == BubbleShoot.MODES.SINGLEPLAYER) {

                BubbleShoot.player = new BubbleShoot.Player('You', BubbleShoot.PLAYER_SIDE_BOTTOM);
                BubbleShoot.enemy = new BubbleShoot.Player('Computer', BubbleShoot.PLAYER_SIDE_TOP);

                var maxRows = Math.round(BubbleShoot.UI.maxRows/3) + 1; 
                var maxCols = BubbleShoot.UI.maxCols; 

                BubbleShoot.player.board.createGrid(maxRows, maxCols);
                BubbleShoot.player.board.createBubbles();
                BubbleShoot.player.shooter.reload(true);

                BubbleShoot.enemy.board.createGrid(maxRows, maxCols);
                BubbleShoot.enemy.board.createBubbles();
                BubbleShoot.enemy.shooter.reload(true);
                // BubbleShoot.computer = new BubbleShoot.AI(BubbleShoot.enemy);

                BubbleShoot.player.enemy = BubbleShoot.enemy;
                BubbleShoot.enemy.enemy = BubbleShoot.player;

                return done.call(this);
            }

            if (BubbleShoot.mode == BubbleShoot.MODES.MULTIPLAYER) {
                
                var _this = this;
                BubbleShoot.server.removeAllListeners();
                BubbleShoot.server.on('player-fire', function(data) {

                    console.log('on: player-fire', data.tag);
                    BubbleShoot.enemy.shooter._nextLoaded.push(data.tag);
                    BubbleShoot.enemy.shooter.rotation = Utils.degreesToRadians(180) - data.rotation;
                    BubbleShoot.enemy.fire();
                });

                BubbleShoot.server.on('finish', function(winnerID) {

                    BubbleShoot.finishedByServer = true;

                    console.log('finish: ', winnerID);
                    if (winnerID == BubbleShoot.player.id) {
                        _this.finish(BubbleShoot.player);
                    } else {
                        _this.finish(BubbleShoot.enemy);
                    }
                });

                // @todo - change player/enemy to p1/p2
                var room = BubbleShoot.room;
                var p1 = room.players[0];
                var p2 = room.players[1];

                if (BubbleShoot.nickname == p2.id) {
                
                    BubbleShoot.player = new BubbleShoot.Player(p2.id, BubbleShoot.PLAYER_SIDE_BOTTOM);
                    BubbleShoot.enemy = new BubbleShoot.Player(p1.id, BubbleShoot.PLAYER_SIDE_TOP);

                    BubbleShoot.player.board.setGrid(p2.grid);
                    BubbleShoot.enemy.board.setGrid(p1.grid);

                    BubbleShoot.player.shooter._nextLoaded = p2.bubbles;
                    BubbleShoot.enemy.shooter._nextLoaded = p1.bubbles;

                } else {
                
                    BubbleShoot.player = new BubbleShoot.Player(p1.id, BubbleShoot.PLAYER_SIDE_BOTTOM);
                    BubbleShoot.enemy = new BubbleShoot.Player(p2.id, BubbleShoot.PLAYER_SIDE_TOP);

                    BubbleShoot.player.board.setGrid(p1.grid);
                    BubbleShoot.enemy.board.setGrid(p2.grid);

                    BubbleShoot.player.shooter._nextLoaded = p1.bubbles;
                    BubbleShoot.enemy.shooter._nextLoaded = p2.bubbles;
                } 

                console.log('createPlayers-p1.bubbles', p1.bubbles);
                console.log('createPlayers-p2.bubbles', p2.bubbles);

                BubbleShoot.player.board.createBubbles();
                BubbleShoot.enemy.board.createBubbles();

                BubbleShoot.player.shooter.reload(true);
                BubbleShoot.enemy.shooter.reload(true);

                BubbleShoot.player.enemy = BubbleShoot.enemy;
                BubbleShoot.enemy.enemy = BubbleShoot.player;

                return done.call(this);
            }
        },

        configureCollision : function() 
        {
            var config = BubbleShoot.Collision.config;
            config.bubbleRadius = BubbleShoot.UI.bubble.radius;
            config.trajectory.distance = BubbleShoot.UI.bubble.radius/5;
            config.trajectory.duration = 600;
            config.gameWidth = BubbleShoot.game.width;
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
            fpsText.setText(this.time.fps);
        },

        render : function() 
        {
            // var _this = this;
            // BubbleShoot.player.bubbles.forEachAlive(function(bubble) {
            //     this.game.debug.body(bubble);
            // }.bind(this));
        },

        inputUp : function(input, event) 
        {
            BubbleShoot.player.fire();

            if (this.isMultiplayer()) {
                var data = {
                    playerId : BubbleShoot.player.id,
                    rotation : BubbleShoot.player.shooter.rotation,
                }
                BubbleShoot.server.emit('player-fire', data, function(tag) {
                    BubbleShoot.player.shooter._nextLoaded.push(tag);
                    console.log('emit: player-fire', tag);
                });
            } else {
                BubbleShoot.player.shooter._nextLoaded.push(BubbleShoot.Bubble.getRandomSprite()); 
            }
        }, 

        inputMove : function(input, x, y, fromClick) 
        {
            var rotation = this.game.physics.arcade.angleToPointer(BubbleShoot.player.shooter);
            // fix rotation: imagem deveria estar apontada para direita, esta para cima
            rotation += 1.57079633;

            BubbleShoot.player.shooter.setRotation(rotation);
            BubbleShoot.player.shooter.showTrajectory();

            BubbleShoot.enemy.shooter.rotation = Utils.degreesToRadians(180) - BubbleShoot.player.shooter.rotation;
        },

        finish: function(winner) 
        {
            if (BubbleShoot.state == 'finished') {
                return false;
            }
            BubbleShoot.state = 'finished';

            var loser = BubbleShoot.player == winner ? BubbleShoot.enemy : BubbleShoot.player;

            console.log('game has finished', winner.id);

            if (this.isMultiplayer()) {
                if (!BubbleShoot.finishedByServer) {
                    // BubbleShoot.finishedByServer = true;
                    var room = BubbleShoot.room;
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
                    console.log('BubbleShoot.server.emit(finish)', data);
                    BubbleShoot.server.emit('finish', data);
                }
            } else {
                BubbleShoot.computer.stop();
            }

            this.detachEvents();

            this.createModalLayer();

            var textWinLabel = winner.id + ' WIN!';
            var textWinPosition = {
                x : winner.board.x + winner.board.width/2,
                y:  winner.board.y + winner.board.height/2
            };
            var textWin = this.game.add.bitmapText(textWinPosition.x, textWinPosition.y, 'font', textWinLabel, 30);
            textWin.anchor.setTo(0.5);
            textWin.alpha = 0.7;

            var textLoseLabel = loser.id + ' LOSE!';
            var textLosePosition = {
                x : loser.board.x + loser.board.width/2,
                y:  loser.board.y + loser.board.height/2
            };
            var textLose = this.game.add.bitmapText(textLosePosition.x, textLosePosition.y, 'font', textLoseLabel, 30);
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
            return BubbleShoot.mode == BubbleShoot.MODES.MULTIPLAYER;
        },

        createModalLayer: function() 
        {
            var rect =  Utils.createRect(BubbleShoot.game.width, BubbleShoot.game.height, 'rgba(25, 25, 25, 0.9)');
            var modal = BubbleShoot.entities.create(0, 0, rect); 
            modal.bringToTop();
            return modal;
        },
        
    } 

    global.Game = Game;

})(this, BubbleShoot);
