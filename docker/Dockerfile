FROM node:12

RUN apt-get update && apt-get install -y curl
RUN curl -sL https://deb.nodesource.com/setup_8.x | bash -
RUN apt-get update && apt-get install -y nodejs

# Create folder structure
RUN mkdir -p /in
RUN mkdir -p /out
RUN mkdir -p /protos
RUN mkdir -p /root/files
RUN mkdir -p /.cache

# Download and install protoc
RUN cd /root/files && \
    wget https://github.com/protocolbuffers/protobuf/releases/download/v3.17.3/protoc-3.17.3-linux-x86_64.zip
RUN cd /usr/local && unzip /root/files/protoc-3.17.3-linux-x86_64.zip
RUN chmod -R ugo+rX /usr/local
RUN chmod ugo+rx /usr/local/bin/protoc

# Download and install bazel
RUN mkdir -p /tools
WORKDIR /tools
RUN curl -L https://github.com/bazelbuild/bazelisk/releases/download/v1.10.1/bazelisk-linux-amd64 -o bazelisk
RUN chmod +x bazelisk
RUN curl -L https://github.com/bazelbuild/bazel/releases/download/4.0.0/bazel-4.0.0-linux-x86_64 -o bazel
RUN chmod +x bazel
WORKDIR /
ENV PATH="/tools:${PATH}"
ENV BAZELISK_BIN=/tools/bazelisk
ENV BAZEL_BIN=/tools/bazel


# Download a copy of API common protos
RUN cd /root/files && \
    wget https://github.com/googleapis/api-common-protos/archive/master.zip
RUN cd /protos && unzip /root/files/master.zip && chmod -R a+rx /protos

# Add gapic-config-validator plugin
COPY --from=gcr.io/gapic-images/gapic-config-validator /usr/local/bin/protoc-gen-gapic-validator /usr/local/bin/protoc-gen-gapic-validator

# Bazel build the generator
RUN cd /root/files && \
    wget https://github.com/googleapis/gapic-generator-typescript/archive/v2.3.0.tar.gz
RUN cd /usr/local && tar -xf /root/files/v2.3.0.tar.gz
RUN chmod -R ugo+rX /usr/local/gapic-generator-typescript-2.3.0
ENV GENERATOR=/usr/local/gapic-generator-typescript-2.3.0
WORKDIR $GENERATOR
RUN bazel build //...
WORKDIR /

# Copy the start script
COPY ./start.sh /usr/local/bin/
RUN chmod +x /usr/local/bin/start.sh

# Delete downloaded files
RUN rm -rf /root/files

# Print versions for debugging purposes
RUN protoc --version
RUN bazel --version

# Save git log output for debugging purposes
COPY ./gitlog.txt /
RUN chmod 666 /gitlog.txt

ENTRYPOINT [ "/usr/local/bin/start.sh" ]
