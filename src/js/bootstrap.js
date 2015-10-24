;(function(exports) {

    var BubbleShoot = exports.BubbleShoot = {

        MODES : {
            MULTIPLAYER : 'multiplayer',
            SINGLEPLAYER : 'singleplayer',
        },

        PLAYER_SIDE_TOP : 'top',
        PLAYER_SIDE_BOTTOM: 'bottom',

        BUBBLE_STATE_ON_BOARD : 1,
        BUBBLE_STATE_FIRING : 3,
        BUBBLE_STATE_POPPING : 4,

        debug : false,
        Service : {},
    }; 

    if (this.document) {

        var container = document.createElement('pre');
        container.id = 'debug-container'; container.style.width = window.innerWidth +'px';
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

})(this.window || this);
