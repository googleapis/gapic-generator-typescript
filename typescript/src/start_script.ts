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
import * as rimraf from 'rimraf';
import * as readline from 'readline';
const argv = require('yargs').argv

const cwd = process.cwd();

const GOOGLE_GAX_PROTOS_DIR = path.join(
  cwd,
  'node_modules',
  'google-gax',
  'protos'
);
const SRCDIR = path.join(cwd, 'build', 'src');
const CLI = path.join(SRCDIR, 'cli.js');
const PLUGIN = path.join(SRCDIR, 'protoc-gen-typescript_gapic');

// Take OUTPUT_DIR argument
var DEFAULT_OUTPUT_DIR = path.join(cwd, '.client_library');
if(argv.OUTPUT_DIR){
  DEFAULT_OUTPUT_DIR = argv.OUTPUT_DIR;
}
else{
  console.warn('Output directory is not assigned, use default path instead: .client_library');
  if(fs.existsSync(DEFAULT_OUTPUT_DIR)){ 
    rimraf.sync(DEFAULT_OUTPUT_DIR);
  }
  fs.mkdirSync(DEFAULT_OUTPUT_DIR);
}
// Take PROTO_FILE argument
var PROTOS_DIR = '';
var PROTO_FILE = '';
if(argv.PROTOS_DIR){
  PROTOS_DIR = argv.PROTOS_DIR;
  if(argv.PROTO_FILE){
    PROTO_FILE = argv.PROTO_FILE;
  }
  else{
    console.error('Proto file name is not assigned. ');
  }
}
else{
  console.error('Proto file directory is not assigned.');
}
if (fs.existsSync(PLUGIN)) {
  rimraf.sync(PLUGIN);
}
fs.copyFileSync(CLI, PLUGIN);
process.env['PATH'] = SRCDIR + path.delimiter + process.env['PATH'];
try {
  execSync(`chmod +x ${PLUGIN}`);
} catch (err) {
  console.warn(`Failed to chmod +x ${PLUGIN}: ${err}. Ignoring...`);
}
execSync(
  `protoc --typescript_gapic_out=${DEFAULT_OUTPUT_DIR} ` +
  `-I${GOOGLE_GAX_PROTOS_DIR} ` +
  `-I${PROTOS_DIR} ` +
  PROTO_FILE
);

