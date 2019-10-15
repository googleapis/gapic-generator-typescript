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

// Take OUTPUT_DIR argument
let DEFAULT_OUTPUT_DIR = path.join(__dirname, '..', '..', '.client_library');
if (argv.OUTPUT_DIR) {
  DEFAULT_OUTPUT_DIR = argv.OUTPUT_DIR as string;
} else {
  console.warn(
    'Output directory is not assigned, use default path instead: .client_library'
  );
  if (fs.existsSync(DEFAULT_OUTPUT_DIR)) {
    console.warn(' Default client library folder already exists! ');
  }
  fs.mkdirSync(DEFAULT_OUTPUT_DIR);
}
// Take PROTO_FILE argument
let PROTOS_DIR = '';
let PROTO_FILE = '';
if (argv.PROTOS_DIR) {
  PROTOS_DIR = argv.PROTOS_DIR as string;
  if (argv.PROTO_FILE) {
    PROTO_FILE = argv.PROTO_FILE as string;
  } else {
    console.error('Proto file name is not assigned. ');
  }
} else {
  console.error('Proto file directory is not assigned.');
}
execSync(
  `protoc --typescript_gapic_out=${DEFAULT_OUTPUT_DIR} ` +
    `-I${GOOGLE_GAX_PROTOS_DIR} ` +
    `-I${PROTOS_DIR} ` +
    PROTO_FILE
);
