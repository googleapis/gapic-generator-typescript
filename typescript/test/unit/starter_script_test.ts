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

const OUTPUT_DIR = path.join(__dirname, '..', '..', '..', '.client_library');
const PROTOS_DIR = path.join(process.cwd(), 'build', 'test', 'protos');
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
    it('use custom folder for generated client library.', function() {
      this.timeout(10000);
      fs.mkdirSync(OUTPUT_DIR);
      execSync(
        `gapic-generator-typescript` +
          ` -I${PROTOS_DIR}` +
          ` ${PROTO_FILE}` +
          ` --output_dir=${OUTPUT_DIR}`
      );
      const GENERATED_CLIENT_FILE = path.join(
        OUTPUT_DIR,
        'src',
        'v1beta1',
        'echo_client.ts'
      );
      assert.strictEqual(
        fs.readFileSync(GENERATED_CLIENT_FILE).toString(),
        fs.readFileSync(CLIENT_LIBRARY_BASELINE).toString()
      );
    });
  });
});
