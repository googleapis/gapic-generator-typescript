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

const DEFAULT_OUTPUT_DIR = path.join(__dirname, '..', '..', '..', '.client_library');
const OUTPUT_DIR = path.join(__dirname, '..', '..', '..', '.baseline-test-out');;
const PROTOS_DIR = 'build/test/protos/';
const PROTO_FILE = path.join(
    PROTOS_DIR,
    'google',
    'showcase',
    'v1beta1',
    'echo.proto'
  );
const CLIENT_LIBRARY_BASELINE = path.join(
  __dirname,
  '..',
  '..',
  '..',
  'typescript',
  'test',
  'testdata',
  'echo_client_baseline.ts.txt'
);

describe('StarterScriptTest', () => {
  describe('use start script for generating showcase library ', () => {
    it('use default folder for generated client library.', function() {
        this.timeout(10000);
      execSync(`sudo npm install -g .`);
      execSync(`gapic-generator-typescript`+ ` --PROTOS_DIR=${PROTOS_DIR}` + ` --PROTO_FILE=${PROTO_FILE}`);
      const GENERATED_CLIENT_FILE = path.join(
        DEFAULT_OUTPUT_DIR,
        'src',
        'v1beta1',
        'echo_client.ts');
      assert.strictEqual(
        fs.readFileSync(GENERATED_CLIENT_FILE).toString(),
        fs.readFileSync(CLIENT_LIBRARY_BASELINE).toString()
      );
    });
    it('use custom folder for generated client library.', function() {
        this.timeout(10000);
        execSync(`gapic-generator-typescript`+ ` --PROTOS_DIR=${PROTOS_DIR}` + ` --PROTO_FILE=${PROTO_FILE}` + ` --OUTPUT_DIR=${OUTPUT_DIR}`);
        const GENERATED_CLIENT_FILE = path.join(
          OUTPUT_DIR,
          'src',
          'v1beta1',
          'echo_client.ts');
        assert.strictEqual(
          fs.readFileSync(GENERATED_CLIENT_FILE).toString(),
          fs.readFileSync(CLIENT_LIBRARY_BASELINE).toString()
        );
      });
  });
});
