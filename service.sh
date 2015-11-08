#!/usr/bin/env bash

case "$1" in
    start)
        /usr/bin/nodejs server.js > /tmp/server.log &
        echo -e "\n - server start\n"
        exit 1
        ;;
    stop)
        /usr/bin/pkill -f 'nodejs server.js'
        echo -e "\n - server stop\n"
        exit 1
        ;;
    restart)
        /usr/bin/pkill -f 'nodejs server.js'
        /usr/bin/nodejs server.js > /tmp/server.log &
        echo -e "\n - server restart\n"
        exit 1
        ;;
esac

echo -e "\n - use start|stop|restart arguments\n"
exit 2
