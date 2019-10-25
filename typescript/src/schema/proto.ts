import * as plugin from '../../../pbjs-genfiles/plugin';
import { CommentsMap } from './comments';

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
  pathTemplate: ResourceDescriptor[];
}

export interface ResourceDescriptor extends plugin.google.api.IResourceDescriptor{
  params: string[];
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

function augmentMethod(
  messages: MessagesMap,
  method: MethodDescriptorProto,
  commentsMap: CommentsMap
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
      comments: commentsMap.getMethodComments(method.name!),
    },
    method
  ) as MethodDescriptorProto;
  return method;
}

function augmentService(
  messages: MessagesMap,
  service: plugin.google.protobuf.IServiceDescriptorProto,
  commentsMap: CommentsMap
) {
  const augmentedService = service as ServiceDescriptorProto;
  augmentedService.comments = commentsMap.getServiceComment(service.name!);
  augmentedService.method = augmentedService.method.map(method =>
    augmentMethod(messages, method, commentsMap)
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
  augmentedService.pathTemplate = [];
  for(var property in messages){
    if(messages.hasOwnProperty(property)){
      const m = messages[property];
      if(m && m.options){
        const option = m.options;
        if(option && option[".google.api.resource"]){
          const opt = option[".google.api.resource"];
          const onePathTemplate = opt as ResourceDescriptor;
          if(opt.type){
            const arr = opt.type.match(/\/([^.]+)$/);
            if(arr){
              opt.type = arr[arr.length - 1].toLowerCase();
            }
          }
          const pattern = opt.pattern;
          //TODO: SUPPORT MULTIPLE PATTERNS
          if(pattern && pattern[0]) {
            const params = pattern[0].match(/{[a-zA-Z]+}/g) || [];
            for(var i = 0; i < params.length; i++){
              params[i] = params[i].replace('{', '').replace('}', '');
            }
            onePathTemplate.params = params;
          }
          augmentedService.pathTemplate.push(onePathTemplate);
        }
      }
    }
  }
  return augmentedService;
}

export class Proto {
  filePB2: plugin.google.protobuf.IFileDescriptorProto;
  services: ServicesMap = {};
  messages: MessagesMap = {};
  enums: EnumsMap = {};
  fileToGenerate: boolean;
  commentsMap: CommentsMap;
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
    this.commentsMap = new CommentsMap(fd);
    this.services = fd.service
      .filter(service => service.name)
      .map(service => augmentService(this.messages, service, this.commentsMap))
      .reduce(
        (map, service) => {
          map[service.name!] = service;
          return map;
        },
        {} as ServicesMap
      );
  }
}
