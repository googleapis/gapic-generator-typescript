import {ENGINE_METHOD_DIGESTS} from 'constants';
import {NEG_ONE} from 'long';

import * as plugin from '../../../pbjs-genfiles/plugin';

interface MethodDescriptorProto extends
    plugin.google.protobuf.IMethodDescriptorProto {
  idempotence: 'idempotent'|'non_idempotent';
  longRunning?: plugin.google.longrunning.IOperationInfo;
  streaming: 'none'|'client'|'server'|'bidi';
  paging: boolean;
}

interface ServiceDescriptorProto extends
    plugin.google.protobuf.IServiceDescriptorProto {
  method: MethodDescriptorProto[];
  longRunning: MethodDescriptorProto[];
  streaming: MethodDescriptorProto[];
  paging: MethodDescriptorProto[];
}

export type ServicesMap = {
  [name: string]: ServiceDescriptorProto
};
export type MessagesMap = {
  [name: string]: plugin.google.protobuf.IDescriptorProto
};
export type EnumsMap = {
  [name: string]: plugin.google.protobuf.IEnumDescriptorProto
};

// The following functions are used to add some metadata such as idempotence
// flag, long running operation info, pagination, and streaming, to all the
// methods of the given service, to use in templates.

function idempotence(method: MethodDescriptorProto) {
  if (method.options && method.options['.google.api.http'] &&
      (method.options['.google.api.http']['get'] ||
       method.options['.google.api.http']['put'])) {
    return 'idempotent';
  }
  return 'non_idempotent';
}

function longrunning(method: MethodDescriptorProto) {
  if (method.options && method.options['.google.longrunning.operationInfo']) {
    return method.options['.google.longrunning.operationInfo']!;
  }
  return undefined;
}

function streaming(method: MethodDescriptorProto) {
  if (method.serverStreaming && method.clientStreaming) {
    return 'bidi';
  }
  if (method.clientStreaming) {
    return 'client';
  }
  if (method.serverStreaming) {
    return 'server';
  }
  return 'none';
}

function paging(messages: MessagesMap, method: MethodDescriptorProto) {
  const inputType = messages[method.inputType!];
  const outputType = messages[method.outputType!];
  const hasPageToken =
      inputType && inputType.field!.some(field => field.name === 'page_token');
  const hasPageSize =
      inputType && inputType.field!.some(field => field.name === 'page_size');
  const hasNextPageToken = outputType &&
      outputType.field!.some(field => field.name === 'next_page_token');
  return hasPageToken && hasPageSize && hasNextPageToken;
}

function augmentMethod(messages: MessagesMap, method: MethodDescriptorProto) {
  method = Object.assign(
      {
        idempotence: idempotence(method),
        longRunning: longrunning(method),
        streaming: streaming(method),
        paging: paging(messages, method)
      },
      method);
  return method;
}

function augmentService(
    messages: MessagesMap,
    service: plugin.google.protobuf.IServiceDescriptorProto) {
  const augmentedService = service as ServiceDescriptorProto;
  augmentedService.method =
      augmentedService.method.map(method => augmentMethod(messages, method));
  augmentedService.longRunning =
      augmentedService.method.filter(method => method.longRunning);
  augmentedService.streaming =
      augmentedService.method.filter(method => method.streaming !== 'none');
  augmentedService.paging =
      augmentedService.method.filter(method => method.paging);
  return augmentedService;
}

export class Proto {
  filePB2: plugin.google.protobuf.IFileDescriptorProto;
  services: ServicesMap = {};
  messages: MessagesMap = {};
  enums: EnumsMap = {};
  fileToGenerate: boolean;
  // TODO: need to store metadata? address?

  constructor(
      fd: plugin.google.protobuf.IFileDescriptorProto, packageName: string) {
    fd.enumType = fd.enumType || [];
    fd.messageType = fd.messageType || [];
    fd.service = fd.service || [];

    this.filePB2 = fd;

    this.messages = fd.messageType.filter(message => message.name)
                        .reduce((map, message) => {
                          map['.' + fd.package! + '.' + message.name!] =
                              message;
                          return map;
                        }, {} as MessagesMap);

    this.enums =
        fd.enumType.filter(enum_ => enum_.name).reduce((map, enum_) => {
          map[enum_.name!] = enum_;
          return map;
        }, {} as EnumsMap);

    this.fileToGenerate =
        fd.package ? fd.package.startsWith(packageName) : false;

    this.services = fd.service.filter(service => service.name)
                        .map(service => augmentService(this.messages, service))
                        .reduce((map, service) => {
                          map[service.name!] = service;
                          return map;
                        }, {} as ServicesMap);
  }
}

// TODO for Proto class: just load messages, services, enums, etc. as is,
// without creating wrapper classes. Extra functionality can be added by
// changing prototypes.
