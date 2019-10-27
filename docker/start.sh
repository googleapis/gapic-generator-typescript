#!/bin/sh

### Start script that is an entry point for a Docker image.

# Change directory to the input directory. 
# Make it easier to pass gRPC service config relative to it, e.g.
# --grpc-service-config google/cloud/texttospeech/v1/texttospeech_grpc_service_config.json

cd /in 
gapic-generator-typescript \
  --common-proto-path /protos/api-common-protos-master \
  -I /in \
  --output-dir /out \
  $* \
  `find /in -name '*.proto'`
exit 0
