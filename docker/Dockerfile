FROM node:12

# Create folder structure
RUN mkdir -p /in
RUN mkdir -p /out
RUN mkdir -p /protos
RUN mkdir -p /root/files

# Install the generator
COPY ./package.tgz /root/files/
RUN npm install -g /root/files/package.tgz

# Download and install protoc
RUN cd /root/files && \
    wget https://github.com/protocolbuffers/protobuf/releases/download/v3.12.3/protoc-3.12.3-linux-x86_64.zip
RUN cd /usr/local && unzip /root/files/protoc-3.12.3-linux-x86_64.zip
RUN chmod -R ugo+rX /usr/local
RUN chmod ugo+rx /usr/local/bin/protoc

# Download a copy of API common protos
RUN cd /root/files && \
    wget https://github.com/googleapis/api-common-protos/archive/master.zip
RUN cd /protos && unzip /root/files/master.zip && chmod -R a+rx /protos

# Add gapic-config-validator plugin
COPY --from=gcr.io/gapic-images/gapic-config-validator /usr/local/bin/protoc-gen-gapic-validator /usr/local/bin/protoc-gen-gapic-validator

# Copy the start script
COPY ./start.sh /usr/local/bin/
RUN chmod +x /usr/local/bin/start.sh

# Delete downloaded files
RUN rm -rf /root/files

# Print versions for debugging purposes
RUN gapic-generator-typescript --version
RUN protoc --version

# Save git log output for debugging purposes
COPY ./gitlog.txt /
RUN chmod 666 /gitlog.txt

ENTRYPOINT [ "/usr/local/bin/start.sh" ]
