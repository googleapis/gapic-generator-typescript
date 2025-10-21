#!/bin/sh

### Start script that is an entry point for a Docker image.

# Dump the version of the current code to stderr
echo "gapic-generator-typescript: https://github.com/googleapis/gapic-generator-typescript" 1>&2
echo "Latest commit: " 1>&2
cat /gitlog.txt 1>&2
echo 1>&2

# Debugging: List contents of /usr/local/bin and check plugin
echo "Contents of /usr/local/bin:" 1>&2
ls -l /usr/local/bin 1>&2
echo "" 1>&2
echo "Which protoc-gen-typescript_gapic:" 1>&2
which protoc-gen-typescript_gapic 1>&2
echo "" 1>&2
echo "File type of protoc-gen-typescript_gapic:" 1>&2
file $(which protoc-gen-typescript_gapic) 1>&2
echo "" 1>&2

# Change directory to the input directory.
# Make it easier to pass gRPC service config relative to it, e.g.
# --grpc-service-config google/cloud/texttospeech/v1/texttospeech_grpc_service_config.json

cd /in

echo "Running protoc with plugin: protoc-gen-typescript_gapic" 1>&2
/usr/local/bin/protoc \
  --plugin=protoc-gen-typescript_gapic \
  --gapic-validator_out=. \
  -I /in \
  --typescript_gapic_out=common-proto-path=/protos:/out \
  $* \
  `find /in -name '*.proto'`

echo "$(ls -al /out)"
exit 0
