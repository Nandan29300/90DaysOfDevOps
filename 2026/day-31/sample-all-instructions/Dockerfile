# FROM: start from official Python
FROM python:3.11-slim

# RUN: make a directory and add a file
RUN mkdir /app && echo "Sample File Content" > /app/sample.txt

# COPY: copy files from host into container
COPY main.py /app/
COPY sample.txt /app/

# WORKDIR: set the working directory
WORKDIR /app

# EXPOSE: document port (for example, if using Flask)
EXPOSE 5000

# CMD: set default startup command
CMD ["python", "main.py"]