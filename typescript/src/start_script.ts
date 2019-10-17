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

import { execFileSync } from 'child_process';
import * as path from 'path';
import { argv } from 'yargs';
import * as fs from 'fs-extra';
const fileSystem = require('file-system');

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
  console.error('Output directory is required: --output_dir path');
  process.exit(1);
}

const protoDirs: string[] = [];
if (argv.I) {
  if (Array.isArray(argv.I)) {
    protoDirs.push(...argv.I);
  } else {
    protoDirs.push(argv.I as string);
  }
}
const protoDirsArg = protoDirs.map(dir => `-I${dir}`);

const protoFiles = [];
if (Array.isArray(argv._)) {
  protoFiles.push(...argv._);
} else {
  protoFiles.push(argv._);
}

// run protoc command to generate client library
const protocCommand = [
  `-I${GOOGLE_GAX_PROTOS_DIR}`,
  `--typescript_gapic_out=${outputDir}`,
];
protocCommand.push(...protoDirsArg);
protocCommand.push(...protoFiles);
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
  fs.readFileSync(protoList)
    .toString()
    .split('\n')
    .filter(proto => !fs.existsSync(path.join(GOOGLE_GAX_PROTOS_DIR, proto)))
    .forEach(proto => {
      protoDirs.forEach(dir => {
        const protoFile = path.join(dir, proto);
        if (fs.existsSync(protoFile)) {
          fileSystem.copyFileSync(protoFile, path.join(copyProtoDir, proto));
        }
      });
    });
} catch (err) {
  console.error(err.toString());
  process.exit(1);
}
