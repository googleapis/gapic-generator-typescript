#!/bin/sh

### Test script pulling the docker image and use it against showcase proto.

# Docker image tag: gapic-generator-typescript:latest.
DIR_NAME=.showcase-typescript
# Remove test directory if it already exists
rm -rf $DIR_NAME
# Create new directory showcase-typescript. 
mkdir $DIR_NAME
# Use Docker Image for generating showcase client library
docker run --rm \
  --mount type=bind,source=`pwd`/typescript/test/protos/google/showcase/v1beta1,destination=/in/typescript/test/protos/google/showcase/v1beta1,readonly \
  --mount type=bind,source=`pwd`/.showcase-typescript,destination=/out \
  gcr.io/gapic-images/gapic-generator-typescript:latest
# Test generated client library
cd .showcase-typescript
npm install  # install dependencies
npm run fix  # format the code
npm test     # run unit tests

# Test succeed
echo 'docker test succeeded! '
