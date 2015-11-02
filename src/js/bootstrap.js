var BubbleShooter = require('./bubble-shooter.js');
var UI = require('./ui.js');
var Boot = require('./boot.js');
var Preloader = require('./preloader.js');
var Menu = require('./menu.js');
var Room = require('./room.js');
var RoomCreate = require('./room-create.js');
var Game = require('./game.js');
var game = BubbleShooter.game = new Phaser.Game(UI.width, UI.height, Phaser.AUTO);

game.state.add('boot', Boot);
game.state.add('preloader', Preloader);
game.state.add('menu', Menu);
game.state.add('room', Room);
game.state.add('room-create', RoomCreate);
game.state.add('game', Game);
game.state.start('boot'); 

function catchErrors() 
{
    var container = document.createElement('pre');
    container.id = 'debug-container'; 
    container.style.width = window.innerWidth +'px';
    document.body.appendChild(container);

    var debug = function(message) {

        if (container.innerHTML != '') {
            container.innerHTML += '<br />';
        }

        container.innerHTML += message;
    }

    var builtin = window.console.error;
    window.console.error = function() 
    {
        var args = Array.prototype.slice.call(arguments);
        builtin.apply(window.console, args);

        var message = '<hr />';

        args.forEach(function(error) {
            message += ' - ' + error + '<br />';
        });

        message += '<hr />';
        debug(message);
    }

    window.addEventListener('error', function(event) {

        var error = event.error;
        var message = error || event.message;
        var data = {
            message: message,
            file : event.filename,
            line : event.lineno,
            stack: error.stack,
        }

        debug('<span style="color:red;">' + message + '</span><br />');
        debug(' on ' + data.file + ':' + data.line + '<br />');
    });
}
