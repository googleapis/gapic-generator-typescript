import { ENGINE_METHOD_DIGESTS } from 'constants';
import { NEG_ONE } from 'long';

import * as plugin from '../../../pbjs-genfiles/plugin';

interface MethodDescriptorProto
  extends plugin.google.protobuf.IMethodDescriptorProto {
  idempotence: 'idempotent' | 'non_idempotent';
  longRunning?: plugin.google.longrunning.IOperationInfo;
  longRunningResponseType?: string;
  longRunningMetadataType?: string;
  streaming:
    | 'CLIENT_STREAMING'
    | 'SERVER_STREAMING'
    | 'BIDI_STREAMING'
    | undefined;
  pagingFieldName: string | undefined;
  pagingResponseType?: string;
  inputInterface: string;
  outputInterface: string;
  comments: string;
}

interface ServiceDescriptorProto
  extends plugin.google.protobuf.IServiceDescriptorProto {
  method: MethodDescriptorProto[];
  simpleMethods: MethodDescriptorProto[];
  longRunning: MethodDescriptorProto[];
  streaming: MethodDescriptorProto[];
  clientStreaming: MethodDescriptorProto[];
  serverStreaming: MethodDescriptorProto[];
  bidiStreaming: MethodDescriptorProto[];
  paging: MethodDescriptorProto[];
  hostname: string;
  port: number;
  oauthScopes: string[];
  comments: string;
}

export interface ServicesMap {
  [name: string]: ServiceDescriptorProto;
}
export interface MessagesMap {
  [name: string]: plugin.google.protobuf.IDescriptorProto;
}
export interface EnumsMap {
  [name: string]: plugin.google.protobuf.IEnumDescriptorProto;
}
export interface CommentsMap {
  [name: string]: string;
}

// The following functions are used to add some metadata such as idempotence
// flag, long running operation info, pagination, and streaming, to all the
// methods of the given service, to use in templates.

function idempotence(method: MethodDescriptorProto) {
  if (
    method.options &&
    method.options['.google.api.http'] &&
    (method.options['.google.api.http']['get'] ||
      method.options['.google.api.http']['put'])
  ) {
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

function longRunningResponseType(method: MethodDescriptorProto) {
  if (method.options && method.options['.google.longrunning.operationInfo']) {
    if (method.options['.google.longrunning.operationInfo'].responseType) {
      return toLRInterface(
        method.options['.google.longrunning.operationInfo'].responseType,
        method.inputType!.toString()
      );
    }
  }
  return undefined;
}

function longRunningMetadataType(method: MethodDescriptorProto) {
  if (method.options && method.options['.google.longrunning.operationInfo']) {
    if (method.options['.google.longrunning.operationInfo'].metadataType) {
      return toLRInterface(
        method.options['.google.longrunning.operationInfo'].metadataType,
        method.inputType!.toString()
      );
    }
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

function pagingField(messages: MessagesMap, method: MethodDescriptorProto) {
  const inputType = messages[method.inputType!];
  const outputType = messages[method.outputType!];
  const hasPageToken =
    inputType && inputType.field!.some(field => field.name === 'page_token');
  const hasPageSize =
    inputType && inputType.field!.some(field => field.name === 'page_size');
  const hasNextPageToken =
    outputType &&
    outputType.field!.some(field => field.name === 'next_page_token');
  if (!hasPageToken || !hasPageSize || !hasNextPageToken) {
    return undefined;
  }
  const repeatedFields = outputType.field!.filter(
    field =>
      field.label ===
      plugin.google.protobuf.FieldDescriptorProto.Label.LABEL_REPEATED
  );
  if (repeatedFields.length !== 1) {
    return undefined;
  }
  return repeatedFields[0];
}

function pagingFieldName(messages: MessagesMap, method: MethodDescriptorProto) {
  const repeatedFields = pagingField(messages, method);
  if (repeatedFields && repeatedFields.name) {
    return repeatedFields.name;
  } else {
    return undefined;
  }
}

function pagingResponseType(
  messages: MessagesMap,
  method: MethodDescriptorProto
) {
  const repeatedFields = pagingField(messages, method);
  if (repeatedFields && repeatedFields.typeName) {
    const typeName = repeatedFields.typeName; //.google.showcase.v1beta1.EchoResponse
    return typeName.replace(/\.([^.]+)$/, '.I$1');
  }
  return undefined;
}

function toInterface(type: string) {
  return type.replace(/\.([^.]+)$/, '.I$1');
}

// Convert long running type to the interface
// eg: WaitResponse -> .google.showcase.v1beta1.IWaitResponse
// eg: WaitMetadata -> .google.showcase.v1beta1.IWaitMetadata

function toLRInterface(type: string, inputType: string) {
  return inputType.replace(/\.([^.]+)$/, '.I' + type);
}

function getComments(
  method: MethodDescriptorProto,
  comments: CommentsMap
): string {
  return comments[method.name!].trim();
}

function augmentMethod(
  messages: MessagesMap,
  method: MethodDescriptorProto,
  comments: CommentsMap
) {
  method = Object.assign(
    {
      idempotence: idempotence(method),
      longRunning: longrunning(method),
      longRunningResponseType: longRunningResponseType(method),
      longRunningMetadataType: longRunningMetadataType(method),
      streaming: streaming(method),
      pagingFieldName: pagingFieldName(messages, method),
      pagingResponseType: pagingResponseType(messages, method),
      inputInterface: toInterface(method.inputType!),
      outputInterface: toInterface(method.outputType!),
      comments: getComments(method, comments),
    },
    method
  ) as MethodDescriptorProto;
  return method;
}

function augmentService(
  messages: MessagesMap,
  service: plugin.google.protobuf.IServiceDescriptorProto,
  comments: CommentsMap
) {
  const augmentedService = service as ServiceDescriptorProto;
  augmentedService.comments = comments[
    augmentedService.name! + 'Service'
  ].trim();
  augmentedService.method = augmentedService.method.map(method =>
    augmentMethod(messages, method, comments)
  );
  augmentedService.simpleMethods = augmentedService.method.filter(
    method =>
      !method.longRunning && !method.streaming && !method.pagingFieldName
  );
  augmentedService.longRunning = augmentedService.method.filter(
    method => method.longRunning
  );
  augmentedService.streaming = augmentedService.method.filter(
    method => method.streaming
  );
  augmentedService.clientStreaming = augmentedService.method.filter(
    method => method.streaming === 'CLIENT_STREAMING'
  );
  augmentedService.serverStreaming = augmentedService.method.filter(
    method => method.streaming === 'SERVER_STREAMING'
  );
  augmentedService.bidiStreaming = augmentedService.method.filter(
    method => method.streaming === 'BIDI_STREAMING'
  );
  augmentedService.paging = augmentedService.method.filter(
    method => method.pagingFieldName
  );

  augmentedService.hostname = '';
  augmentedService.port = 0;
  if (
    augmentedService.options &&
    augmentedService.options['.google.api.defaultHost']
  ) {
    const match = augmentedService.options['.google.api.defaultHost'].match(
      /^(.*):(\d+)$/
    );
    if (match) {
      augmentedService.hostname = match[1];
      augmentedService.port = Number.parseInt(match[2], 10);
    }
  }
  augmentedService.oauthScopes = [];
  if (
    augmentedService.options &&
    augmentedService.options['.google.api.oauthScopes']
  ) {
    augmentedService.oauthScopes = augmentedService.options[
      '.google.api.oauthScopes'
    ].split(',');
  }
  return augmentedService;
}

function getCommentsMap(
  fd: plugin.google.protobuf.IFileDescriptorProto
): CommentsMap {
  const comments: CommentsMap = {};
  if (!fd || !fd.sourceCodeInfo || !fd.sourceCodeInfo.location) return comments;
  const locations = fd.sourceCodeInfo.location;
  locations.forEach(location => {
    if (location.leadingComments !== null) {
      // p is an array with format [f1, i1, f2, i2, ...]
      // - f1 refers to the protobuf field tag
      // - if field refer to by f1 is a slice, i1 refers to an element in that slice
      // - f2 and i2 works recursively.
      // So, [6, x] refers to the xth service defined in the file,
      // since the field tag of Service is 6.
      // [6, x, 2, y] refers to the yth method in that service,
      // since the field tag of Method is 2.
      const p = location.path!;
      if (p.length === 2 && p[0] === 6) {
        if (fd.service && fd.service[p[1]] && fd.service[p[1]].name) {
          comments[fd.service[p[1]].name! + 'Service'] =
            location.leadingComments || '';
        }
      } else if (p.length === 4 && p[2] === 2) {
        if (
          fd.service &&
          fd.service[p[1]] &&
          fd.service[p[1]].method &&
          fd.service[p[1]].method![p[3]] &&
          fd.service[p[1]].method![p[3]].name
        ) {
          const name = fd.service[p[1]].method![p[3]].name!;
          if (!comments[name]) {
            comments[name] = location.leadingComments || '';
          }
        }
      }
    }
  });
  return comments;
}

export class Proto {
  filePB2: plugin.google.protobuf.IFileDescriptorProto;
  services: ServicesMap = {};
  messages: MessagesMap = {};
  enums: EnumsMap = {};
  fileToGenerate: boolean;
  comments: CommentsMap = {};
  // TODO: need to store metadata? address?

  constructor(
    fd: plugin.google.protobuf.IFileDescriptorProto,
    packageName: string
  ) {
    fd.enumType = fd.enumType || [];
    fd.messageType = fd.messageType || [];
    fd.service = fd.service || [];

    this.filePB2 = fd;

    this.messages = fd.messageType
      .filter(message => message.name)
      .reduce(
        (map, message) => {
          map['.' + fd.package! + '.' + message.name!] = message;
          return map;
        },
        {} as MessagesMap
      );

    this.enums = fd.enumType
      .filter(enum_ => enum_.name)
      .reduce(
        (map, enum_) => {
          map[enum_.name!] = enum_;
          return map;
        },
        {} as EnumsMap
      );

    this.fileToGenerate = fd.package
      ? fd.package.startsWith(packageName)
      : false;
    this.comments = getCommentsMap(fd);
    this.services = fd.service
      .filter(service => service.name)
      .map(service => augmentService(this.messages, service, this.comments))
      .reduce(
        (map, service) => {
          map[service.name!] = service;
          return map;
        },
        {} as ServicesMap
      );
  }
}
