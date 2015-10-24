;(function(exports) {

    var Menu = function(_game) 
    {
        this.game = _game;
    }    

    Menu.prototype = {

        create: function() 
        {
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
                    BubbleShoot.mode = BubbleShoot.MODES.SINGLEPLAYER;
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
                    BubbleShoot.mode = BubbleShoot.MODES.MULTIPLAYER;
                    this.state.start('room'); 
                },
                context: this
            });
        },

        getNickName : function()
        {
            // BubbleShoot.nickname = localStorage.getItem('nickname') || prompt('your nickname:');
            // BubbleShoot.nickname = Utils.removeAccents(prompt('your nickname:'));
            BubbleShoot.nickname = 'player-' + Math.round(Math.random() * 99999) + 1;
            localStorage.setItem('nickname', BubbleShoot.nickname);
        },

        startFullScreen : function()
        {
            this.game.scale.fullScreenScaleMode = Phaser.ScaleManager.SHOW_ALL;
            this.game.scale.startFullScreen(false);
        },

    } 

    exports.Menu = Menu;

})(this);
