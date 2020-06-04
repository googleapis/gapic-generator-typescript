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

import {execFileSync} from 'child_process';
import * as path from 'path';
import * as yargs from 'yargs';
import * as fs from 'fs-extra';
const fileSystem = require('file-system'); // eslint-disable-line

const googleGaxPath = path.dirname(require.resolve('google-gax')); // ...../google-gax/build/src
const googleGaxProtosDir = path.join(googleGaxPath, '..', '..', 'protos');
const allTemplates = fs.readdirSync(path.join(__dirname, '..', 'templates'));

// If we're built with bazel, we'll have a shell wrapper to be used as a protoc plugin.
// Just in case if someone builds us without bazel, let's have a fallback to an actual
// JS protoc plugin without a wrapper.
const protocPluginBash = path.join(__dirname, '..', 'protoc_plugin.sh');
const protocPlugin = fs.existsSync(protocPluginBash)
  ? protocPluginBash
  : path.join(__dirname, 'protoc-plugin.js');

const argv = yargs
  .array('I')
  .nargs('I', 1)
  .alias('proto_path', 'I')
  .alias('proto-path', 'I')
  .demandOption('output_dir')
  .describe('I', 'Include directory to pass to protoc')
  .alias('output-dir', 'output_dir')
  .describe('gapic-validator_out', 'Path to the output of the gapic validator')
  .alias('gapic-validator_out', 'gapic_validator_out')
  .describe(
    'validation',
    'Option to set the validation of proto files, default value is true'
  )
  .describe('output_dir', 'Path to a directory for the generated code')
  .alias('grpc-service-config', 'grpc_service_config')
  .describe('grpc-service-config', 'Path to gRPC service config JSON')
  .alias('bundle-config', 'bundle_config')
  .describe('bundle-config', 'Path to bundle request config JSON')
  .alias('iam-service', 'iam_service')
  .describe('iam-service', 'Include IAM service to the generated client')
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
  )
  .describe(
    'template',
    'Semicolon-separated list of templates to use. Allowed values: ' +
      `"${allTemplates.join(';')}"`
  ).usage(`Usage: $0 -I /path/to/googleapis \\
  --output_dir /path/to/output_directory \\
  google/example/api/v1/api.proto`).argv;
const outputDir = argv.outputDir as string;
const grpcServiceConfig = argv.grpcServiceConfig as string | undefined;
const bundleConfig = argv.bundleConfig as string | undefined;
const iamService = argv.iamService as string | undefined;
const packageName = argv.packageName as string | undefined;
const mainServiceName = argv.mainService as string | undefined;
const template = argv.template as string | undefined;
const gapicValidatorOut = argv.gapicValidatorOut as string | undefined;
const validation = (argv.validation as string | undefined) ?? 'true';
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

const commonProtoPath = argv.commonProtoPath || googleGaxProtosDir;

// run protoc command to generate client library
const protocCommand = [
  `--plugin=protoc-gen-typescript_gapic=${protocPlugin}`,
  `--typescript_gapic_out=${outputDir}`,
];
if (gapicValidatorOut && validation === 'true') {
  protocCommand.push(`--gapic-validator_out=${gapicValidatorOut}`);
}
if (grpcServiceConfig) {
  protocCommand.push(
    `--typescript_gapic_opt="grpc-service-config=${grpcServiceConfig}"`
  );
}
if (bundleConfig) {
  protocCommand.push(`--typescript_gapic_opt="bundle-config=${bundleConfig}"`);
}
if (iamService) {
  protocCommand.push(`--typescript_gapic_opt="iam-service=${iamService}"`);
}
if (packageName) {
  protocCommand.push(`--typescript_gapic_opt="package-name=${packageName}"`);
}
if (mainServiceName) {
  protocCommand.push(
    `--typescript_gapic_opt="main-service=${mainServiceName}"`
  );
}
if (template) {
  protocCommand.push(`--typescript_gapic_opt="template=${template}"`);
}
protocCommand.push('--experimental_allow_proto3_optional');
protocCommand.push(...protoDirsArg);
protocCommand.push(...protoFiles);
protocCommand.push(`-I${commonProtoPath}`);

const bazelProtocBinary = path.join(
  __dirname,
  '..',
  '..',
  'com_google_protobuf',
  'protoc'
);
const protocBinary = fs.existsSync(bazelProtocBinary)
  ? bazelProtocBinary
  : 'protoc'; // hope for the best if we're not in bazel

execFileSync(protocBinary, protocCommand, {stdio: 'inherit'});

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
          !fs.existsSync(path.join(googleGaxProtosDir, proto))) &&
        fs.existsSync(protoFile)
      ) {
        fileSystem.copyFileSync(protoFile, path.join(copyProtoDir, proto));
      }
    });
  });
fs.unlinkSync(protoList);
