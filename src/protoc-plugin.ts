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

// Making bazel build and bazel run work:
// To allow importing protos as "gapic_generator_typescript/protos"
// without using `../../`, we define a path alias in `tsconfig.json`:
//    "paths": {
//      "gapic_generator_typescript/*": ["*"]
//    }
// Then we use this module-alias module that alters behavior of
// `require` by adding an alias to gapic_generator_typescript.
// TODO(@alexander-fenster): get rid of module-alias.
import * as moduleAlias from 'module-alias';
import * as path from 'path';
moduleAlias.addAlias('gapic_generator_typescript', path.join(__dirname, '..'));
import * as yargs from 'yargs';
import {Generator} from './generator';

async function main() {
  const argv = yargs.argv;

  if (argv.descriptor) {
    throw new Error('Descriptor option is not yet supported.');
  }

  const generator = new Generator();
  await generator.initializeFromStdin();
  await generator.generate();
}

main();
