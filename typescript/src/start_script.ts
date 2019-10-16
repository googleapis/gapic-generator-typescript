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
import * as fs from 'fs';
import * as path from 'path';
import { argv } from 'yargs';

const GOOGLE_GAX_PROTOS_DIR = path.join(
  __dirname,
  '..',
  '..',
  'node_modules',
  'google-gax',
  'protos'
);

// Add executable of plugin to PATH
process.env['PATH'] = __dirname + path.delimiter + process.env['PATH'];

let output_dir = '';
if(argv.output_dir){
  output_dir = argv.output_dir as string;
}else{

}

let protoDirs = [];
if (argv.I) {
  if (Array.isArray(argv.I)) {
    protoDirs.push(...argv.I);
  }
  else {
    protoDirs.push(argv.I);
  }
}
protoDirs = protoDirs.map(dir => `-I${dir}`);

let protoFiles = [];
if (Array.isArray(argv._)) {
  protoFiles.push(...argv._);
}
else {
  protoFiles.push(argv._);
}

execSync(
  `protoc ` +
    `-I${GOOGLE_GAX_PROTOS_DIR} ` +
    `${protoDirs} ` +
    `${protoFiles} ` + 
    `--typescript_gapic_out=${output_dir} `
);
