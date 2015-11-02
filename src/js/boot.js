var UI = require('./ui.js');

var Boot = function(game) {
    this.game = game;
}    

Boot.prototype = {

    preload : function() {

        this.stage.backgroundColor = UI.background;

        this.load.image('preload-bar', 'src/img/preload-bar.png'); 
        this.load.image('preload-background', 'src/img/preload-backgorund.png'); 
    },

    create : function() {

        // set scale options
        this.input.maxPointers = 1;
        this.scale.scaleMode = Phaser.ScaleManager.SHOW_ALL;
        this.scale.pageAlignHorizontally = true;
        this.scale.pageAlignVertically = true;
        // this.scale.setScreenSize(true);

        // this.scale.forceOrientation(true, false);

        // start the Preloader state
        this.state.start('preloader');
    }

} 

module.exports = Boot;
