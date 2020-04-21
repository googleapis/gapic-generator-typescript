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

import * as plugin from '../../../pbjs-genfiles/plugin';

import {Naming, Options as namingOptions} from './naming';
import {Proto, MessagesMap} from './proto';
import {ResourceDatabase, ResourceDescriptor} from './resource-database';
import {CommentsMap} from './comments';

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

  static isIgnoredService(
    fd: plugin.google.protobuf.IFileDescriptorProto
  ): boolean {
    // Some common proto files define common services which we don't want to generate.
    // List them here.
    return (
      fd.package === 'google.longrunning' ||
      fd.package === 'google.iam.v1' ||
      fd.package === 'google.cloud'
    );
  }

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

    const [allResourceDatabase, resourceDatabase] = getResourceDatabase(
      fileDescriptors
    );

    const allMessages: MessagesMap = {};
    for (const fd of fileDescriptors) {
      fd.messageType
        ?.filter(message => message.name)
        .forEach(message => {
          allMessages['.' + fd.package! + '.' + message.name!] = message;
        });
    }
    const commentsMap = new CommentsMap(fileDescriptors);

    this.protos = fileDescriptors
      .filter(fd => fd.name)
      .filter(fd => !API.isIgnoredService(fd))
      .reduce((map, fd) => {
        map[fd.name!] = new Proto({
          fd,
          packageName,
          allMessages,
          allResourceDatabase,
          resourceDatabase,
          options,
          commentsMap,
        });
        return map;
      }, {} as ProtosMap);

    const serviceNamesList: string[] = [];
    fileDescriptors
      .filter(fd => !API.isIgnoredService(fd))
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
    if (serviceNamesList.length === 0) {
      throw new Error(
        `Can't find ${this.naming.name}'s service names, please make sure that services are defined in the proto file.`
      );
    }
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
      this.filesToGenerate
        .map(file => {
          return `../../protos/${file}`;
        })
        .sort(),
      null,
      '  '
    );
  }
}

function getResourceDatabase(
  fileDescriptors: plugin.google.protobuf.IFileDescriptorProto[]
): ResourceDatabase[] {
  const resourceDatabase = new ResourceDatabase(); // resources that defined by `google.api.resource`
  const allResourceDatabase = new ResourceDatabase(); // all resources defined by `google.api.resource` or `google.api.resource_definition`
  for (const fd of fileDescriptors.filter(fd => fd)) {
    // process file-level options
    for (const resource of fd.options?.['.google.api.resourceDefinition'] ??
      []) {
      allResourceDatabase.registerResource(
        resource as ResourceDescriptor,
        `file ${fd.name} resource_definition option`
      );
    }
    const messagesStack: plugin.google.protobuf.IDescriptorProto[] = [];
    const messages = (fd.messageType ?? []).filter(
      (message: plugin.google.protobuf.IDescriptorProto) => message.name
    );
    // put first layer of messages in the stack
    messagesStack.push(...messages);
    while (messagesStack.length !== 0) {
      const m = messagesStack.pop();
      if (!m || !m.name) continue;
      const messageName = '.' + fd.package + '.' + m.name!;
      resourceDatabase.registerResource(
        m?.options?.['.google.api.resource'] as ResourceDescriptor | undefined,
        `file ${fd.name} message ${messageName}`
      );
      allResourceDatabase.registerResource(
        m?.options?.['.google.api.resource'] as ResourceDescriptor | undefined,
        `file ${fd.name} message ${messageName}`
      );
      (m.nestedType ?? []).map(m => messagesStack.push(m));
    }
  }
  return [allResourceDatabase, resourceDatabase];
}
