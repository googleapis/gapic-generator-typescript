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
yargs.alias('service-yaml', 'service_yaml');
yargs.describe('service-yaml', 'Path to service yaml');
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
  'transport',
  'Default transport is gRPC. Set transport=rest for gRPC or non-gRPC API requires REST transport with http annotation in proto3 files.'
);
yargs.describe(
  'diregapic',
  'DIREGAPIC represents Discovery Rest GAPICs. Set to true for GCE API or non-gRPC APIs with a Discovery doc description.'
);
yargs.describe(
  'handwritten_layer',
  'Set to true if the library has a handwritten layer over GAPIC layer.'
);
yargs.describe(
  'legacy_proto_load',
  'Load protos from *.proto directly at runtime, without compiling a proto JSON file. May speed up loading huge proto trees. Disables all fallback modes.'
);
yargs.boolean('legacy-proto-load');
yargs.alias('legacy-proto-load', 'legacy_proto_load');
yargs.describe('protoc', 'Path to protoc binary');
yargs.usage('Usage: $0 -I /path/to/googleapis');
yargs.usage('  --output_dir /path/to/output_directory');
yargs.usage('  google/example/api/v1/api.proto');

export interface IArguments {
  [x: string]: unknown;
  outputDir?: string;
  grpcServiceConfig?: string;
  bundleConfig?: string;
  serviceYaml?: string;
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
  transport?: string;
  diregapic?: boolean;
  handwrittenLayer?: boolean;
  legacyProtoLoad?: boolean;
  _: string[];
  $0: string;
}

const argv = yargs.argv as IArguments;
const outputDir = argv.outputDir as string;
const grpcServiceConfig = argv.grpcServiceConfig as string | undefined;
const bundleConfig = argv.bundleConfig as string | undefined;
const serviceYaml = argv.serviceYaml as string | undefined;
const packageName = argv.packageName as string | undefined;
const mainServiceName = argv.mainService as string | undefined;
const template = argv.template as string | undefined;
const gapicValidatorOut = argv.gapicValidatorOut as string | undefined;
const validation = (argv.validation as string | undefined) ?? 'true';
const metadata = argv.metadata as boolean | undefined;
const transport = argv.transport as string | undefined;
const diregapic = argv.diregapic as boolean | undefined;
const handwrittenLayer = argv.handwrittenLayer as boolean | undefined;
const legacyProtoLoad = argv.legacyProtoLoad as boolean | undefined;

// --protoc can be passed from BUILD.bazel and overridden from the command line
let protocParameter = argv.protoc as string | string[] | undefined;
if (Array.isArray(protocParameter)) {
  protocParameter = protocParameter[protocParameter.length - 1];
}
const protoc = protocParameter ?? 'protoc';

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
if (serviceYaml) {
  protocCommand.push(`--typescript_gapic_opt="service-yaml=${serviceYaml}"`);
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
if (diregapic) {
  protocCommand.push('--typescript_gapic_opt="diregapic"');
}
if (handwrittenLayer) {
  protocCommand.push('--typescript_gapic_opt="handwritten-layer"');
}
if (transport && transport === 'rest') {
  protocCommand.push('--typescript_gapic_opt="transport=rest"');
}
if (legacyProtoLoad) {
  protocCommand.push('--typescript_gapic_opt="legacy-proto-load"');
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
