
var 
    // value objects
    _queue = {},
    _running = {},
    _attempts = {},
    _clients = {},

    // config
    _tick = 30, // send delay
    _limit = 30, // limit of attempts
    _delayIncrease = 10 // ms multiplied by the attempts
;

var PlayerDataQueue = {

    addClient: function(playerID, client)
    {
        clients[playerID] = client;
    },

    nextTick : function(playerID, waiting)
    {
        var tick = _tick;
        console.log('nextTick', playerID, wait);
        if (waiting) {
            _attempts[playerID] = _attempts[playerID] + 1 || 1 ; 
            if (_attempts[playerID] >= _limit) {
                return false;
            }
            tick += _attempts[playerID] * _delayIncrease;
        }
        return setTimeout(this.send(playerID), _tick);
    },

    add : function(playerID, key, data) 
    {
        console.log('add()', playerID, key, data);
        _attempts[playerID] = 0; 

        if (!_queue[playerID]) {
            _queue[playerID] = [];
        }

        _queue[playerID].push({key: key, data: data});
        this.send(playerID);
    },

    remove : function(playerID, data)
    {
        console.log('remove', playerID, data);
        var index = _queue[playerID].indexOf(data);
        if (index > -1) {
            _queue[playerID].splice(index, 1);
        }
    },

    clear : function(playerID)
    {
        console.log('clear()', playerID);
        delete _queue[playerID];
        delete _running[playerID];
        delete _attempts[playerID];
        delete _clients[playerID]
    },

    send : function(playerID) 
    {
        console.log('send()', playerID);
        var queue = _queue[playerID];

        if (!queue || queue.length == 0) {
            console.log('  - 1] empty queue', queue);
            return false;
        }

        var _this = this;
        var client = clients[playerID];

        if (!client) {
            console.log('  - 2] empty client');
            return this.nextTick(playerID);
        }

        if (_running[playerID]) {
            console.log('  - 3] running', _running[playerID]);
            return this.nextTick(playerID, true);
        }

        _running[playerID] = true;
        var current = queue[0];

        console.log('  - 4] emit', current);

        client.emit(current.key, current.data, function() {
            _this.remove(playerID, current);
            _running[playerID] = false;
        });
    },

}

exports.PlayerDataQueue = PlayerDataQueue;
