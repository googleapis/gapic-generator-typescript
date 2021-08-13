FROM node:12

# Create folder structure
RUN mkdir -p /in
RUN mkdir -p /out
RUN mkdir -p /protos
RUN mkdir -p /root/files
RUN git clone https://github.com/googleapis/gapic-generator-typescript.git
RUN mkdir -p /bazel_root

# Download and install protoc
RUN cd /root/files && \
    wget https://github.com/protocolbuffers/protobuf/releases/download/v3.17.3/protoc-3.17.3-linux-x86_64.zip
RUN cd /usr/local && unzip /root/files/protoc-3.17.3-linux-x86_64.zip
RUN chmod -R ugo+rX /usr/local
RUN chmod ugo+rx /usr/local/bin/protoc

# Download and install bazel
WORKDIR /tools
RUN wget https://github.com/bazelbuild/bazelisk/releases/download/v1.10.1/bazelisk-linux-amd64 -O bazelisk
RUN chmod ugo+rx /tools/bazelisk
Run wget https://github.com/bazelbuild/bazel/releases/download/4.0.0/bazel-4.0.0-linux-x86_64 -O bazel
RUN chmod ugo+rx /tools/bazel
ENV PATH="/tools:${PATH}"
ENV BAZELISK_BIN=/tools/bazelisk
ENV BAZEL_BIN=/tools/bazelisk
ENV BAZEL_ROOT=/bazel_root

# Download a copy of API common protos
RUN cd /root/files && \
    wget https://github.com/googleapis/api-common-protos/archive/master.zip
RUN cd /protos && unzip /root/files/master.zip && chmod -R a+rx /protos

# Add gapic-config-validator plugin
COPY --from=gcr.io/gapic-images/gapic-config-validator /usr/local/bin/protoc-gen-gapic-validator /usr/local/bin/protoc-gen-gapic-validator

# Install the generator
RUN cd /gapic-generator-typescript && bazel build //:gapic_generator_typescript

# Copy the start script
COPY ./start.sh /usr/local/bin/
RUN chmod +x /usr/local/bin/start.sh

# Delete downloaded files
RUN rm -rf /root/files

# Print versions for debugging purposes
RUN gapic-generator-typescript --version
RUN protoc --version
RUN bazel --version

# Save git log output for debugging purposes
COPY ./gitlog.txt /
RUN chmod 666 /gitlog.txt

ENTRYPOINT [ "/usr/local/bin/start.sh" ]
