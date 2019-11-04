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
import { CommentsMap, Comment } from './comments';
import * as objectHash from 'object-hash';
import { milliseconds } from '../util';
import { FileSystemLoader } from 'nunjucks';

const defaultNonIdempotentRetryCodesName = 'non_idempotent';
const defaultNonIdempotentCodes: plugin.google.rpc.Code[] = [];
const defaultIdempotentRetryCodesName = 'idempotent';
const defaultIdempotentCodes = [
  plugin.google.rpc.Code.DEADLINE_EXCEEDED,
  plugin.google.rpc.Code.UNAVAILABLE,
];
const defaultParametersName = 'default';
const defaultParameters = {
  initial_retry_delay_millis: 100,
  retry_delay_multiplier: 1.3,
  max_retry_delay_millis: 60000,
  // note: the following four parameters are unused but currently required by google-gax.
  // setting them to some big safe default values.
  initial_rpc_timeout_millis: 20000,
  rpc_timeout_multiplier: 1.0,
  max_rpc_timeout_millis: 20000,
  total_timeout_millis: 600000,
};

interface MethodDescriptorProto
  extends plugin.google.protobuf.IMethodDescriptorProto {
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
  comments: string[];
  // paramComments include comments for all input field
  paramComment?: Comment[];
  methodConfig: plugin.grpc.service_config.MethodConfig;
  retryableCodesName: string;
  retryParamsName: string;
  timeoutMillis?: number;
  headerRequestParams: string[];
}
export class RetryableCodeMap {
  codeEnumMapping: { [index: string]: string };
  uniqueCodesNamesMap: { [uniqueName: string]: string };
  prettyCodesNamesMap: { [prettyName: string]: string[] };
  uniqueParamsNamesMap: { [uniqueName: string]: string };
  prettyParamNamesMap: { [prettyName: string]: {} };

  constructor() {
    this.uniqueCodesNamesMap = {};
    this.prettyCodesNamesMap = {};
    this.uniqueParamsNamesMap = {};
    this.prettyParamNamesMap = {};

    // build reverse mapping for enum: 0 => OK, 1 => CANCELLED, etc.
    this.codeEnumMapping = {};
    const allCodes = Object.keys(plugin.google.rpc.Code);
    for (const code of allCodes) {
      this.codeEnumMapping[
        ((plugin.google.rpc.Code as unknown) as {
          [key: string]: plugin.google.rpc.Code;
        })[code].toString()
      ] = code;
    }

    // generate some pre-defined code sets for compatibility with existing configs
    this.getRetryableCodesName(
      defaultNonIdempotentCodes,
      defaultNonIdempotentRetryCodesName
    );
    this.getRetryableCodesName(
      defaultIdempotentCodes,
      defaultIdempotentRetryCodesName
    );
    this.getParamsName(defaultParameters, 'default');
  }

  private buildUniqueCodesName(
    retryableStatusCodes: plugin.google.rpc.Code[]
  ): string {
    // generate an unique readable name for the given retryable set of codes
    const sortedCodes = retryableStatusCodes.sort(
      (a, b) => Number(a) - Number(b)
    );
    const uniqueName = sortedCodes
      .map(code => this.codeEnumMapping[code])
      .join('_')
      .toSnakeCase();
    return uniqueName;
  }

  private buildUniqueParamsName(params: {}): string {
    // generate an unique not so readable name for the given set of parameters
    return objectHash(params);
  }

  getRetryableCodesName(
    retryableStatusCodes: plugin.google.rpc.Code[],
    suggestedName?: string
  ): string {
    const uniqueName = this.buildUniqueCodesName(retryableStatusCodes);
    const prettyName =
      this.uniqueCodesNamesMap[uniqueName] || suggestedName || uniqueName;
    if (!this.uniqueCodesNamesMap[uniqueName]) {
      this.uniqueCodesNamesMap[uniqueName] = prettyName;
      this.prettyCodesNamesMap[prettyName] = retryableStatusCodes.map(
        code => this.codeEnumMapping[code]
      );
    }
    return prettyName;
  }

  getParamsName(params: {}, suggestedName?: string): string {
    const uniqueName = this.buildUniqueParamsName(params);
    const prettyName =
      this.uniqueParamsNamesMap[uniqueName] || suggestedName || uniqueName;
    if (!this.uniqueParamsNamesMap[uniqueName]) {
      this.uniqueParamsNamesMap[uniqueName] = prettyName;
      this.prettyParamNamesMap[prettyName] = params;
    }
    return prettyName;
  }

  getPrettyCodesNames(): string[] {
    return Object.keys(this.prettyCodesNamesMap);
  }

  getCodesJSON(prettyName: string): string {
    return JSON.stringify(this.prettyCodesNamesMap[prettyName]);
  }

  getPrettyParamsNames(): string[] {
    return Object.keys(this.prettyParamNamesMap);
  }

  getParamsJSON(prettyName: string): string {
    return JSON.stringify(this.prettyParamNamesMap[prettyName]);
  }
}

interface ServiceDescriptorProto
  extends plugin.google.protobuf.IServiceDescriptorProto {
  packageName: string;
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
  comments: string[];
  pathTemplates: ResourceDescriptor[];
  commentsMap: CommentsMap;
  retryableCodeMap: RetryableCodeMap;
  grpcServiceConfig: plugin.grpc.service_config.ServiceConfig;
}

export interface ResourceDescriptor
  extends plugin.google.api.IResourceDescriptor {
  name: string;
  params: string[];
}

export interface ResourceMap {
  [name: string]: ResourceDescriptor;
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

// convert from input interface to message name
// eg: .google.showcase.v1beta1.EchoRequest -> EchoRequest
function toMessageName(messageType: string): string {
  const arr = messageType.split('.');
  return arr[arr.length - 1];
}

// Convert long running type to the interface
// eg: WaitResponse -> .google.showcase.v1beta1.IWaitResponse
// eg: WaitMetadata -> .google.showcase.v1beta1.IWaitMetadata
function toLRInterface(type: string, inputType: string) {
  return inputType.replace(/\.([^.]+)$/, '.I' + type);
}

export function getHeaderParams(rule: plugin.google.api.IHttpRule): string[] {
  const message =
    rule.post || rule.delete || rule.get || rule.put || rule.patch;
  if (message) {
    const res = message.match(/{(.*?)=/);
    return res && res[1] ? res[1].split('.') : [];
  }
  return [];
}

function getMethodConfig(
  grpcServiceConfig: plugin.grpc.service_config.ServiceConfig,
  serviceName: string,
  methodName: string
): plugin.grpc.service_config.MethodConfig {
  let exactMatch: plugin.grpc.service_config.IMethodConfig | undefined;
  let serviceMatch: plugin.grpc.service_config.IMethodConfig | undefined;
  for (const config of grpcServiceConfig.methodConfig) {
    if (!config.name) {
      continue;
    }
    for (const name of config.name) {
      if (name.service === serviceName && !name.method) {
        serviceMatch = config;
      }
      if (name.service === serviceName && name.method === methodName) {
        exactMatch = config;
      }
    }
  }
  const result = plugin.grpc.service_config.MethodConfig.fromObject(
    exactMatch || serviceMatch || {}
  );
  return result;
}

function augmentMethod(
  messages: MessagesMap,
  service: ServiceDescriptorProto,
  method: MethodDescriptorProto
) {
  method = Object.assign(
    {
      longRunning: longrunning(method),
      longRunningResponseType: longRunningResponseType(method),
      longRunningMetadataType: longRunningMetadataType(method),
      streaming: streaming(method),
      pagingFieldName: pagingFieldName(messages, method),
      pagingResponseType: pagingResponseType(messages, method),
      inputInterface: toInterface(method.inputType!),
      outputInterface: toInterface(method.outputType!),
      comments: service.commentsMap.getMethodComments(
        service.name!,
        method.name!
      ),
      methodConfig: getMethodConfig(
        service.grpcServiceConfig,
        `${service.packageName}.${service.name!}`,
        method.name!
      ),
      retryableCodesName: defaultNonIdempotentRetryCodesName,
      retryParamsName: defaultParametersName,
    },
    method
  ) as MethodDescriptorProto;
  if (method.inputType && messages[method.inputType].field) {
    const paramComment: Comment[] = [];
    const inputType = messages[method.inputType!];
    const inputmessageName = toMessageName(method.inputType);
    for (const field of inputType.field!) {
      const comment = service.commentsMap.getParamComments(
        inputmessageName,
        field.name!
      );
      paramComment.push(comment);
    }
    method.paramComment = paramComment;
  }
  if (
    method.methodConfig.retryPolicy &&
    method.methodConfig.retryPolicy.retryableStatusCodes
  ) {
    method.retryableCodesName = service.retryableCodeMap.getRetryableCodesName(
      method.methodConfig.retryPolicy.retryableStatusCodes
    );
  }
  if (method.methodConfig.retryPolicy) {
    // converting retry parameters to the syntax google-gax supports
    const retryParams: { [key: string]: number } = {};
    if (method.methodConfig.retryPolicy.initialBackoff) {
      retryParams.initial_retry_delay_millis = milliseconds(
        method.methodConfig.retryPolicy.initialBackoff
      );
    }
    if (method.methodConfig.retryPolicy.backoffMultiplier) {
      retryParams.retry_delay_multiplier =
        method.methodConfig.retryPolicy.backoffMultiplier;
    }
    if (method.methodConfig.retryPolicy.maxBackoff) {
      retryParams.max_retry_delay_millis = milliseconds(
        method.methodConfig.retryPolicy.maxBackoff
      );
    }
    // note: the following four parameters are unused but currently required by google-gax.
    // setting them to some big safe default values.
    retryParams.initial_rpc_timeout_millis =
      defaultParameters.initial_rpc_timeout_millis;
    retryParams.rpc_timeout_multiplier =
      defaultParameters.rpc_timeout_multiplier;
    retryParams.max_rpc_timeout_millis =
      defaultParameters.max_rpc_timeout_millis;
    retryParams.total_timeout_millis = defaultParameters.total_timeout_millis;

    method.retryParamsName = service.retryableCodeMap.getParamsName(
      retryParams
    );
  }
  if (method.methodConfig.timeout) {
    method.timeoutMillis = milliseconds(method.methodConfig.timeout);
  }
  if (method.options && method.options['.google.api.http']) {
    const httpRule = method.options['.google.api.http'];
    method.headerRequestParams = getHeaderParams(httpRule);
  } else method.headerRequestParams = [];
  return method;
}

function augmentService(
  messages: MessagesMap,
  packageName: string,
  service: plugin.google.protobuf.IServiceDescriptorProto,
  commentsMap: CommentsMap,
  grpcServiceConfig: plugin.grpc.service_config.ServiceConfig,
  resourceMap: ResourceMap
) {
  const augmentedService = service as ServiceDescriptorProto;
  augmentedService.packageName = packageName;
  augmentedService.comments = commentsMap.getServiceComment(service.name!);
  augmentedService.commentsMap = commentsMap;
  augmentedService.retryableCodeMap = new RetryableCodeMap();
  augmentedService.grpcServiceConfig = grpcServiceConfig;
  augmentedService.method = augmentedService.method.map(method =>
    augmentMethod(messages, augmentedService, method)
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
  augmentedService.pathTemplates = [];
  for (const property of Object.keys(messages)) {
    const m = messages[property];
    if (m && m.field) {
      const fields = m.field;
      for (const fieldDescriptor of fields) {
        if (fieldDescriptor && fieldDescriptor.options) {
          const option = fieldDescriptor.options;
          if (option && option['.google.api.resourceReference']) {
            const resourceReference = option['.google.api.resourceReference'];
            const type = resourceReference.type;
            if (!type || !resourceMap[type.toString()]) {
              console.warn(
                'In service proto ' +
                  service.name +
                  ' message ' +
                  property +
                  ' refers to an unknown resource: ' +
                  JSON.stringify(resourceReference)
              );
              continue;
            }
            const resource = resourceMap[resourceReference.type!.toString()];
            if (augmentedService.pathTemplates.includes(resource)) continue;
            augmentedService.pathTemplates.push(resource);
          }
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
  // TODO: need to store metadata? address?

  constructor(
    fd: plugin.google.protobuf.IFileDescriptorProto,
    packageName: string,
    grpcServiceConfig: plugin.grpc.service_config.ServiceConfig,
    resourceMap: ResourceMap
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
    const commentsMap = new CommentsMap(fd);
    this.services = fd.service
      .filter(service => service.name)
      .map(service =>
        augmentService(
          this.messages,
          packageName,
          service,
          commentsMap,
          grpcServiceConfig,
          resourceMap
        )
      )
      .reduce(
        (map, service) => {
          map[service.name!] = service;
          return map;
        },
        {} as ServicesMap
      );
  }
}
