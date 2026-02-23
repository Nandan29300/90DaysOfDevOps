FROM nginx:alpine

# WORKDIR is optional for copying, but can be included:
WORKDIR /usr/share/nginx/html

# COPY: place index.html into web server default dir
COPY index.html .

# EXPOSE: document webserver port
EXPOSE 80

# Default CMD for nginx image is already: ["nginx", "-g", "daemon off;"]