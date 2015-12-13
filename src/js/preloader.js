var Preloader = function(game) {
    this.game = game;
}    

Preloader.prototype = {

    preload: function() {

        var bg = this.game.add.image(0, 0, 'loading-bg');

        bck = this.add.sprite(this.world.centerX, this.world.centerY, 'preload-background');
        bck.anchor.setTo(0.5,0.5);
        bck.scale.setTo(0.5,0.5);
        preloadBar = this.add.sprite(this.world.centerX, this.world.centerY, 'preload-bar');
        preloadBar.anchor.setTo(0,0.5);
        preloadBar.scale.setTo(0.5,1);
        preloadBar.x = this.world.centerX - preloadBar.width/2;

        this.load.setPreloadSprite(preloadBar);

        document.getElementById('loader').style.display = 'none';

        this.load.atlasJSONHash('sprites', 'src/img/sprites.png', 'src/json/sprites.json');
        this.load.atlasJSONHash('hand', 'src/img/hand.png', 'src/json/hand.json');
        this.load.bitmapFont('font', 'src/img/font.png', 'src/xml/font.xml');
        this.load.bitmapFont('dunkin', 'src/img/dunkin.png', 'src/xml/dunkin.fnt');
        this.load.image('arrow', 'src/img/arrow.png');
    },

    create: function() {
        this.state.start('menu');
    }

} 

module.exports = Preloader;
