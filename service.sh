#!/usr/bin/env bash

case "$1" in
    start)
        /usr/bin/nodejs server.js > /tmp/server.log 2> /tmp/server.error.log &
        echo -e "\n - server start\n"
        exit 1
        ;;
    stop)
        /usr/bin/pkill -f 'nodejs server.js'
        echo -e "\n - server stop\n"
        exit 1
        ;;
esac

echo -e "\n - use start or stop options\n"
exit 2
