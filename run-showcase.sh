#!/bin/bash

export GOOGLEAPIS=/usr/local/google/home/mzp/git/googleapis
export SHOWCASE=/usr/local/google/home/mzp/git/gapic-showcase/schema/google/showcase/v1beta1
mkdir -p /tmp/showcase
node_modules/.bin/bazel run //:gapic_generator_typescript -- \
    --output-dir /tmp/showcase \
    -I "$GOOGLEAPIS" \
    -I "$SHOWCASE" \
    --grpc-service-config "$SHOWCASE/showcase_grpc_service_config.json" \
    --service-yaml "$SHOWCASE/showcase_v1beta1.yaml" \
    `find "$SHOWCASE" -name '*.proto'` \
    "$GOOGLEAPIS/google/cloud/common_resources.proto"

