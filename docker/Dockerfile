FROM node:12-alpine

# Create folder structure
RUN mkdir -p /in
RUN mkdir -p /out
RUN mkdir -p /protos
RUN mkdir -p /root/files

# Install the generator
COPY ./package.tgz /root/files/
RUN npm install -g /root/files/package.tgz

# Download and install protoc
RUN apk update && apk add libc6-compat && rm -f /var/cache/apk/*
ENV LD_LIBRARY_PATH /lib64:$LD_LIBRARY_PATH
RUN cd /root/files && \
    wget https://github.com/protocolbuffers/protobuf/releases/download/v3.10.0/protoc-3.10.0-linux-x86_64.zip
RUN cd /usr/local && unzip /root/files/protoc-3.10.0-linux-x86_64.zip

# Download a copy of API common protos
RUN cd /root/files && \
    wget https://github.com/googleapis/api-common-protos/archive/master.zip
RUN cd /protos && unzip /root/files/master.zip && chmod -R a+rx /protos

# Copy the start script
COPY ./start.sh /usr/local/bin/
RUN chmod +x /usr/local/bin/start.sh

# Delete downloaded files
RUN rm -rf /root/files

# Print versions for debugging purposes
RUN gapic-generator-typescript --version
RUN protoc --version

ENTRYPOINT [ "/usr/local/bin/start.sh" ]
