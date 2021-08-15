#!/bin/sh

### Start script that is an entry point for a Docker image.

# Dump the version of the current code to stderr
echo "gapic-generator-typescript: https://github.com/googleapis/gapic-generator-typescript" 1>&2
echo "Latest commit: " 1>&2
cat /gitlog.txt 1>&2
echo 1>&2

# Change directory to the input directory.
# Make it easier to pass gRPC service config relative to it, e.g.
# --grpc-service-config google/cloud/texttospeech/v1/texttospeech_grpc_service_config.json
protoc --version
echo '---------------after protoc version-------------------'
printenv
echo '---------------after print env------------------------'
bazel --version
echo '---------------after bazel version------------------------'
npm --version
node --version
echo '---------------after npm --version------------------------'
cd $GENERATOR
pwd
echo '---------------after ls command------------------------'
npm link
bazel run //:gapic_generator_typescript -- -I /in --output_dir /out \
`find /in -name '*.proto'` --common-proto-path /protos/api-common-protos-master

echo '---------------after bazel run------------------------'
ls $TEST_TMPDIR

cd /out
pwd
ls
exit 0
