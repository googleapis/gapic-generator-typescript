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
import * as util from 'util';
import { equalToBaseline } from '../util';

const rmrf = util.promisify(rimraf);

const START_SCRIPT = path.join(
  process.cwd(),
  'build',
  'src',
  'start_script.js'
);
const OUTPUT_DIR = path.join(__dirname, '..', '..', '..', '.client_library');
const PROTOS_DIR = path.join(process.cwd(), 'build', 'test', 'protos');
const PROTO_FILE = path.join(
  PROTOS_DIR,
  'google',
  'showcase',
  'v1beta1',
  'echo.proto'
);
const BASELINE_DIR_SHOWCASE = path.join(
  __dirname,
  '..',
  '..',
  '..',
  'typescript',
  'test',
  'testdata',
  'showcase'
);

describe('StarterScriptTest', () => {
  describe('use start script for generating showcase library ', () => {
    it('use custom folder for generated client library.', async function() {
      this.timeout(10000);
      if (fs.existsSync(OUTPUT_DIR)) {
        await rmrf(OUTPUT_DIR);
      }
      fs.mkdirSync(OUTPUT_DIR);
      execSync(
        'node ' +
          START_SCRIPT +
          ` -I${PROTOS_DIR}` +
          ` ${PROTO_FILE}` +
          ` --output_dir=${OUTPUT_DIR}`
      );
      assert(equalToBaseline(OUTPUT_DIR, BASELINE_DIR_SHOWCASE));
    });
  });
});
