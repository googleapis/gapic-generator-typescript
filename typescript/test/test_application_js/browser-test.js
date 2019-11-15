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

const execSync = require('child_process').execSync;
const fs = require('fs-extra');
const path = require('path');
const SHOWCASE_SERVER = path.join(__dirname, 'showcase-server');

describe('BrowserTest for showcase library', () => {
  describe('Run browser test for generated showcase library', () => {
    if (!fs.existsSync(SHOWCASE_SERVER)) {
      console.warn(
        'gapic showcase server does not exist, please download it first.'
      );
    }
    // Run server
    try {
      execSync(`showcase-server/gapic-showcase run & \
      showcase_pid=$! `);
    } catch (err) {
      console.warn(`Failed to run showcase server`);
    }
    // Run browser test
    try {
      execSync(`karma start`);
    } catch (err) {
      console.warn(`Failed to start browser test`);
    }
    // Kill server process
    try {
        execSync(`kill $showcase_pid`);
      } catch (err) {
        console.warn(`Failed to kill showcase server`);
      } 
  });
});
