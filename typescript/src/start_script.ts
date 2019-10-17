#!/usr/bin/env node
// Copyright 2019 Google LLC
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

import { execSync } from 'child_process';
import * as path from 'path';
import { argv } from 'yargs';
import * as fs from 'fs-extra';
import { Dirent } from 'fs-extra';

const GOOGLE_GAX_PROTOS_DIR = path.join(
  __dirname,
  '..',
  '..',
  'node_modules',
  'google-gax',
  'protos'
);

// Add folder of plugin to PATH
process.env['PATH'] = __dirname + path.delimiter + process.env['PATH'];

let outputDir = '';
if (argv.output_dir) {
  outputDir = argv.output_dir as string;
} else {
  process.exit(1);
}

const protoDirs = [];
if (argv.I) {
  if (Array.isArray(argv.I)) {
    protoDirs.push(...argv.I);
  } else {
    protoDirs.push(argv.I);
  }
}
const protoDirsArg = protoDirs.map(dir => `-I${dir}`);

let protoFiles = [];
if (Array.isArray(argv._)) {
  protoFiles.push(...argv._);
} else {
  protoFiles.push(argv._);
}
protoFiles = protoFiles.map(file => `${file}`);

// run protoc command to generate client library
try {
  execSync(
    `protoc ` +
      `-I${GOOGLE_GAX_PROTOS_DIR} ` +
      `${protoDirsArg} ` +
      `${protoFiles} ` +
      `--typescript_gapic_out=${outputDir} `
  );
} catch (err) {
  process.exit(1);
}

// create protos folder to copy proto file
const COPY_PROTO_DIR = path.join(outputDir, 'protos');
if (!fs.existsSync(COPY_PROTO_DIR)) {
  fs.mkdirSync(COPY_PROTO_DIR);
}
// copy proto file to generated folder
try {
  protoDirs.forEach(dir => {
    fs.copySync(dir, COPY_PROTO_DIR);
  });
} catch (err) {
  process.exit(1);
}
