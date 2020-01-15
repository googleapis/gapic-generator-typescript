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
const fs = require('fs-extra');
const { spawn } = require('child_process');
const kill = require('tree-kill');
const path = require('path');
const SHOWCASE_SERVER = path.join(
  __dirname,
  'showcase-server',
  'gapic-showcase'
);

module.exports = {
  run: function() {
    if (!fs.existsSync(SHOWCASE_SERVER)) {
      console.warn(
        'gapic showcase server does not exist, please download it first.'
      );
    }
    this.childProcess = spawn(`${SHOWCASE_SERVER}`, ['run']);
    this.childProcess.on('error', err => {
      console.error('Failed to start subprocess.');
    });
  },
  kill: function() {
    kill(this.childProcess.pid);
  },
};
