#!/bin/sh

case "$1" in
    start)
        /usr/bin/nodejs server.js 2>&1 >> /tmp/server.log &
        echo 'server start'
        exit 1
        ;;
    stop)
        /usr/bin/pkill -f 'nodejs server.js'
        echo 'server stop'
        exit 1
        ;;
esac


echo "use start or stop options"
exit 1
