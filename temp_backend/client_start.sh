#!/bin/bash

ssh -L 1935:localhost:1935 ubuntu@host

ffmpeg -f avfoundation -framerate 30 -i "0" \
    -vcodec libx264 -preset ultrafast -tune zerolatency \
    -maxrate 3000k -bufsize 6000k \
    -pix_fmt yuv420p -g 30 -f flv rtmp://localhost/live/stream
