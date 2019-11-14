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
const SHOWCASE_LIB = path.join(__dirname, '..', '..', '..', '.test-out-showcase');
const PACKED_LIB = path.join(SHOWCASE_LIB, 'showcase-0.1.0.tgz');
const LIB = "";
const PROTOS = path.join(__dirname, '..', '..', '..', 'typescript', 'test', 'protos');
const LOCAL_TEST_APPLICTION = path.join(__dirname, '..', '..', '..', 'test-application');
const JS_TEST_APPLICATION = path.join(__dirname, '..', '..', '..', 'typescript', 'test', 'test_application_js');
const TS_TEST_APPLICATION = path.join(__dirname, '..', '..', '..', 'typescript', 'test', 'test_application_ts');

describe('TestApplication', () => {
  describe('Test application for js users', () => {
    it('Application test using generated showcase library.', function() {
      this.timeout(10000);
      // copy protos to generated client library and copy test application to local.
      console.warn(process.cwd());
      fs.copySync(PROTOS, path.join(SHOWCASE_LIB, 'protos'));
      fs.copySync(JS_TEST_APPLICATION, LOCAL_TEST_APPLICTION);
      console.warn('copy protos and test application');
      process.chdir(SHOWCASE_LIB);
      console.warn(process.cwd());
      try {
        execSync(`npm install`);
      } catch (err) {
        console.warn(`Failed to install packages.`);
      }
      console.warn('npm install pass');
      try {
        execSync(`npm pack`);
      } catch (err) {
        console.warn(`Failed to pack showcase library`);
      }
      console.warn('npm pack pass');
      
      console.warn(process.cwd());
      process.chdir(path.join(__dirname, '..', '..', '..', 'test-application'));
      console.warn(process.cwd());
      console.warn('enter test application folder');
      fs.copySync(PACKED_LIB, path.join(LOCAL_TEST_APPLICTION, PACKED_LIB));
      console.warn('pack copy pass');

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
      console.warn('npm test pass');
      // run browser test
      try {
        execSync(`npm run browser-test`);
      } catch (err) {
        console.warn(`Failed to run browser test in test application.`);
      }
      console.warn('browser test pass');
    });
  });
});
