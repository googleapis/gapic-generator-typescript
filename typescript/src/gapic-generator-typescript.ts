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

const googleGaxPath = path.dirname(require.resolve('google-gax')); // ...../google-gax/build/src
const googleGaxProtosDir = path.join(googleGaxPath, '..', '..', 'protos');
const allTemplates = fs.readdirSync(
  path.join(__dirname, '..', '..', 'templates')
);

// If we're built with bazel, we'll have a shell wrapper to be used as a protoc plugin.
// Just in case if someone builds us without bazel, let's have a fallback to an actual
// JS protoc plugin without a wrapper.
const protocPluginBash = path.join(__dirname, '..', 'protoc_plugin.sh');
const protocPlugin = fs.existsSync(protocPluginBash)
  ? protocPluginBash
  : path.join(__dirname, 'protoc-plugin.js');

yargs.array('I');
yargs.nargs('I', 1);
yargs.alias('proto_path', 'I');
yargs.alias('proto-path', 'I');
yargs.demandOption('output_dir');
yargs.describe('I', 'Include directory to pass to protoc');
yargs.alias('output-dir', 'output_dir');
yargs.describe(
  'gapic-validator_out',
  'Path to the output of the gapic validator'
);
yargs.alias('gapic-validator_out', 'gapic_validator_out');
yargs.describe(
  'validation',
  'Option to set the validation of proto files, default value is true'
);
yargs.describe('output_dir', 'Path to a directory for the generated code');
yargs.alias('grpc-service-config', 'grpc_service_config');
yargs.describe('grpc-service-config', 'Path to gRPC service config JSON');
yargs.alias('bundle-config', 'bundle_config');
yargs.describe('bundle-config', 'Path to bundle request config JSON');
yargs.alias('iam-service', 'iam_service');
yargs.describe('iam-service', 'Include IAM service to the generated client');
yargs.alias('package-name', 'package_name');
yargs.describe('package-name', 'Publish package name');
yargs.alias('main-service', 'main_service');
yargs.describe(
  'main_service',
  'Main service name (if the package has multiple services, this one will be used for Webpack bundle name)'
);
yargs.alias('common-proto-path', 'common_protos_path');
yargs.describe(
  'common_proto_path',
  'Path to API common protos to use (if unset, will use protos shipped with google-gax)'
);
yargs.describe(
  'template',
  `Semicolon-separated list of templates to use. Allowed values: "${allTemplates.join(
    ';'
  )}"`
);
yargs.describe(
  'metadata',
  'Set to true if GAPIC metadata generation is requested'
);
yargs.boolean('metadata');
yargs.describe(
  'rest',
  'Set to true if API is Google Discovery API, or it requires HTTP transport.'
);
yargs.boolean('rest');
yargs.describe('protoc', 'Path to protoc binary');
yargs.usage('Usage: $0 -I /path/to/googleapis');
yargs.usage('  --output_dir /path/to/output_directory');
yargs.usage('  google/example/api/v1/api.proto');

export interface IArguments {
  [x: string]: unknown;
  outputDir?: string;
  grpcServiceConfig?: string;
  bundleConfig?: string;
  iamService?: string;
  packageName?: string;
  mainService?: string;
  template?: string;
  gapicValidatorOut?: string;
  validation?: string;
  metadata?: boolean;
  protoc?: string;
  protoDirs?: string[];
  commonProtoPath?: string;
  descriptor?: string;
  rest?: boolean;
  _: string[];
  $0: string;
}

const argv = yargs.argv as IArguments;
const outputDir = argv.outputDir as string;
const grpcServiceConfig = argv.grpcServiceConfig as string | undefined;
const bundleConfig = argv.bundleConfig as string | undefined;
const iamService = argv.iamService as string | undefined;
const packageName = argv.packageName as string | undefined;
const mainServiceName = argv.mainService as string | undefined;
const template = argv.template as string | undefined;
const gapicValidatorOut = argv.gapicValidatorOut as string | undefined;
const validation = (argv.validation as string | undefined) ?? 'true';
const metadata = argv.metadata as boolean | undefined;
const rest = argv.rest as boolean | undefined;
const protoc = (argv.protoc as string | undefined) ?? 'protoc';
const protoDirs: string[] = [];
if (argv.I) {
  protoDirs.push(...(argv.I as string[]));
}
const protoDirsArg = protoDirs.map(dir => `-I${dir}`);

const protoFiles: string[] = [];
if (Array.isArray(argv._)) {
  protoFiles.push(...(argv._ as string[]));
} else {
  protoFiles.push(argv._ as string);
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
if (metadata) {
  protocCommand.push('--typescript_gapic_opt="metadata"');
}
if (rest) {
  protocCommand.push('--typescript_gapic_opt="rest"');
}
protocCommand.push(...protoDirsArg);
protocCommand.push(...protoFiles);
protocCommand.push(`-I${commonProtoPath}`);

execFileSync(protoc, protocCommand, {stdio: 'inherit'});

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
        const destination = path.join(copyProtoDir, proto);
        fs.mkdirpSync(path.dirname(destination));
        fs.copyFileSync(protoFile, destination);
      }
    });
  });
fs.unlinkSync(protoList);
