#!/usr/bin/env node

// Copyright 2020 Google LLC
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

// Updates baselines. Useful if many templates were changed and the changes
// needs to be propagated to all baselines.
// Usage: node build/tools/update-baselines.js

import {exec} from 'child_process';
import * as util from 'util';
import * as fs from 'fs';
import * as path from 'path';
import * as rimraf from 'rimraf';
import {promisify} from 'util';
import {readdir, mkdir, existsSync} from 'fs';
import * as ncp from 'ncp';

const rmrf = promisify(rimraf);
const readdirp = promisify(readdir);
const fsstat = util.promisify(fs.stat);
const fssymlink = util.promisify(fs.symlink);
const mkdirp = promisify(mkdir);
const execp = promisify(exec);
const ncpp = promisify(ncp);

const root = path.resolve(__dirname, '..', '..');
const resultPrefix = /^\.test-out-(.*)$/;

function getBaselineDirectory(library: string): string {
  return path.join(root, 'baselines', library);
}

function getBaselineFilename(library: string, filename: string): string {
  return path.join(getBaselineDirectory(library), `${filename}.baseline`);
}

async function copyBaseline(library: string, root: string, directory = '.') {
  const cwd = process.cwd();
  const start = path.join(root, directory);
  const targetDirectory = path.join(getBaselineDirectory(library), directory);
  if (!existsSync(targetDirectory)) {
    await mkdirp(targetDirectory);
  }
  const files = await readdirp(start);
  for (const file of files) {
    const relativePath = `${directory}${path.sep}${file}`;
    const absolutePath = path.join(start, file);
    const stat = await fsstat(absolutePath);
    if (stat.isDirectory()) {
      await copyBaseline(library, root, relativePath);
    } else if (stat.isFile()) {
      const baseline = getBaselineFilename(library, relativePath);
      // In baselines/, update `package.json` instead of `package.json.baseline`
      // (package.json.baseline is a symlink to package.json to make renovate bot happy)
      if (relativePath.endsWith(`${path.sep}package.json`)) {
        const packageJson = baseline.substring(0, baseline.lastIndexOf('.'));
        await ncpp(absolutePath, packageJson);
        const dirname = path.dirname(packageJson);
        process.chdir(dirname);
        await fssymlink('package.json', 'package.json.baseline');
        process.chdir(cwd);
      } else {
        await ncpp(absolutePath, baseline);
      }
      console.log(`    - ${relativePath}`);
    }
  }
}

async function main() {
  // generate test output
  try {
    console.log('Running npm test...');
    await execp('npm test');
    console.log('Tests passed! No need to update baselines.');
    return;
  } catch (err) {
    console.log("Tests failed - that's OK, will update baselines.");
  }

  // get a list of baselines
  const files = await readdirp(root);
  const outDirs = files.filter(file => file.match(resultPrefix));

  // update baselines for all libraries
  for (const dir of outDirs) {
    const match = dir.match(resultPrefix);
    if (!match) {
      throw new Error(`Cannot extract library name from ${dir}`);
    }
    const library = match[1];
    const baselineDir = getBaselineDirectory(library);

    console.log(`Updating baseline for ${library}...`);
    console.log(`  - rm -rf "${baselineDir}"...`);
    await rmrf(baselineDir);
    console.log(`  - copying files from ${dir}...`);
    await copyBaseline(library, path.join(root, dir));
    console.log('done!');
  }
}

main().catch(console.error);
