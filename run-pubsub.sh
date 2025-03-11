#!/bin/bash

export GOOGLEAPIS=/usr/local/google/home/mzp/git/googleapis
node_modules/.bin/bazelisk run //:gapic_generator_typescript -- \
    --output-dir /usr/local/google/home/mzp/git/nodejs-pubsub-test \
    -I "$GOOGLEAPIS" \
    --grpc-service-config "$GOOGLEAPIS/google/pubsub/v1/pubsub_grpc_service_config.json" \
    --service-yaml "$GOOGLEAPIS/google/pubsub/v1/pubsub_v1.yaml" \
    `find "$GOOGLEAPIS/google/pubsub/v1" -name '*.proto'` \
    "$GOOGLEAPIS/google/cloud/common_resources.proto"
