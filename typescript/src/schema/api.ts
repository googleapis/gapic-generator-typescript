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

import * as protos from '../../../protos';

import {Naming, Options as namingOptions} from './naming';
import {Proto, MessagesMap, ServiceDescriptorProto} from './proto';
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
  uniqKeywords: string[];
  packageName: string;
  rest?: boolean;
  diregapic?: boolean;
  handwrittenLayer?: boolean;
  legacyProtoLoad: boolean;

  static isIgnoredService(
    fd: protos.google.protobuf.IFileDescriptorProto
  ): boolean {
    // Some common proto files define common services which we don't want to generate.
    // List them here.
    return (
      fd.package === 'google.longrunning' ||
      fd.package === 'google.cloud' ||
      fd.package === 'google.cloud.location' ||
      fd.package === 'google.protobuf' ||
      fd.package === 'google.type' ||
      fd.package === 'google.rpc' ||
      fd.package === 'google.rpc.context' ||
      fd.package === 'google.api'
    );
  }

  static filterOutIgnoredServices(
    fds: protos.google.protobuf.IFileDescriptorProto[]
  ) {
    let filteredProtos = fds.filter(fd => !API.isIgnoredService(fd));
    // Special case: google.iam.v1 can be either a separate service to generate,
    // or a dependency that should be ignored here
    const packages = filteredProtos.reduce((set, fd) => {
      set.add(fd.package!);
      return set;
    }, new Set<string>());
    if (packages.size > 1 && packages.has('google.iam.v1')) {
      filteredProtos = filteredProtos.filter(
        p => p.package !== 'google.iam.v1'
      );
    }
    return filteredProtos;
  }

  constructor(
    fileDescriptors: protos.google.protobuf.IFileDescriptorProto[],
    packageName: string,
    options: namingOptions
  ) {
    this.packageName = packageName;
    this.naming = new Naming(
      fileDescriptors.filter(
        fd => fd.package && fd.package.startsWith(packageName)
      ),
      options
    );
    // users specify the actual package name, if not, set it to product name.
    this.publishName =
      options.publishName || this.naming.productName.toKebabCase();
    this.handwrittenLayer = options.handwrittenLayer ?? false;
    this.rest = options.rest;
    this.diregapic = options.diregapic ?? false;
    this.legacyProtoLoad = options.legacyProtoLoad ?? false;

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

    const filteredProtos = API.filterOutIgnoredServices(
      fileDescriptors.filter(fd => fd.name)
    );
    this.protos = filteredProtos.reduce((map, fd) => {
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
    filteredProtos
      .filter(fd => fd.service)
      .reduce((servicesList, fd) => {
        servicesList.push(...fd.service!);
        return servicesList;
      }, [] as protos.google.protobuf.IServiceDescriptorProto[])
      .filter(service => {
        if (!service.options || !service.options['.google.api.defaultHost']) {
          throw new Error(
            `service "${packageName}.${service.name}" is missing option google.api.default_host`
          );
        }
        const defaultHost = service!.options!['.google.api.defaultHost']!;
        if (defaultHost.length === 0) {
          console.warn(
            `service ${packageName}.${service.name} google.api.default_host is empty`
          );
        }
        return service?.options?.['.google.api.defaultHost'];
      })
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
    // For generating keywords in package.json
    this.uniqKeywords = [
      ...new Set(serviceNamesList.map(name => name.words().join(' '))),
    ];
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
      }, [] as ServiceDescriptorProto[])
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

  get dump() {
    return JSON.stringify({
      packageName: this.packageName,
      publishName: this.publishName,
      naming: this.naming,
      hostname: this.hostName,
      port: this.port,
      services: this.services,
      rest: this.rest,
      diregapic: this.diregapic,
      handwrittenLayer: this.handwrittenLayer,
      legacyProtoLoad: this.legacyProtoLoad,
    });
  }
}

function getResourceDatabase(
  fileDescriptors: protos.google.protobuf.IFileDescriptorProto[]
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
    const messagesStack: protos.google.protobuf.IDescriptorProto[] = [];
    const messages = (fd.messageType ?? []).filter(
      (message: protos.google.protobuf.IDescriptorProto) => message.name
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
      (m.nestedType ?? []).forEach(m => messagesStack.push(m));
    }
  }
  return [allResourceDatabase, resourceDatabase];
}
