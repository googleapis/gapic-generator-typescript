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

import * as plugin from '../../../pbjs-genfiles/plugin';
import * as fs from 'fs';
import * as path from 'path';

import { Naming, Options as namingOptions } from './naming';
import { Proto, MessagesMap } from './proto';
import { ResourceDatabase, ResourceDescriptor } from './resourceDatabase';
import { Options } from 'yargs-parser';

const googleGaxLocation = path.dirname(require.resolve('google-gax'));
const gaxProtosLocation = path.join(googleGaxLocation, '..', '..', 'protos');

export interface ProtosMap {
  [filename: string]: Proto;
}

export class API {
  naming: Naming;
  protos: ProtosMap;
  hostName?: string;
  port?: string;
  // This field is for users passing proper publish package name like @google-cloud/text-to-speech.
  publishName: string;
  // For historical reasons, Webpack library name matches "the main" service of the client library.
  // Sometimes it's hard to figure out automatically, so making this an option.
  mainServiceName: string;

  constructor(
    fileDescriptors: plugin.google.protobuf.IFileDescriptorProto[],
    packageName: string,
    options: namingOptions
  ) {
    this.naming = new Naming(
      fileDescriptors.filter(
        fd => fd.package && fd.package.startsWith(packageName)
      ),
      options
    );
    // users specify the actual package name, if not, set it to product name.
    this.publishName =
      options.publishName || this.naming.productName.toKebabCase();
    // construct resource map
    const resourceMap = getResourceDatabase(fileDescriptors);
    // parse resource map to Proto constructor
    this.protos = fileDescriptors
      .filter(fd => fd.name)
      .filter(fd => !fs.existsSync(path.join(gaxProtosLocation, fd.name!)))
      .reduce((map, fd) => {
        map[fd.name!] = new Proto(
          fd,
          packageName,
          options.grpcServiceConfig,
          resourceMap
        );
        return map;
      }, {} as ProtosMap);

    const serviceNamesList: string[] = [];
    fileDescriptors
      .filter(fd => fd.service)
      .reduce((servicesList, fd) => {
        servicesList.push(...fd.service!);
        return servicesList;
      }, [] as plugin.google.protobuf.IServiceDescriptorProto[])
      .filter(service => service?.options?.['.google.api.defaultHost'])
      .sort((service1, service2) =>
        service1.name!.localeCompare(service2.name!)
      )
      .forEach(service => {
        const defaultHost = service!.options!['.google.api.defaultHost']!;
        const [hostname, port] = defaultHost.split(':');
        if (hostname && this.hostName && hostname !== this.hostName) {
          console.warn(
            `Warning: different hostnames ${hostname} and ${this.hostName} within the same client are not supported.`
          );
        }
        this.hostName = hostname || this.hostName || 'localhost';
        this.port = port ?? this.port ?? '443';
        serviceNamesList.push(service.name || this.naming.name);
      });
    this.mainServiceName = options.mainServiceName || serviceNamesList[0];
  }

  get services() {
    return Object.keys(this.protos)
      .map(filename => this.protos[filename])
      .filter(proto => proto.fileToGenerate)
      .reduce((retval, proto) => {
        retval.push(
          ...Object.keys(proto.services).map(name => proto.services[name])
        );
        return retval;
      }, [] as plugin.google.protobuf.IServiceDescriptorProto[])
      .sort((service1, service2) =>
        service1.name!.localeCompare(service2.name!)
      );
  }

  get filesToGenerate() {
    return Object.keys(this.protos).filter(
      proto => this.protos[proto].fileToGenerate
    );
  }

  get protoFilesToGenerateJSON() {
    return JSON.stringify(
      this.filesToGenerate.map(file => {
        return `../../protos/${file}`;
      }),
      null,
      '  '
    );
  }
}

function getResourceDatabase(
  fileDescriptors: plugin.google.protobuf.IFileDescriptorProto[]
): ResourceDatabase {
  const resourceDatabase = new ResourceDatabase();
  for (const fd of fileDescriptors.filter(fd => fd)) {
    // process file-level options
    for (const resource of fd.options?.['.google.api.resourceDefinition'] ??
      []) {
      resourceDatabase.registerResource(
        resource as ResourceDescriptor,
        `file ${fd.name} resource_definition option`
      );
    }

    const messages = (fd.messageType ?? [])
      .filter(message => message.name)
      .reduce((map, message) => {
        map['.' + fd.package! + '.' + message.name!] = message;
        return map;
      }, {} as MessagesMap);

    for (const property of Object.keys(messages)) {
      const m = messages[property];
      resourceDatabase.registerResource(
        m?.options?.['.google.api.resource'] as ResourceDescriptor | undefined,
        `file ${fd.name} message ${property}`
      );
    }
  }
  return resourceDatabase;
}
