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

import * as getStdin from 'get-stdin';
import * as path from 'path';
import * as fs from 'fs';
import * as util from 'util';

import * as plugin from '../../pbjs-genfiles/plugin';

import { API } from './schema/api';
import { processTemplates } from './templater';
import { commonPrefix, duration } from './util';

const readFile = util.promisify(fs.readFile);

const templateDirectory = path.join(
  __dirname,
  '..',
  '..',
  'templates',
  'typescript_gapic'
);
// If needed, we can make it possible to load templates from different locations
// to generate code for other languages.

export class Generator {
  request: plugin.google.protobuf.compiler.CodeGeneratorRequest;
  response: plugin.google.protobuf.compiler.CodeGeneratorResponse;
  grpcServiceConfig: plugin.grpc.service_config.ServiceConfig;

  constructor() {
    this.request = plugin.google.protobuf.compiler.CodeGeneratorRequest.create();
    this.response = plugin.google.protobuf.compiler.CodeGeneratorResponse.create();
    this.grpcServiceConfig = plugin.grpc.service_config.ServiceConfig.create();
  }

  // Fixes gRPC service config to replace string google.protobuf.Duration
  // to a proper Duration message, since protobufjs does not support
  // string Durations such as "30s".
  private static updateDuration(obj: { [key: string]: {} }) {
    const fieldNames = [
      'timeout',
      'initialBackoff',
      'maxBackoff',
      'hedgingDelay',
    ];
    for (const key of Object.keys(obj)) {
      if (fieldNames.includes(key) && typeof obj[key] === 'string') {
        obj[key] = duration((obj[key] as unknown) as string);
      } else if (typeof obj[key] === 'object') {
        this.updateDuration(obj[key]);
      }
    }
  }

  private async readGrpcServiceConfig(parameter: string) {
    const match = parameter.match(/^["']?grpc-service-config=([^"]+)["']?$/);
    if (!match) {
      throw new Error(`Parameter ${parameter} was not recognized.`);
    }
    const filename = match[1];
    if (!fs.existsSync(filename)) {
      throw new Error(`File ${filename} cannot be opened.`);
    }

    const content = await readFile(filename);
    const json = JSON.parse(content.toString());
    Generator.updateDuration(json);
    this.grpcServiceConfig = plugin.grpc.service_config.ServiceConfig.fromObject(
      json
    );
  }

  async initializeFromStdin() {
    const inputBuffer = await getStdin.buffer();
    this.request = plugin.google.protobuf.compiler.CodeGeneratorRequest.decode(
      inputBuffer
    );
    if (this.request.parameter) {
      await this.readGrpcServiceConfig(this.request.parameter);
    }
  }

  private addProtosToResponse() {
    const protoFilenames: string[] = [];
    for (const proto of this.request.protoFile) {
      if (proto.name) {
        protoFilenames.push(proto.name);
      }
    }
    const protoList = plugin.google.protobuf.compiler.CodeGeneratorResponse.File.create();
    protoList.name = 'proto.list';
    protoList.content = protoFilenames.join('\n') + '\n';
    this.response.file.push(protoList);
  }

  private buildAPIObject(): API {
    const protoFilesToGenerate = this.request.protoFile.filter(
      pf =>
        pf.name &&
        this.request.fileToGenerate.includes(pf.name) &&
        // ignoring some common package names
        pf.package !== 'google.longrunning' &&
        pf.package !== 'google.cloud'
    );
    const packageNamesToGenerate = protoFilesToGenerate.map(
      pf => pf.package || ''
    );
    const packageName = commonPrefix(packageNamesToGenerate).replace(/\.$/, '');
    if (packageName === '') {
      throw new Error('Cannot get package name to generate.');
    }
    const api = new API(
      this.request.protoFile,
      packageName,
      this.grpcServiceConfig
    );
    return api;
  }

  async processTemplates(api: API) {
    const fileList = await processTemplates(templateDirectory, api);
    this.response.file.push(...fileList);
  }

  async generate() {
    const fileToGenerate = this.request.fileToGenerate;

    this.response = plugin.google.protobuf.compiler.CodeGeneratorResponse.create();

    this.addProtosToResponse();
    const api = this.buildAPIObject();
    await this.processTemplates(api);

    const outputBuffer = plugin.google.protobuf.compiler.CodeGeneratorResponse.encode(
      this.response
    ).finish();
    process.stdout.write(outputBuffer);
  }
}
