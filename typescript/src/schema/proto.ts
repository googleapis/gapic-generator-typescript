import {ENGINE_METHOD_DIGESTS} from 'constants';
import {NEG_ONE} from 'long';

import * as plugin from '../../../pbjs-genfiles/plugin';

interface MethodDescriptorProto extends
    plugin.google.protobuf.IMethodDescriptorProto {
  idempotence: 'idempotent'|'non_idempotent';
  longRunning?: plugin.google.longrunning.IOperationInfo;
  streaming: 'none'|'client'|'server'|undefined;
  pagingFieldName: string|undefined;
  inputInterface: string;
  outputInterface: string;
}

interface ServiceDescriptorProto extends
    plugin.google.protobuf.IServiceDescriptorProto {
  method: MethodDescriptorProto[];
  simpleMethods: MethodDescriptorProto[];
  longRunning: MethodDescriptorProto[];
  streaming: MethodDescriptorProto[];
  paging: MethodDescriptorProto[];
  hostname: string;
  port: number;
  oauthScopes: string[];
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
    return 'BIDI_STREAMING';
  }
  if (method.clientStreaming) {
    return 'CLIENT_STREAMING';
  }
  if (method.serverStreaming) {
    return 'SERVER_STREAMING';
  }
  return undefined;
}

function pagingFieldName(messages: MessagesMap, method: MethodDescriptorProto) {
  const inputType = messages[method.inputType!];
  const outputType = messages[method.outputType!];
  const hasPageToken =
      inputType && inputType.field!.some(field => field.name === 'page_token');
  const hasPageSize =
      inputType && inputType.field!.some(field => field.name === 'page_size');
  const hasNextPageToken = outputType &&
      outputType.field!.some(field => field.name === 'next_page_token');
  if (!hasPageToken || !hasPageSize || !hasNextPageToken) {
    return undefined;
  }
  const repeatedFields = outputType.field!.filter(
      field => field.label ===
          plugin.google.protobuf.FieldDescriptorProto.Label.LABEL_REPEATED);
  if (repeatedFields.length !== 1) {
    return undefined;
  }
  return repeatedFields[0].name;
}

function toInterface(type: string) {
  return type.replace(/\.([^.]+)$/, '.I$1');
}

function augmentMethod(messages: MessagesMap, method: MethodDescriptorProto) {
  method = Object.assign(
               {
                 idempotence: idempotence(method),
                 longRunning: longrunning(method),
                 streaming: streaming(method),
                 pagingFieldName: pagingFieldName(messages, method),
                 inputInterface: toInterface(method.inputType!),
                 outputInterface: toInterface(method.outputType!)
               },
               method) as MethodDescriptorProto;
  return method;
}

function augmentService(
    messages: MessagesMap,
    service: plugin.google.protobuf.IServiceDescriptorProto) {
  const augmentedService = service as ServiceDescriptorProto;
  augmentedService.method =
      augmentedService.method.map(method => augmentMethod(messages, method));
  augmentedService.simpleMethods = augmentedService.method.filter(
      method =>
          !method.longRunning && !method.streaming && !method.pagingFieldName);
  augmentedService.longRunning =
      augmentedService.method.filter(method => method.longRunning);
  augmentedService.streaming =
      augmentedService.method.filter(method => method.streaming);
  augmentedService.paging =
      augmentedService.method.filter(method => method.pagingFieldName);

  augmentedService.hostname = '';
  augmentedService.port = 0;
  if (augmentedService.options &&
      augmentedService.options['.google.api.defaultHost']) {
    const match = augmentedService.options['.google.api.defaultHost'].match(
        /^(.*):(\d+)$/);
    if (match) {
      augmentedService.hostname = match[1];
      augmentedService.port = Number.parseInt(match[2], 10);
    }
  }
  augmentedService.oauthScopes = [];
  if (augmentedService.options &&
      augmentedService.options['.google.api.oauthScopes']) {
    augmentedService.oauthScopes =
        augmentedService.options['.google.api.oauthScopes'].split(',');
  }
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
