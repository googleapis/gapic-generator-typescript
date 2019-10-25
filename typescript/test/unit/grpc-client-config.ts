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
import { equalToBaseline } from '../util';

const cwd = process.cwd();

const OUTPUT_DIR = path.join(cwd, '.test-out-texttospeech');
const GOOGLE_GAX_PROTOS_DIR = path.join(
  cwd,
  'node_modules',
  'google-gax',
  'protos'
);
const PROTOS_DIR = path.join(cwd, 'build', 'test', 'protos');
const TTS_PROTO_FILE = path.join(
  PROTOS_DIR,
  'google',
  'cloud',
  'texttospeech',
  'v1',
  'cloud_tts.proto'
);

const GRPC_SERVICE_CONFIG = path.join(
  PROTOS_DIR,
  'google',
  'cloud',
  'texttospeech',
  'v1',
  'texttospeech_grpc_service_config.json'
);

const BASELINE_DIR = path.join(
  __dirname,
  '..',
  '..',
  '..',
  'typescript',
  'test',
  'testdata',
  'texttospeech'
);

const SRCDIR = path.join(cwd, 'build', 'src');
const CLI = path.join(SRCDIR, 'cli.js');

describe('gRPC Client Config', () => {
  describe('Generate Text-to-Speech library', () => {
    it('Generated proto list should have same output with baseline.', function() {
      this.timeout(10000);
      if (fs.existsSync(OUTPUT_DIR)) {
        rimraf.sync(OUTPUT_DIR);
      }
      fs.mkdirSync(OUTPUT_DIR);

      try {
        execSync(`chmod +x ${CLI}`);
      } catch (err) {
        console.warn(`Failed to chmod +x ${CLI}: ${err}. Ignoring...`);
      }

      execSync(
        `node build/src/start_script.js ` +
          `--output-dir=${OUTPUT_DIR} ` +
          `-I ${GOOGLE_GAX_PROTOS_DIR} ` +
          `-I ${PROTOS_DIR} ` +
          `--grpc-service-config=${GRPC_SERVICE_CONFIG} ` +
          TTS_PROTO_FILE
      );
      assert(equalToBaseline(OUTPUT_DIR, BASELINE_DIR));
    });
  });
});
