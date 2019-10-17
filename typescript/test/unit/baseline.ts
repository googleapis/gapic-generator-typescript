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
import * as fs from 'fs-extra';
import * as path from 'path';
import * as rimraf from 'rimraf';
import { FORMERR } from 'dns';

const cwd = process.cwd();
const BASELINE_EXTENSION = '.baseline';

const OUTPUT_DIR = path.join(cwd, '.baseline-test-out');
const BASELINE_DIR = path.join(
  __dirname,
  '..',
  '..',
  '..',
  'typescript',
  'test',
  'testdata',
  'showcase'
);
const GOOGLE_GAX_PROTOS_DIR = path.join(
  cwd,
  'node_modules',
  'google-gax',
  'protos'
);
const PROTOS_DIR = path.join(cwd, 'build', 'test', 'protos');
const ECHO_PROTO_FILE = path.join(
  PROTOS_DIR,
  'google',
  'showcase',
  'v1beta1',
  'echo.proto'
);
const SRCDIR = path.join(cwd, 'build', 'src');
const CLI = path.join(SRCDIR, 'cli.js');
const PLUGIN = path.join(SRCDIR, 'protoc-gen-typescript_gapic');

describe('CodeGeneratorBaselineTest', () => {
  describe('Generate client library', () => {
    it('Generated library should have same client with baseline.', function() {
      this.timeout(10000);
      if (fs.existsSync(OUTPUT_DIR)) {
        rimraf.sync(OUTPUT_DIR);
      }
      fs.mkdirSync(OUTPUT_DIR);

      if (fs.existsSync(PLUGIN)) {
        rimraf.sync(PLUGIN);
      }
      fs.copyFileSync(CLI, PLUGIN);
      process.env['PATH'] = SRCDIR + path.delimiter + process.env['PATH'];

      try {
        execSync(`chmod +x ${PLUGIN}`);
      } catch (err) {
        console.warn(`Failed to chmod +x ${PLUGIN}: ${err}. Ignoring...`);
      }

      execSync(
        `protoc --typescript_gapic_out=${OUTPUT_DIR} ` +
          `-I${GOOGLE_GAX_PROTOS_DIR} ` +
          `-I${PROTOS_DIR} ` +
          ECHO_PROTO_FILE
      );
      const outputFiles = fs.readdirSync(OUTPUT_DIR);
      // store every item (file or directory with full path in output dir and baseline dir) in stack, pop once a time
      const protoItemStack: Item[] = [];
      outputFiles.forEach(file => {
        const fileFullPath = path.join(OUTPUT_DIR, file);
        const baselinePath = path.join(BASELINE_DIR, file);
        protoItemStack.push(new Item(file, fileFullPath, baselinePath));
      });
      console.warn(protoItemStack);
      while (protoItemStack.length !== 0) {
        const item = protoItemStack.pop();
        if (!item) continue;
        // if item is a file, compare it with baseline
        if (fs.lstatSync(item.outputPath).isFile()) {
          checkIdenticalFile(
            item.outputPath,
            item.baselinePath + BASELINE_EXTENSION
          );
        } else {
          // if item is a directory, loop the folder and put every item in stack again
          const items2level = fs.readdirSync(item.outputPath);
          items2level.forEach(item2level => {
            const fileFullPath2level = path.join(item.outputPath, item2level);
            const baselinePath2level = path.join(item.baselinePath, item2level);
            protoItemStack.push(
              new Item(item2level, fileFullPath2level, baselinePath2level)
            );
          });
        }
      }
    });
  });
});

function checkIdenticalFile(outputFullPath: string, baselineFullPath: string) {
  if (fs.existsSync(baselineFullPath)) {
    assert.deepStrictEqual(
      fs.readFileSync(outputFullPath).toString(),
      fs.readFileSync(baselineFullPath).toString()
    );
  } else {
    process.exit(1);
  }
}
class Item {
  fileName: string; // file name: package.json
  outputPath: string; // full path in output folder: __dirname/.../.baseline-test-out/package.json
  baselinePath: string; // full baseline path: __dirname/.../test/testdata/showcase/package.json.baseline
  constructor(file: string, output: string, baseline: string) {
    this.fileName = file;
    this.outputPath = output;
    this.baselinePath = baseline;
  }
}
