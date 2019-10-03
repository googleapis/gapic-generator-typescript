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

import * as assert from 'assert';
import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import * as rimraf from 'rimraf';

const cwd = process.cwd();

const OUTPUT_DIR = path.join(cwd, '.baseline-test-out');
const GENERATED_CLIENT_FILE = path.join(
  OUTPUT_DIR,
  'src',
  'v1beta1',
  'echo_client.ts'
);
const GOOGLE_GAX_PROTOS_DIR = path.join(
  cwd,
  'node_modules',
  'google-gax',
  'protos'
);
const PROTOS_DIR = path.join(cwd, 'build', 'test', 'protos');
const ECHO_PROTO_FILE = path.join(
  PROTOS_DIR,
  'google',
  'showcase',
  'v1beta1',
  'echo.proto'
);
const CLIENT_LIBRARY_BASELINE = path.join(
  cwd,
  'typescript',
  'test',
  'testdata',
  'echo_client_baseline.ts.txt'
);
const SRCDIR = path.join(cwd, 'build', 'src');
const CLI = path.join(SRCDIR, 'cli.js');
const PLUGIN = path.join(SRCDIR, 'protoc-gen-typescript_gapic');

describe('CodeGeneratorTest', () => {
  describe('Generate client library', () => {
    it('Generated client library should have same output with baseline.', function() {
      this.timeout(10000);
      if (fs.existsSync(OUTPUT_DIR)) {
        rimraf.sync(OUTPUT_DIR);
      }
      fs.mkdirSync(OUTPUT_DIR);

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
        `protoc --typescript_gapic_out=${OUTPUT_DIR} ` +
          `-I${GOOGLE_GAX_PROTOS_DIR} ` +
          `-I${PROTOS_DIR} ` +
          ECHO_PROTO_FILE
      );
      assert.strictEqual(
        fs.readFileSync(GENERATED_CLIENT_FILE).toString(),
        fs.readFileSync(CLIENT_LIBRARY_BASELINE).toString()
      );
    });
  });
});
