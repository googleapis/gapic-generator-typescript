FROM node:22-bookworm AS builder

RUN apt-get update && \
    apt-get install -y --no-install-recommends \
        build-essential \
        zip \
        unzip \
        curl \
        git \
        jq \
        ca-certificates \
    && apt-get clean && \
    rm -rf /var/lib/apt/lists/*

FROM builder AS protoc

ARG PROTOBUF_VERSION=25.3

WORKDIR /build

ADD https://github.com/protocolbuffers/protobuf/releases/download/v${PROTOBUF_VERSION}/protoc-${PROTOBUF_VERSION}-linux-x86_64.zip /build/protoc.zip
RUN unzip /build/protoc.zip -d protoc && \
    chmod +x /build/protoc/bin/protoc

FROM builder AS generator

ARG GAPIC_GENERATOR_TYPESCRIPT_VERSION=4.11.2

WORKDIR /build

COPY . /build/gapic-generator-typescript
RUN cd /build/gapic-generator-typescript && \
    npm ci && \
    npm pack && \
    tar -zxvf google-cloud-gapic-generator-${GAPIC_GENERATOR_TYPESCRIPT_VERSION}.tgz

FROM builder

COPY --from=generator /build/gapic-generator-typescript/package /build/gapic-generator-typescript
COPY --from=generator /build/gapic-generator-typescript/package-lock.json /build/gapic-generator-typescript
COPY --from=protoc /build/protoc/bin/protoc /usr/local/bin

WORKDIR /build

RUN cd /build/gapic-generator-typescript && \
    npm ci --production

ENV PATH="/build/gapic-generator-typescript/build/typescript/src:$PATH"