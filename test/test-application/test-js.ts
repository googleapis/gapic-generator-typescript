// Copyright 2020 Google LLC
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

import * as util from 'util';
import * as child_process from 'child_process';
import * as fs from 'fs-extra';
import * as path from 'path';
import {describe, it} from 'mocha';

const exec = util.promisify(child_process.exec);
const root = process.cwd();
const baselineZip = path.join(
  root,
  'bazel-testlogs',
  'unit_tests',
  'test.outputs',
  'outputs.zip'
);
const showcaseLib = path.join(root, '.test-out-showcase');
const packedLib = 'showcase-0.1.0.tgz';
const packedLibPath = path.join(showcaseLib, packedLib);
const testFixtures = path.join(root, 'test-fixtures');
const protos = path.join(testFixtures, 'protos');
const jsTestApplication = path.join(testFixtures, 'test-application-js');
const localJsApplication = path.join(root, '.test-application-js');

describe('Test application for JavaScript users', () => {
  it('unzip showcase test output', async function () {
    this.timeout(20000);
    process.chdir(root);
    await exec(`unzip -o "${baselineZip}" '.test-out-showcase/*' -d .`);
  });
  it('npm install showcase', async function () {
    this.timeout(60000);
    // copy protos to generated client library and copy test application to local.
    fs.copySync(protos, path.join(showcaseLib, 'protos'));
    fs.copySync(jsTestApplication, localJsApplication);
    process.chdir(showcaseLib);
    await exec('npm install');
  });
  it('npm pack showcase library and copy it to test application', async function () {
    this.timeout(60000);
    await exec('npm pack');
    process.chdir(localJsApplication);
    fs.copySync(packedLibPath, path.join(localJsApplication, packedLib));
  });
  it('npm install showcase library in test application', async function () {
    this.timeout(60000);
    await exec('npm install');
  });
  it('run integration in test application', async function () {
    this.timeout(120000);
    await exec('npm test');
  });
  it('run browser test in application', async function () {
    this.timeout(120000);
    await exec('npm run browser-test');
  });
});
