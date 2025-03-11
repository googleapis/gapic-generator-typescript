#!/bin/bash

export GOOGLEAPIS=/usr/local/google/home/mzp/git/googleapis
node_modules/.bin/bazel run //:gapic_generator_typescript -- \
    --output-dir /tmp/translate-v3-typescript \
    -I "$GOOGLEAPIS" \
    --grpc-service-config "$GOOGLEAPIS/google/cloud/translate/v3/translate_grpc_service_config.json" \
    --service-yaml "$GOOGLEAPIS/google/cloud/translate/v3/translate_v3.yaml" \
    `find "$GOOGLEAPIS/google/cloud/translate/v3" -name '*.proto'` \
    "$GOOGLEAPIS/google/cloud/common_resources.proto"

