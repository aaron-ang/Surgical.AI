sudo apt-get update
sudo apt-get install linux-headers-$(uname -r) dkms
sudo apt-get install ffmpeg
sudo apt install nginx
sudo apt install libnginx-mod-rtmp
sudo cp /etc/nginx/nginx.conf /etc/nginx/nginx.conf.bak
sudo tee -a /etc/nginx/nginx.conf <<'EOF'
rtmp {
    server {
        listen 1935;
        chunk_size 4096;

        application live {
            live on;
            record off;
        }
    }
}
EOF
sudo nginx -t
sudo service nginx restart
