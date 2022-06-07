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

import * as child_process from 'child_process';
import * as util from 'util';
import * as path from 'path';
import * as fs from 'fs-extra';
import {Server} from './server';
const exec = util.promisify(child_process.exec);
const SHOWCASE_SERVER = path.join(__dirname, '..', '..', 'showcase-server');
const SHOWCASE_SERVER_TAR = path.join(
  SHOWCASE_SERVER,
  'gapic-showcase-server.tar.gz'
);
const TEST_FILE = path.join(__dirname, 'index.js');
const GAPIC_SHOWCASE_VERSION = '0.5.0';
const OS = process.platform;
const ARCH = process.arch == "x64" ? "amd64" : process.arch;

describe('IntegrationTest for showcase library', () => {
  describe('Run integration test for generated showcase library', async function() {
    it('download the server', async function() {
      this.timeout(120000);
      if (!fs.existsSync(SHOWCASE_SERVER)) {
        fs.mkdirSync(SHOWCASE_SERVER);
      }
      //Download server
      process.chdir(SHOWCASE_SERVER);
      try {
        const command = `curl -L https://github.com/googleapis/gapic-showcase/releases/download/v${GAPIC_SHOWCASE_VERSION}/gapic-showcase-${GAPIC_SHOWCASE_VERSION}-${OS}-${ARCH}.tar.gz > gapic-showcase-server.tar.gz`;
        await exec(command);
      } catch (err) {
        console.log('exec error:', err);
      }
    });
    //tar -xzf gapic-showcase-server.tar.gz
    it('untar the server directory', async function() {
      try {
        await exec(`tar -xzf ${SHOWCASE_SERVER_TAR}`);
      } catch (err) {
        console.log('untar command error:', err);
      }
    });
    it('run the server and test', async function() {
      this.timeout(120000);
      const server = new Server();
      server.run();
      // Run test
      try {
        await exec(`mocha ${TEST_FILE}`);
      } catch (err) {
        console.log('Failed to run tests', err);
      }
      // Kill server process
      server.kill();
    });
  });
});
