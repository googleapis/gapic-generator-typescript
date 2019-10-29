#!/bin/sh

### Prepare the package and run `docker build`

SCRIPTDIR=`dirname "$0"`
cd "$SCRIPTDIR"
cd ..   # now in the package.json directory
npm pack

VERSION=`cat package.json | grep version | awk -F'"' '{ print $4; }'`

cp "google-cloud-gapic-generator-$VERSION.tgz" "docker/package.tgz"
cd docker

docker build -t gapic-generator-typescript .
