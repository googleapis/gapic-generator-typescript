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

const child_process = require('child_process');
const util = require('util');
const {describe, it} = require('mocha');
const serverProcess = require('./server');
const exec = util.promisify(child_process.exec);

describe('BrowserTest for showcase library', () => {
  describe('Run browser test for generated showcase library', async function() {
    it('Browser test, should pass', async function() {
      this.timeout(120000);
      serverProcess.run();
      // Run browser test
      try {
        await exec('karma start');
      } catch (err) {
        console.log('execSync error:', err);
        console.log('stdout:', err.stdout.toString());
        console.log('stderr:', err.stderr.toString());
      }
      // Kill server process
      serverProcess.kill();
    });
  });
});
