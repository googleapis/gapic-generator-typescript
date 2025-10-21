#!/bin/sh

exec node /usr/local/lib/node_modules/@google-cloud/gapic-generator/build/typescript/src/protoc-plugin-wrapper.cjs "$@"