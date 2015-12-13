var BubbleShooter = require('./bubble-shooter.js');
var Utils = require('./utils.js');
var UI = require('./ui.js');

var Menu = function(_game) 
{
    this.game = _game;
}    

Menu.prototype = {

    create: function() 
    {

        var background = this.game.add.image(0, 0, 'sprites', 'menu_bg');
        background.width = this.game.width;
        background.height = this.game.height;

        var playButton = this.game.add.bitmapText(0, this.game.height, 'dunkin', 'Play', 50);
        // playButton.anchor.setTo(0.5);
        playButton.tint = 0xF5821F;
        playButton.x = 20;
        playButton.y = this.game.height - playButton.height - 30;

        playButton.inputEnabled = true;
        playButton.events.onInputDown.add(function() {

            this.getNickName();
            BubbleShooter.mode = BubbleShooter.MODES.MULTIPLAYER;
            this.state.start('room'); 
        }, this);


        var practiceButton = this.game.add.bitmapText(0, this.game.height, 'dunkin', 'Practice', 30);
        practiceButton.tint = 0xF5821F;
        practiceButton.x = this.game.width - practiceButton.width - 20;
        practiceButton.y = this.game.height - practiceButton.height - 33;

        practiceButton.inputEnabled = true;
        practiceButton.events.onInputDown.add(function() {

            BubbleShooter.mode = BubbleShooter.MODES.SINGLEPLAYER;
            // this.startFullScreen();
            this.state.start('game'); 
        }, this);

        var HOF = [
            {id : 'joao', wins: 120},
            {id : 'player-2323', wins: 80},
            {id : 'duke', wins: 59},
            {id : 'kael', wins: 23},
            {id : 'shooter', wins: 13},
            {id : 'player-64564', wins: 10},
            {id : 'player-54657', wins: 10},
            {id : 'player-54657', wins: 7},
            {id : 'player-54657', wins: 3},
            {id : 'player-54657', wins: 1},
        ];

        var x = 60;
        var y = this.game.world.centerY - 80;

        var textHOF = this.game.add.bitmapText(x, y, 'dunkin', 'Hall of Fame', 28);
        textHOF.tint = 0xE11383;
        y += 40;

        var textNick = this.game.add.bitmapText(x, y, 'dunkin', 'Nick', 18);
        textNick.tint = 0xE11383;

        var winsX = x + 200;
        var textWins = this.game.add.bitmapText(winsX, y, 'dunkin', 'Wins', 18);
        textWins.tint = 0xE11383;
        y += 30;

        for (var i = 0, len = HOF.length; i < len; i++) {
            
            var player = HOF[i];
            var textNick = this.game.add.bitmapText(x, y, 'dunkin', (i + 1) + ' - ' + player.id, 16);
            textNick.tint = 0xE11383;

            var textWinsPlayer = this.game.add.bitmapText(winsX, y, 'dunkin', String(player.wins), 16);
            textWinsPlayer.tint = 0xE11383;

            y += 20;
        }
        
        // return
        if (true) return;

        var textName = this.game.add.bitmapText(
            this.game.world.centerX, this.game.world.centerY, 'font', 'BUBBLE SHOOTER', 50
        );
        textName.anchor.setTo(0.5); 
        textName.y -= textName.height * 2;

        var singlePlayerButton = Utils.createButton({
            label: 'SINGLE-PLAYER', 
            position: {x : this.game.world.centerX, y: textName.y + textName.height + 100}, 
            callback : function() {
                // if (!Phaser.Device.desktop) {
                    //     this.startFullScreen();
                    // }
                    BubbleShooter.mode = BubbleShooter.MODES.SINGLEPLAYER;
                    this.state.start('game'); 
            }, 
            context: this
        });

        Utils.createButton({
            label: 'MULTIPLAYER', 
            position: {x : this.game.world.centerX, y: singlePlayerButton.y + singlePlayerButton.height + 20}, 
            callback: function() {
                // if (!Phaser.Device.desktop) {
                    //     this.startFullScreen();
                    // }
                    this.getNickName();
                    BubbleShooter.mode = BubbleShooter.MODES.MULTIPLAYER;
                    this.state.start('room'); 
            },
            context: this
        });
    },

    getNickName : function()
    {
        var playerID;
        if (localStorage.getItem('bubble_shooter_nickname')) {
            playerID = localStorage.getItem('bubble_shooter_nickname');
        } else {
            playerID = 'player-' + Math.round(Math.random() * 99999) + 1;
            localStorage.setItem('bubble_shooter_nickname', playerID);
        }
        // BubbleShooter.nickname = localStorage.getItem('nickname') || prompt('your nickname:');
        // BubbleShooter.nickname = Utils.removeAccents(prompt('your nickname:'));
        BubbleShooter.nickname = playerID;
    },

    startFullScreen : function()
    {
        this.game.scale.fullScreenScaleMode = Phaser.ScaleManager.SHOW_ALL;
        this.game.scale.startFullScreen(false);
    },

} 

module.exports = Menu;
