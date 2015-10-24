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
        container.id = 'debug-container';
        container.style.width = window.innerWidth +'px';
        document.body.appendChild(container);

        window.addEventListener('error', function(event) {

            var error = event.error;
            var message = error || event.message;
            var data = {
                message: message,
                file : event.filename,
                line : event.lineno,
                stack: error.stack,
            }

            if (container.innerHTML != '') {
                container.innerHTML += '<br />';
            }

            container.innerHTML += '<span style="color:red;">' + message + '</span><br />';
            container.innerHTML += ' on ' + data.file + ':' + data.line + '<br />';
        });
    }

})(this.window || this);
