#!/usr/bin/env node

// Copyright 2020 Google LLC
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     https://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

import { execFileSync } from 'child_process';
import * as path from 'path';
import * as yargs from 'yargs';
import * as fs from 'fs-extra';
const fileSystem = require('file-system');

const googleGaxPath = path.dirname(require.resolve('google-gax')); // ...../google-gax/build/src
const GOOGLE_GAX_PROTOS_DIR = path.join(googleGaxPath, '..', '..', 'protos');

const argv = yargs
  .array('I')
  .nargs('I', 1)
  .alias('proto_path', 'I')
  .alias('proto-path', 'I')
  .demandOption('output_dir')
  .describe('I', 'Include directory to pass to protoc')
  .alias('output-dir', 'output_dir')
  .describe('output_dir', 'Path to a directory for the generated code')
  .alias('grpc-service-config', 'grpc_service_config')
  .describe('grpc-service-config', 'Path to gRPC service config JSON')
  .alias('package-name', 'package_name')
  .describe('package-name', 'Publish package name')
  .alias('main-service', 'main_service')
  .describe(
    'main_service',
    'Main service name (if the package has multiple services, this one will be used for Webpack bundle name)'
  )
  .alias('common-proto-path', 'common_protos_path')
  .describe(
    'common_proto_path',
    'Path to API common protos to use (if unset, will use protos shipped with google-gax)'
  ).usage(`Usage: $0 -I /path/to/googleapis \\
  --output_dir /path/to/output_directory \\
  google/example/api/v1/api.proto`).argv;
const outputDir = argv.outputDir as string;
const grpcServiceConfig = argv.grpcServiceConfig as string | undefined;
const packageName = argv.packageName as string | undefined;
const mainServiceName = argv.mainService as string | undefined;
const protoDirs: string[] = [];
if (argv.I) {
  protoDirs.push(...(argv.I as string[]));
}
const protoDirsArg = protoDirs.map(dir => `-I${dir}`);

const protoFiles = [];
if (Array.isArray(argv._)) {
  protoFiles.push(...argv._);
} else {
  protoFiles.push(argv._);
}

const commonProtoPath = argv.commonProtoPath || GOOGLE_GAX_PROTOS_DIR;

// run protoc command to generate client library
const cliPath = path.join(__dirname, 'cli.js');
const protocCommand = [
  `--plugin=protoc-gen-typescript_gapic=${cliPath}`,
  `--typescript_gapic_out=${outputDir}`,
];
if (grpcServiceConfig) {
  protocCommand.push(
    `--typescript_gapic_opt="grpc-service-config=${grpcServiceConfig}"`
  );
}
if (packageName) {
  protocCommand.push(`--typescript_gapic_opt="package-name=${packageName}"`);
}
if (mainServiceName) {
  protocCommand.push(
    `--typescript_gapic_opt="main-service=${mainServiceName}"`
  );
}
protocCommand.push(...protoDirsArg);
protocCommand.push(...protoFiles);
protocCommand.push(`-I${commonProtoPath}`);
try {
  execFileSync(`protoc`, protocCommand, { stdio: 'inherit' });
} catch (err) {
  console.error(err.toString());
  process.exit(1);
}

try {
  // create protos folder to copy proto file
  const copyProtoDir = path.join(outputDir, 'protos');
  if (!fs.existsSync(copyProtoDir)) {
    fs.mkdirSync(copyProtoDir);
  }
  // copy proto file to generated folder
  const protoList = path.join(outputDir, 'proto.list');
  const protoFilesSet = new Set(protoFiles);
  fs.readFileSync(protoList)
    .toString()
    .split('\n')
    .forEach(proto => {
      protoDirs.forEach(dir => {
        const protoFile = path.join(dir, proto);
        if (
          (protoFilesSet.has(protoFile) ||
            !fs.existsSync(path.join(GOOGLE_GAX_PROTOS_DIR, proto))) &&
          fs.existsSync(protoFile)
        ) {
          fileSystem.copyFileSync(protoFile, path.join(copyProtoDir, proto));
        }
      });
    });
} catch (err) {
  console.error(err.toString());
  process.exit(1);
}
