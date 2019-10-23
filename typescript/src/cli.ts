#!/usr/bin/env node

// Copyright 2019 Google LLC
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

import * as yargs from 'yargs';
import * as fs from 'fs';
import * as util from 'util';
import { Generator } from './generator';

const readFile = util.promisify(fs.readFile);

async function main() {
  const argv = yargs.argv;
  console.warn(argv);
  console.warn(process.argv);

  if (argv.descriptor) {
    console.error('Descriptor option is not yet supported.');
    process.exit(1);
  }

  const grpcServiceConfig = argv.grpcServiceConfig as string | undefined;

  const generator = new Generator();
  await generator.initializeFromStdin();
  if (grpcServiceConfig) {
    const contents = await readFile(grpcServiceConfig);
    const json = JSON.parse(contents.toString());
    generator.setGrpcServiceConfig(json);
  }
  await generator.generate();
}

main().catch(err => {
  console.error(err);
});
