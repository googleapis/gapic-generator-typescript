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
import {CommentsMap, Comment} from './comments';
import {milliseconds} from '../util';
import {ResourceDescriptor, ResourceDatabase} from './resource-database';
import {
  RetryableCodeMap,
  defaultParametersName,
  defaultNonIdempotentRetryCodesName,
  defaultParameters,
} from './retryable-code-map';
import {BundleConfig} from '../bundle';
import {Options} from './naming';

const COMMON_PROTO_LIST = [
  'google.api',
  'google.rpc',
  'google.protobuf',
  'google.type',
];

interface MethodDescriptorProto
  extends protos.google.protobuf.IMethodDescriptorProto {
  longRunning?: protos.google.longrunning.IOperationInfo;
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
  methodConfig: protos.grpc.service_config.MethodConfig;
  retryableCodesName: string;
  retryParamsName: string;
  timeoutMillis?: number;
  // headerRequestParams: if we need to pass "request.foo" and "request.bar"
  // into x-goog-request-params header, the array will contain
  // [ ['request', 'foo'], ['request', 'bar']]
  headerRequestParams: string[][];
  bundleConfig?: BundleConfig;
  toJSON: Function | undefined;
}

export interface ServiceDescriptorProto
  extends protos.google.protobuf.IServiceDescriptorProto {
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
  grpcServiceConfig: protos.grpc.service_config.ServiceConfig;
  bundleConfigsMethods: MethodDescriptorProto[];
  bundleConfigs?: BundleConfig[];
  iamService: boolean;
  toJSON: Function | undefined;
}

export interface ServicesMap {
  [name: string]: ServiceDescriptorProto;
}

export interface MessagesMap {
  [name: string]: protos.google.protobuf.IDescriptorProto;
}

// The following functions are used to add some metadata such as idempotence
// flag, long running operation info, pagination, and streaming, to all the
// methods of the given service, to use in templates.

function longrunning(
  service: ServiceDescriptorProto,
  method: MethodDescriptorProto
) {
  if (
    method.outputType &&
    method.outputType === '.google.longrunning.Operation'
  ) {
    if (!method.options?.['.google.longrunning.operationInfo']) {
      throw new Error(
        `rpc "${service.packageName}.${service.name}.${method.name}" returns google.longrunning.Operation but is missing option google.longrunning.operation_info`
      );
    } else {
      return method.options!['.google.longrunning.operationInfo']!;
    }
  }
  return undefined;
}

function toFullyQualifiedName(
  packageName: string,
  messageName: string | null | undefined
) {
  if (!messageName) {
    return undefined;
  }
  if (messageName.includes('.')) {
    if (!messageName.startsWith('.')) {
      return `.${messageName}`;
    }
    return messageName;
  }
  return `.${packageName}.${messageName}`;
}

function longRunningResponseType(
  packageName: string,
  method: MethodDescriptorProto
) {
  return toFullyQualifiedName(
    packageName,
    method.options?.['.google.longrunning.operationInfo']?.responseType
  );
}

function longRunningMetadataType(
  packageName: string,
  method: MethodDescriptorProto
) {
  return toFullyQualifiedName(
    packageName,
    method.options?.['.google.longrunning.operationInfo']?.metadataType
  );
}

// convert from input interface to message name
// eg: .google.showcase.v1beta1.EchoRequest -> EchoRequest
function toMessageName(messageType: string): string {
  const arr = messageType.split('.');
  return arr[arr.length - 1];
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

function pagingField(
  messages: MessagesMap,
  method: MethodDescriptorProto,
  service?: ServiceDescriptorProto,
  rest?: boolean
) {
  // TODO: remove this once the next version of the Talent API is published.
  //
  // This is a workaround to disable auto-pagination for specifc RPCs in
  // Talent v4beta1. The API team will make their API non-conforming in the
  // next version.
  //
  // This should not be done for any other API.
  const serviceNameException =
    service && service.packageName === 'google.cloud.talent.v4beta1';
  const methodNameException =
    method.name === 'SearchProfiles' ||
    method.name === 'SearchJobs' ||
    method.name === 'SearchJobsForAlert';
  if (serviceNameException && methodNameException) {
    return undefined;
  }

  const inputType = messages[method.inputType!];
  const outputType = messages[method.outputType!];
  const hasPageToken =
    inputType && inputType.field!.some(field => field.name === 'page_token');
  // Support paginated methods defined in Discovery-based APIs,
  // where it uses "max_results" to define the maximum number of
  // paginated resources to return.
  const hasPageSize =
    inputType &&
    inputType.field!.some(
      field =>
        field.name === 'page_size' || (rest && field.name === 'max_results')
    );
  const hasNextPageToken =
    outputType &&
    outputType.field!.some(field => field.name === 'next_page_token');
  if (!hasPageToken || !hasPageSize || !hasNextPageToken) {
    return undefined;
  }
  const repeatedFields = outputType.field!.filter(
    field =>
      field.label ===
      protos.google.protobuf.FieldDescriptorProto.Label.LABEL_REPEATED
  );
  if (repeatedFields.length === 0) {
    return undefined;
  }
  if (repeatedFields.length === 1) {
    return repeatedFields[0];
  }
  // According to https://aip.dev/client-libraries/4233, if there are two
  // or more repeated fields in the output, we must take the the first one
  // (in order of appearance in the file AND field number).
  // We believe that all proto fields have numbers, hence !.
  const minFieldNumber = repeatedFields.reduce(
    (min: number, field: protos.google.protobuf.IFieldDescriptorProto) => {
      if (field.number! < min) {
        min = field.number!;
      }
      return min;
    },
    repeatedFields[0].number!
  );
  if (minFieldNumber !== repeatedFields[0].number) {
    console.warn(
      `Warning: method ${method.name} has several repeated fields in the output type and violates https://aip.dev/client-libraries/4233 for auto-pagination. Disabling auto-pagination for this method.`
    );
    console.warn('Fields considered for pagination:');
    console.warn(
      repeatedFields.map(field => `${field.name} = ${field.number}`).join('\n')
    );
    // TODO: an option to ignore errors
    throw new Error(`Bad pagination settings for ${method.name}`);
  }
  return repeatedFields[0];
}

function pagingFieldName(
  messages: MessagesMap,
  method: MethodDescriptorProto,
  service?: ServiceDescriptorProto,
  rest?: boolean
) {
  const field = pagingField(messages, method, service, rest);
  return field?.name;
}

function pagingResponseType(
  messages: MessagesMap,
  method: MethodDescriptorProto,
  rest?: boolean
) {
  const field = pagingField(messages, method, undefined, rest);
  if (!field || !field.type) {
    return undefined;
  }
  if (
    field.type === protos.google.protobuf.FieldDescriptorProto.Type.TYPE_MESSAGE
  ) {
    return field.typeName; //.google.showcase.v1beta1.EchoResponse
  }
  const type = protos.google.protobuf.FieldDescriptorProto.Type[field.type];
  // .google.protobuf.FieldDescriptorProto.Type.TYPE_STRING
  return '.google.protobuf.FieldDescriptorProto.Type.' + type;
}

export function getSingleHeaderParam(
  rule: protos.google.api.IHttpRule
): string[] {
  const message =
    rule.post || rule.delete || rule.get || rule.put || rule.patch;
  if (message) {
    const res = message.match(/{(.*?)[=}]/);
    return res?.[1] ? res[1].split('.') : [];
  }
  return [];
}

function getMethodConfig(
  grpcServiceConfig: protos.grpc.service_config.ServiceConfig,
  serviceName: string,
  methodName: string
): protos.grpc.service_config.MethodConfig {
  let exactMatch: protos.grpc.service_config.IMethodConfig | undefined;
  let serviceMatch: protos.grpc.service_config.IMethodConfig | undefined;
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
  const result = protos.grpc.service_config.MethodConfig.fromObject(
    exactMatch || serviceMatch || {}
  );
  return result;
}

interface AugmentMethodParameters {
  allMessages: MessagesMap;
  localMessages: MessagesMap;
  service: ServiceDescriptorProto;
  rest?: boolean;
}

function augmentMethod(
  parameters: AugmentMethodParameters,
  method: MethodDescriptorProto
) {
  method = Object.assign(
    {
      longRunning: longrunning(parameters.service, method),
      longRunningResponseType: longRunningResponseType(
        parameters.service.packageName,
        method
      ),
      longRunningMetadataType: longRunningMetadataType(
        parameters.service.packageName,
        method
      ),
      streaming: streaming(method),
      pagingFieldName: pagingFieldName(
        parameters.allMessages,
        method,
        parameters.service,
        parameters.rest
      ),
      pagingResponseType: pagingResponseType(
        parameters.allMessages,
        method,
        parameters.rest
      ),
      inputInterface: method.inputType!,
      outputInterface: method.outputType!,
      comments: parameters.service.commentsMap.getMethodComments(
        parameters.service.name!,
        method.name!
      ),
      methodConfig: getMethodConfig(
        parameters.service.grpcServiceConfig,
        `${parameters.service.packageName}.${parameters.service.name!}`,
        method.name!
      ),
      retryableCodesName: defaultNonIdempotentRetryCodesName,
      retryParamsName: defaultParametersName,
    },
    method
  ) as MethodDescriptorProto;
  if (method.longRunning) {
    if (!method.longRunningMetadataType) {
      throw new Error(
        `rpc "${parameters.service.packageName}.${method.name}" has google.longrunning.operation_info but is missing option google.longrunning.operation_info.metadata_type`
      );
    } else if (!method.longRunningResponseType) {
      throw new Error(
        `rpc "${parameters.service.packageName}.${method.name}" has google.longrunning.operation_info but is missing option google.longrunning.operation_info.response_type`
      );
    }
  }
  const bundleConfigs = parameters.service.bundleConfigs;
  if (bundleConfigs) {
    for (const bc of bundleConfigs) {
      if (bc.methodName === method.name) {
        const inputType = parameters.allMessages[method.inputType!];
        const repeatedFields = inputType.field!.filter(
          field =>
            field.label ===
              protos.google.protobuf.FieldDescriptorProto.Label
                .LABEL_REPEATED &&
            field.name === bc.batchDescriptor.batched_field
        );
        if (!repeatedFields[0].typeName) {
          throw new Error(
            `Wrong bundle config for method ${method.name}: typeName is undefined.`
          );
        }
        bc.repeatedField = repeatedFields[0].typeName!.substring(1)!;
        method.bundleConfig = bc;
      }
    }
  }
  if (method.inputType && parameters.allMessages[method.inputType]?.field) {
    const paramComment: Comment[] = [];
    const inputType = parameters.allMessages[method.inputType!];
    const inputmessageName = toMessageName(method.inputType);
    for (const field of inputType.field!) {
      const comment = parameters.service.commentsMap.getParamComments(
        inputmessageName,
        field.name!
      );
      paramComment.push(comment);
    }
    method.paramComment = paramComment;
  }
  if (method.methodConfig.retryPolicy?.retryableStatusCodes) {
    method.retryableCodesName = parameters.service.retryableCodeMap.getRetryableCodesName(
      method.methodConfig.retryPolicy.retryableStatusCodes
    );
  }
  if (method.methodConfig.retryPolicy) {
    // converting retry parameters to the syntax google-gax supports
    const retryParams: {[key: string]: number} = {};
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

    method.retryParamsName = parameters.service.retryableCodeMap.getParamsName(
      retryParams
    );
  }
  if (method.methodConfig.timeout) {
    method.timeoutMillis = milliseconds(method.methodConfig.timeout);
  }
  method.headerRequestParams = getHeaderRequestParams(
    method.options?.['.google.api.http']
  );
  // protobuf.js redefines .toJSON to serialize only known fields,
  // but we need to serialize the whole augmented object.
  method.toJSON = undefined;
  return method;
}

export function getHeaderRequestParams(
  httpRule: protos.google.api.IHttpRule | null | undefined
) {
  if (!httpRule) {
    return [];
  }
  const params: string[][] = [];
  params.push(getSingleHeaderParam(httpRule));

  httpRule.additionalBindings = httpRule.additionalBindings ?? [];
  params.push(
    ...httpRule.additionalBindings.map(binding => getSingleHeaderParam(binding))
  );

  // de-dup result array
  const used = new Set();
  const result: string[][] = [];
  for (const param of params) {
    if (param.length === 0) {
      continue;
    }
    const joined = param.join('.');
    if (used.has(joined)) {
      continue;
    }
    used.add(joined);
    result.push(param);
  }

  return result;
}

interface AugmentServiceParameters {
  allMessages: MessagesMap;
  localMessages: MessagesMap;
  packageName: string;
  service: protos.google.protobuf.IServiceDescriptorProto;
  commentsMap: CommentsMap;
  allResourceDatabase: ResourceDatabase;
  resourceDatabase: ResourceDatabase;
  options: Options;
}

function augmentService(parameters: AugmentServiceParameters) {
  const augmentedService = parameters.service as ServiceDescriptorProto;
  augmentedService.packageName = parameters.packageName;
  augmentedService.iamService = parameters.options.iamService ?? false;
  augmentedService.comments = parameters.commentsMap.getServiceComment(
    parameters.service.name!
  );
  augmentedService.commentsMap = parameters.commentsMap;
  augmentedService.retryableCodeMap = new RetryableCodeMap();
  augmentedService.grpcServiceConfig = parameters.options.grpcServiceConfig;
  augmentedService.bundleConfigs = parameters.options.bundleConfigs?.filter(
    bc => bc.serviceName === parameters.service.name
  );
  augmentedService.method = augmentedService.method.map(method =>
    augmentMethod(
      {
        allMessages: parameters.allMessages,
        localMessages: parameters.localMessages,
        service: augmentedService,
        rest: parameters.options.rest,
      },
      method
    )
  );
  augmentedService.bundleConfigsMethods = augmentedService.method.filter(
    method => method.bundleConfig
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
  if (augmentedService.options?.['.google.api.defaultHost']) {
    const match = augmentedService.options['.google.api.defaultHost'].match(
      /^(.*):(\d+)$/
    );
    if (match) {
      augmentedService.hostname = match[1];
      augmentedService.port = Number.parseInt(match[2], 10);
    }
  }
  augmentedService.oauthScopes = [];
  if (augmentedService.options?.['.google.api.oauthScopes']) {
    augmentedService.oauthScopes = augmentedService.options[
      '.google.api.oauthScopes'
    ].split(',');
  }

  // Build a list of resources referenced by this service

  // allResourceDatabase: resources that defined by `google.api.resource`
  // resourceDatabase: all resources defined by `google.api.resource` or `google.api.resource_definition`
  const uniqueResources: {[name: string]: ResourceDescriptor} = {};
  // Copy all resources in resourceDatabase to uniqueResources
  const allPatterns = parameters.resourceDatabase.patterns;
  for (const pattern of Object.keys(allPatterns)) {
    const resource = allPatterns[pattern];
    uniqueResources[resource.name] = resource;
  }

  // Copy all resources definination which are referenced into unique resources map.
  for (const property of Object.keys(parameters.localMessages)) {
    const errorLocation = `service ${parameters.service.name} message ${property}`;
    for (const fieldDescriptor of parameters.localMessages[property].field ??
      []) {
      // note: ResourceDatabase can accept `undefined` values, so we happily use optional chaining here.
      const resourceReference =
        fieldDescriptor.options?.['.google.api.resourceReference'];
      // 1. If this resource reference has .child_type, figure out if we have any known parent resources.
      const parentResources = parameters.allResourceDatabase.getParentResourcesByChildType(
        resourceReference?.childType,
        errorLocation
      );
      parentResources.forEach(
        resource => (uniqueResources[resource.name] = resource)
      );

      // 2. If this resource reference has .type, we should have a known resource with this type, check two maps.
      if (!resourceReference || !resourceReference.type) continue;
      const resourceByType = parameters.allResourceDatabase.getResourceByType(
        resourceReference?.type,
        errorLocation
      );
      if (!resourceByType || !resourceByType.pattern) continue;
      // For multi pattern resources, we look up the type first, and get the [pattern] from resource,
      // look up pattern map for all resources.
      for (const pattern of resourceByType!.pattern!) {
        const resourceByPattern = parameters.allResourceDatabase.getResourceByPattern(
          pattern
        );
        if (!resourceByPattern) continue;
        uniqueResources[resourceByPattern.name] = resourceByPattern;
      }
    }
  }
  augmentedService.pathTemplates = Object.values(uniqueResources).sort(
    (resourceA, resourceB) => {
      // Path templates names can be cased differently
      // (e.g. 'Project' and 'project_deidentify_template'),
      // so we use camel case for comparison.
      if (resourceA.name.toCamelCase() < resourceB.name.toCamelCase()) {
        return -1;
      }
      if (resourceA.name.toCamelCase() > resourceB.name.toCamelCase()) {
        return 1;
      }
      return 0;
    }
  );
  // protobuf.js redefines .toJSON to serialize only known fields,
  // but we need to serialize the whole augmented object.
  augmentedService.toJSON = undefined;
  return augmentedService;
}

interface ProtoParameters {
  fd: protos.google.protobuf.IFileDescriptorProto;
  packageName: string;
  allMessages: MessagesMap;
  allResourceDatabase: ResourceDatabase;
  resourceDatabase: ResourceDatabase;
  options: Options;
  commentsMap: CommentsMap;
}

export class Proto {
  filePB2: protos.google.protobuf.IFileDescriptorProto;
  services: ServicesMap = {};
  allMessages: MessagesMap = {};
  localMessages: MessagesMap = {};
  fileToGenerate = true;
  rest?: boolean;
  // TODO: need to store metadata? address?

  // allResourceDatabase: resources that defined by `google.api.resource`
  // resourceDatabase: all resources defined by `google.api.resource` or `google.api.resource_definition`
  constructor(parameters: ProtoParameters) {
    parameters.fd.service = parameters.fd.service || [];
    parameters.fd.messageType = parameters.fd.messageType || [];

    this.filePB2 = parameters.fd;
    this.allMessages = parameters.allMessages;
    this.localMessages = parameters.fd.messageType
      .filter(message => message.name)
      .reduce((map, message) => {
        map[`.${parameters.fd.package!}.${message.name!}`] = message;
        return map;
      }, {} as MessagesMap);
    this.rest = parameters.options.rest;
    const protopackage = parameters.fd.package;
    // Allow to generate if a proto has no service and its package name is differ from its service's.
    if (
      !protopackage ||
      (!protopackage.startsWith(parameters.packageName) &&
        parameters.fd.service &&
        parameters.fd.service.length > 0)
    ) {
      this.fileToGenerate = false;
    }
    if (this.fileToGenerate) {
      for (const commonProto of COMMON_PROTO_LIST) {
        if (protopackage === commonProto) {
          this.fileToGenerate = false;
        }
      }
    }
    this.services = parameters.fd.service
      .filter(service => service.name)
      .map(service =>
        augmentService({
          allMessages: this.allMessages,
          localMessages: this.localMessages,
          packageName: parameters.packageName,
          service,
          commentsMap: parameters.commentsMap,
          allResourceDatabase: parameters.allResourceDatabase,
          resourceDatabase: parameters.resourceDatabase,
          options: parameters.options,
        })
      )
      .reduce((map, service) => {
        map[service.name!] = service;
        return map;
      }, {} as ServicesMap);
  }
}
