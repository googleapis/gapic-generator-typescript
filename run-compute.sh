#!/bin/bash

export GOOGLEAPIS=/usr/local/google/home/mzp/git/googleapis
node_modules/.bin/bazel run //:gapic_generator_typescript -- \
    --output-dir /tmp/compute-typescript \
    -I "$GOOGLEAPIS" \
    --grpc-service-config "$GOOGLEAPIS/google/cloud/compute/v1/compute_grpc_service_config.json" \
    --service-yaml "$GOOGLEAPIS/google/cloud/compute/v1/compute_v1.yaml" \
    `find "$GOOGLEAPIS/google/cloud/compute/v1" -name '*.proto'` \
    "$GOOGLEAPIS/google/cloud/common_resources.proto"

