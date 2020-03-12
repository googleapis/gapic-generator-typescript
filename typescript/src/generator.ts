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

import * as getStdin from 'get-stdin';
import * as path from 'path';
import * as fs from 'fs';
import * as util from 'util';

import * as plugin from '../../pbjs-genfiles/plugin';

import { API } from './schema/api';
import { processTemplates } from './templater';
import { commonPrefix, duration } from './util';

export interface OptionsMap {
  [name: string]: string;
}
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
  paramMap: OptionsMap;
  // This field is for users passing proper publish package name like @google-cloud/text-to-speech.
  publishName?: string;
  // For historical reasons, Webpack library name matches "the main" service of the client library.
  // Sometimes it's hard to figure out automatically, so making this an option.
  mainServiceName?: string;

  constructor() {
    this.request = plugin.google.protobuf.compiler.CodeGeneratorRequest.create();
    this.response = plugin.google.protobuf.compiler.CodeGeneratorResponse.create();
    this.grpcServiceConfig = plugin.grpc.service_config.ServiceConfig.create();
    this.paramMap = {};
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

  private getParamMap(parameter: string) {
    // Example: "grpc-service-config=texamplejson","package-name=packageName"
    const parameters = parameter.split(',');
    for (let param of parameters) {
      // remove double quote
      param = param.substring(1, param.length - 1);
      const arr = param.split('=');
      this.paramMap[arr[0].toKebabCase()] = arr[1];
    }
  }

  private async readGrpcServiceConfig(map: OptionsMap) {
    if (map?.['grpc-service-config']) {
      const filename = map['grpc-service-config'];
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
  }

  private readPublishPackageName(map: OptionsMap) {
    this.publishName = map['package-name'];
  }

  private readMainServiceName(map: OptionsMap) {
    this.mainServiceName = map['main-service'];
  }

  async initializeFromStdin() {
    const inputBuffer = await getStdin.buffer();
    this.request = plugin.google.protobuf.compiler.CodeGeneratorRequest.decode(
      inputBuffer
    );
    if (this.request.parameter) {
      this.getParamMap(this.request.parameter);
      await this.readGrpcServiceConfig(this.paramMap);
      this.readPublishPackageName(this.paramMap);
      this.readMainServiceName(this.paramMap);
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
        !API.isIgnoredService(pf)
    );
    const packageNamesToGenerate = protoFilesToGenerate.map(
      pf => pf.package || ''
    );
    const packageName = commonPrefix(packageNamesToGenerate).replace(/\.$/, '');
    if (packageName === '') {
      throw new Error('Cannot get package name to generate.');
    }
    const api = new API(this.request.protoFile, packageName, {
      grpcServiceConfig: this.grpcServiceConfig,
      publishName: this.publishName,
      mainServiceName: this.mainServiceName,
    });
    return api;
  }

  async processTemplates(api: API) {
    const fileList = await processTemplates(templateDirectory, api);
    this.response.file.push(...fileList);
  }

  async generate() {
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
