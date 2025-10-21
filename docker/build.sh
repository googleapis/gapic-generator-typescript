#!/bin/sh

# Copyright 2019 Google LLC
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#      http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

### Prepare the package and run `docker build`

set -e
SCRIPTDIR=`dirname "$0"`
cd "$SCRIPTDIR"
cd ..   # now in the package.json directory

# Ensure gitlog.txt is created in the docker directory
git log | head -n 3 > docker/gitlog.txt

npm run compile
npm pack

VERSION=`cat package.json | grep version | awk -F'"' '{ print $4; }'`

# Ensure package.tgz is copied to the docker directory
cp "google-cloud-gapic-generator-$VERSION.tgz" "docker/package.tgz"

# Run docker build from the project root, with the docker directory as context
docker build -t gapic-generator-typescript:latest docker

# Cleanup
rm -f docker/gitlog.txt docker/package.tgz
