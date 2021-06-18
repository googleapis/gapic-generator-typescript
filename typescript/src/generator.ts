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

import * as path from 'path';
import * as fs from 'fs';
import * as util from 'util';
import * as yaml from 'js-yaml';
import * as protos from '../../protos';

import {API} from './schema/api';
import {processTemplates} from './templater';
import {BundleConfigClient, BundleConfig} from './bundle';
import {commonPrefix, duration} from './util';
import * as Long from 'long';

function getStdin() {
  return new Promise<Buffer>(resolve => {
    const buffers: Buffer[] = [];
    process.stdin.on('readable', () => {
      let chunk: Buffer;
      while (null !== (chunk = process.stdin.read())) {
        buffers.push(chunk);
      }
    });
    process.stdin.on('end', () => {
      resolve(Buffer.concat(buffers));
    });
  });
}

export interface OptionsMap {
  [name: string]: string;
}
const readFile = util.promisify(fs.readFile);

// support both run from Bazel and without it
const templatesDirectory = fs.existsSync(
  '../../gapic_generator_typescript/templates'
)
  ? '../../gapic_generator_typescript/templates'
  : path.join(__dirname, '..', '..', 'templates');
const defaultTemplates = ['typescript_gapic', 'typescript_packing_test'];
const metadataTemplate = 'typescript_gapic_metadata';

export class Generator {
  request: protos.google.protobuf.compiler.CodeGeneratorRequest;
  response: protos.google.protobuf.compiler.CodeGeneratorResponse;
  grpcServiceConfig: protos.grpc.service_config.ServiceConfig;
  bundleConfigs: BundleConfig[] = [];
  paramMap: OptionsMap;
  // This field is for users passing proper publish package name like @google-cloud/text-to-speech.
  publishName?: string;
  // For historical reasons, Webpack library name matches "the main" service of the client library.
  // Sometimes it's hard to figure out automatically, so making this an option.
  mainServiceName?: string;
  iamService?: boolean;
  templates: string[];
  metadata?: boolean;
  rest?: boolean;

  constructor() {
    this.request = protos.google.protobuf.compiler.CodeGeneratorRequest.create();
    this.response = protos.google.protobuf.compiler.CodeGeneratorResponse.create();
    this.grpcServiceConfig = protos.grpc.service_config.ServiceConfig.create();
    this.paramMap = {};
    this.templates = defaultTemplates;
  }

  // Fixes gRPC service config to replace string google.protobuf.Duration
  // to a proper Duration message, since protobufjs does not support
  // string Durations such as "30s".
  private static updateDuration(obj: {[key: string]: {}}) {
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
    // Example: "grpc-service-config=path/to/grpc-service-config.json","package-name=packageName"
    const parameters = parameter.split(',');
    for (let param of parameters) {
      // remove double quote
      if (param[0] === '"' && param[param.length - 1] === '"') {
        param = param.substring(1, param.length - 1);
      }
      const arr = param.split('=');
      if (arr.length === 1) {
        arr.push('true'); // "param" with no value gets converted to "param=true"
      }
      this.paramMap[arr[0].toKebabCase()] = arr[1];
    }
  }

  private async readGrpcServiceConfig() {
    if (this.paramMap?.['grpc-service-config']) {
      const filename = this.paramMap['grpc-service-config'];
      if (!fs.existsSync(filename)) {
        throw new Error(`File ${filename} cannot be opened.`);
      }
      const content = await readFile(filename);
      const json = JSON.parse(content.toString());
      Generator.updateDuration(json);
      this.grpcServiceConfig = protos.grpc.service_config.ServiceConfig.fromObject(
        json
      );
    }
  }

  private readBundleConfig() {
    if (this.paramMap?.['bundle-config']) {
      const filename = this.paramMap['bundle-config'];
      if (!fs.existsSync(filename)) {
        throw new Error(`File ${filename} cannot be opened.`);
      }
      const content = fs.readFileSync(filename, 'utf8');
      const info = yaml.load(content);
      this.bundleConfigs = new BundleConfigClient().fromObject(info);
    }
  }

  private readIamService() {
    // if `--iam-service` is not specified, or set it as `false`, we will not generated IAM methods for the client.
    // if `--iam-service` is true, we will include all IAM methods in the client.
    if (this.paramMap?.['iam-service']) {
      const iamService = this.paramMap['iam-service'];
      this.iamService = iamService === 'true' ? true : false;
    }
  }

  private readPublishPackageName() {
    this.publishName = this.paramMap['package-name'];
  }

  private readMainServiceName() {
    this.mainServiceName = this.paramMap['main-service'];
  }

  private readTemplates() {
    if (this.paramMap['template']) {
      this.templates = this.paramMap['template'].split(';');
    }

    if (this.paramMap['metadata'] === 'true') {
      this.templates.push(metadataTemplate);
    }
  }

  private readRest() {
    if (this.paramMap['transport'] === 'rest') {
      this.rest = true;
    }
  }

  async initializeFromStdin() {
    const inputBuffer = await getStdin();
    this.request = protos.google.protobuf.compiler.CodeGeneratorRequest.decode(
      inputBuffer
    );
    if (this.request.parameter) {
      this.getParamMap(this.request.parameter);
      await this.readGrpcServiceConfig();
      this.readBundleConfig();
      this.readIamService();
      this.readPublishPackageName();
      this.readMainServiceName();
      this.readTemplates();
      this.readRest();
    }
  }

  private addProtosToResponse() {
    const protoFilenames: string[] = [];
    for (const proto of this.request.protoFile) {
      if (proto.name) {
        protoFilenames.push(proto.name);
      }
    }
    const protoList = protos.google.protobuf.compiler.CodeGeneratorResponse.File.create();
    protoList.name = 'proto.list';
    protoList.content = protoFilenames.join('\n') + '\n';
    this.response.file.push(protoList);
  }

  private buildAPIObject(): API {
    const protoPackagesToGenerate = new Set<string>();
    API.filterOutIgnoredServices(
      this.request.protoFile.filter(
        fd =>
          this.request.fileToGenerate.includes(fd.name!) &&
          fd.service &&
          fd.service.length > 0
      )
    ).forEach(fd => protoPackagesToGenerate.add(fd.package || ''));
    const packageNamesToGenerate = Array.from(protoPackagesToGenerate);
    const packageName = commonPrefix(packageNamesToGenerate).replace(/\.$/, '');
    if (packageName === '') {
      throw new Error('Cannot get package name to generate.');
    }
    const api = new API(this.request.protoFile, packageName, {
      grpcServiceConfig: this.grpcServiceConfig,
      bundleConfigs: this.bundleConfigs,
      publishName: this.publishName,
      mainServiceName: this.mainServiceName,
      iamService: this.iamService,
      rest: this.rest,
    });
    return api;
  }

  async processTemplates(api: API) {
    for (const template of this.templates) {
      const location = path.join(templatesDirectory, template);
      if (!fs.existsSync(location)) {
        throw new Error(`Template directory ${location} does not exist.`);
      }
      const fileList = await processTemplates(location, api);
      this.response.file.push(...fileList);
    }
  }

  async generate() {
    this.response = protos.google.protobuf.compiler.CodeGeneratorResponse.create();
    this.response.supportedFeatures = new Long(
      protos.google.protobuf.compiler.CodeGeneratorResponse.Feature.FEATURE_PROTO3_OPTIONAL
    );

    try {
      this.addProtosToResponse();
      const api = this.buildAPIObject();
      await this.processTemplates(api);
    } catch (err) {
      this.response.error = err instanceof Error ? err.message : err.toString();
    }

    const outputBuffer = protos.google.protobuf.compiler.CodeGeneratorResponse.encode(
      this.response
    ).finish();
    process.stdout.write(outputBuffer);
  }
}
