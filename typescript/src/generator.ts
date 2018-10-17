// Copyright 2018 Google LLC
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

'use strict';

import * as getStdin from 'get-stdin';
import * as path from 'path';
import * as plugin from '../../pbjs-genfiles/plugin';
import {API} from './schema/api';
import {commonPrefix} from './util';
import {processTemplates} from './templater';

const templateDirectory = 'templates/typescript_gapic';
// If needed, we can make it possible to load templates from different locations
// to generate code for other languages.

export class Generator {
  request: plugin.google.protobuf.compiler.CodeGeneratorRequest;
  response: plugin.google.protobuf.compiler.CodeGeneratorResponse;

  constructor() {
    this.request =
        plugin.google.protobuf.compiler.CodeGeneratorRequest.create();
    this.response =
        plugin.google.protobuf.compiler.CodeGeneratorResponse.create();
  }

  async initializeFromStdin() {
    const inputBuffer = await getStdin.buffer();
    this.request = plugin.google.protobuf.compiler.CodeGeneratorRequest.decode(
        inputBuffer);
  }

  addProtosToResponse() {
    const protoFilenames: string[] = [];
    for (const proto of this.request.protoFile) {
      if (proto.name) {
        protoFilenames.push(proto.name);
      }
    }
    const protoList =
        plugin.google.protobuf.compiler.CodeGeneratorResponse.File.create();
    protoList.name = 'proto.list';
    protoList.content = protoFilenames.join('\n') + '\n';
    this.response.file.push(protoList);
  }

  buildAPIObject(): API {
    const protoFilesToGenerate = this.request.protoFile.filter(
        pf => pf.name && this.request.fileToGenerate.includes(pf.name));
    const packageNamesToGenerate =
        protoFilesToGenerate.map(pf => pf.package || '');
    const packageName = commonPrefix(packageNamesToGenerate).replace(/\.$/, '');
    if (packageName === '') {
      throw new Error('Cannot get package name to generate.');
    }
    const api = new API(this.request.protoFile, packageName);
    return api;
  }

  async processTemplates(api: API) {
    const fileList = await processTemplates(templateDirectory, api);
    this.response.file.push(...fileList);
  }

  async generate() {
    const fileToGenerate = this.request.fileToGenerate;

    this.response =
        plugin.google.protobuf.compiler.CodeGeneratorResponse.create();

    this.addProtosToResponse();
    const api = this.buildAPIObject();
    await this.processTemplates(api);
    // TODO: error handling

    const outputBuffer = plugin.google.protobuf.compiler.CodeGeneratorResponse
                             .encode(this.response)
                             .finish();
    // @ts-ignore Argument of type 'Uint8Array' is not assignable to parameter
    // of type 'string'.
    process.stdout.write(outputBuffer);
  }
}
