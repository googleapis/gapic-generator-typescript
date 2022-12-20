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
import * as fs from 'fs-extra';
import * as child_process from 'child_process';
import * as path from 'path';
const SHOWCASE_SERVER = path.join(
  __dirname,
  '..',
  '..',
  'showcase-server',
  'gapic-showcase'
);

export class Server {
  pid: number | undefined = -1;
  constrcutor() {}
  run() {
    if (!fs.existsSync(SHOWCASE_SERVER)) {
      console.warn(
        'gapic showcase server does not exist, please download it first.'
      );
    }
    this.pid = child_process.spawn(`${SHOWCASE_SERVER}`, ['run']).pid;
  }
  kill() {
    if (this.pid) {
      process.kill(this.pid);
    } else {
      process.kill(-1);
    }
  }
}
