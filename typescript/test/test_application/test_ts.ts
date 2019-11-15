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
import * as fs from 'fs-extra';
import * as path from 'path';
const SHOWCASE_LIB = path.join(
  __dirname,
  '..',
  '..',
  '..',
  '.test-out-showcase'
);
const PACKED_LIB = 'showcase-0.1.0.tgz';
const PACKED_LIB_PATH = path.join(SHOWCASE_LIB, PACKED_LIB);
const PROTOS = path.join(
  __dirname,
  '..',
  '..',
  '..',
  'typescript',
  'test',
  'protos'
);
const LOCAL_TS_APPLICTION = path.join(
  __dirname,
  '..',
  '..',
  '..',
  '.test-application-ts'
);

const TS_TEST_APPLICATION = path.join(
  __dirname,
  '..',
  '..',
  '..',
  'typescript',
  'test',
  'test_application_ts'
);

describe('TestApplication', () => {
  describe('Test application for ts users', () => {
    it('Application test using generated showcase library.', function() {
      this.timeout(120000);
      fs.copySync(PROTOS, path.join(SHOWCASE_LIB, 'protos'));
      fs.copySync(TS_TEST_APPLICATION, LOCAL_TS_APPLICTION);
      process.chdir(SHOWCASE_LIB);
      try {
        execSync(`npm install`);
      } catch (err) {
        console.warn(`Failed to install packages.`);
      }
      try {
        execSync(`npm pack`);
      } catch (err) {
        console.warn(`Failed to pack showcase library`);
      }
      process.chdir(LOCAL_TS_APPLICTION);
      fs.copySync(PACKED_LIB_PATH, path.join(LOCAL_TS_APPLICTION, PACKED_LIB));
      try {
        execSync(`npm install`);
      } catch (err) {
        console.warn(`Failed to install showcase library in test application.`);
      }
      // run integration test
      try {
        execSync(`npm test`);
      } catch (err) {
        console.warn(`Failed to run unit test in test application`);
      }
      // run browser test
      try {
        execSync(`npm run browser-test`);
      } catch (err) {
        console.warn(`Failed to run browser test in test application.`);
      }
    });
  });
});
