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
import {convertTemplateToRegex, getNamedSegment, milliseconds} from '../util';
import {ResourceDescriptor, ResourceDatabase} from './resource-database';
import {
  RetryableCodeMap,
  defaultParametersName,
  defaultNonIdempotentRetryCodesName,
  defaultParameters,
} from './retryable-code-map';
import {BundleConfig} from '../bundle';
import {Options} from './naming';
import {ServiceYaml} from '../serviceyaml';

const COMMON_PROTO_LIST = [
  'google.api',
  'google.rpc',
  'google.protobuf',
  'google.type',
];

export interface MethodDescriptorProto
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
  pagingMapResponseType?: string;
  ignoreMapPagingMethod?: boolean | undefined;
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
  // if there are multiple parameters to be sent in the dynamic routing header or multiple routing annotations, then this will be an array of DynamicRoutingParameters,
  // where the first array of DynamicRoutingParameters is the set of information for the first annotation to attempt to find a match for the first parameter,
  // and the second array DynamicRoutingParameters is the set of information for the second annotation to attempt to find
  // a match for the second parameter, and so forth.
  dynamicRoutingRequestParams: DynamicRoutingParameters[][];
  bundleConfig?: BundleConfig;
  toJSON: Function | undefined;
  isDiregapicLRO?: boolean;
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
  serviceYaml: ServiceYaml;
  toJSON: Function | undefined;
  IAMPolicyMixin: number;
  LocationMixin: number;
  LongRunningOperationsMixin: number;
  protoFile: string;
  diregapicLRO?: MethodDescriptorProto[];
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

// Detect non-AIP-compliant LRO method for DIREGAPIC, where the response type is customized Operation and the method is not polling method.
// (TODO: summerji) Update the detector when DIREGAPIC LRO annotation merged in googleapis-discovery.
function isDiregapicLRO(
  packageName: string,
  method: MethodDescriptorProto,
  isDiregapic?: boolean
): boolean | '' | null | undefined {
  const operationOutputType = toFullyQualifiedName(packageName, 'Operation');
  return (
    isDiregapic &&
    method.outputType &&
    method.outputType === operationOutputType &&
    method.options?.['.google.api.http'] &&
    !(
      method.options?.['.google.api.http'].get ||
      (method.name === 'Wait' && method.options?.['.google.api.http'].post)
    )
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
  diregapic?: boolean
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
        field.name === 'page_size' ||
        (diregapic && field.name === 'max_results')
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
  diregapic?: boolean
) {
  const field = pagingField(messages, method, service, diregapic);
  return field?.name;
}

function pagingResponseType(
  messages: MessagesMap,
  method: MethodDescriptorProto,
  diregapic?: boolean
) {
  const field = pagingField(messages, method, undefined, diregapic);
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

// Ignore non-diregapic pagation method where its response type contains a map.
function ignoreMapPagingMethod(
  messages: MessagesMap,
  method: MethodDescriptorProto,
  diregapic?: boolean
) {
  const pagingfield = pagingField(messages, method, undefined, diregapic);
  const outputType = messages[method.outputType!];
  if (!pagingfield?.type || !outputType.nestedType) {
    return undefined;
  }
  if (diregapic) {
    return false;
  }
  for (const desProto of outputType.nestedType) {
    if (desProto.options && desProto.options.mapEntry) {
      return true;
    }
  }
  return false;
}

// Support DIREGAPIC google-discovery API pagination response with map field.
function pagingMapResponseType(
  messages: MessagesMap,
  method: MethodDescriptorProto,
  diregapic?: boolean
) {
  const pagingfield = pagingField(messages, method, undefined, diregapic);
  const outputType = messages[method.outputType!];
  if (!pagingfield?.type || !diregapic || !outputType.nestedType) {
    return undefined;
  }
  const mapResponses = outputType.nestedType.filter(desProto => {
    return desProto.options && desProto.options.mapEntry;
  });
  if (mapResponses.length === 0) {
    return undefined;
  }
  if (mapResponses.length > 1) {
    throw new Error(
      `Paginated "${method.name}" method can only have one map field`
    );
  }
  const pagingMapResponse = mapResponses[0];
  // convert paging.field typeName .google.cloud.compute.v1.ItemEntry to ItemEntry
  if (pagingMapResponse.name !== pagingfield.typeName?.split('.').pop()) {
    throw new Error(
      `Paginated "${method.name}" method map response field name "${pagingMapResponse.name}" is not matching the paging field name "${pagingfield.typeName}"`
    );
  }
  if (pagingMapResponse.field) {
    if (
      pagingMapResponse.field.length === 2 &&
      pagingMapResponse.field[0] === 'key' &&
      pagingMapResponse.field[0].type !==
        protos.google.protobuf.FieldDescriptorProto.Type.TYPE_STRING
    ) {
      throw new Error(
        `Paginated "${method.name}" method map response field key's type should be string`
      );
    }
    return pagingMapResponse.field[1].typeName;
  }
  return undefined;
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
  diregapic?: boolean;
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
      isDiregapicLRO: isDiregapicLRO(
        parameters.service.packageName,
        method,
        parameters.diregapic
      ),
      streaming: streaming(method),
      pagingFieldName: pagingFieldName(
        parameters.allMessages,
        method,
        parameters.service,
        parameters.diregapic
      ),
      pagingResponseType: pagingResponseType(
        parameters.allMessages,
        method,
        parameters.diregapic
      ),
      pagingMapResponseType: pagingMapResponseType(
        parameters.allMessages,
        method,
        parameters.diregapic
      ),
      ignoreMapPagingMethod: ignoreMapPagingMethod(
        parameters.allMessages,
        method,
        parameters.diregapic
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
  const methodDynamicRouting = method.options?.['.google.api.routing'];
  const methodDynamicRoutingParameters =
    methodDynamicRouting?.routingParameters;
  // If dynamic routing annotation doesn't exist, then send implicitly generated headers.
  if (!methodDynamicRouting) {
    method.headerRequestParams = getHeaderRequestParams(
      method.options?.['.google.api.http']
    );
  }
  // If dynamic routing annotation exists and is non-empty, then send dynamic routing headers.
  else if (
    methodDynamicRoutingParameters &&
    methodDynamicRoutingParameters.length > 0
  ) {
    method.dynamicRoutingRequestParams = getDynamicHeaderRequestParams(
      methodDynamicRoutingParameters
    );
  }
  // protobuf.js redefines .toJSON to serialize only known fields,
  // but we need to serialize the whole augmented object.
  method.toJSON = undefined;
  return method;
}

export function getSingleHeaderParam(
  rule: protos.google.api.IHttpRule
): string[][] {
  const message =
    rule.post || rule.delete || rule.get || rule.put || rule.patch;
  if (message) {
    const result: string[][] = [];
    const matches = message.matchAll(/{(.*?)[=}]/g);
    for (const match of matches) {
      if (match[1]) {
        result.push(match[1].split('.'));
      }
    }
    return result;
  }
  return [];
}

export function getHeaderRequestParams(
  httpRule: protos.google.api.IHttpRule | null | undefined
) {
  if (!httpRule) {
    return [];
  }
  let params: string[][] = [];
  params = params.concat(getSingleHeaderParam(httpRule));
  httpRule.additionalBindings = httpRule.additionalBindings ?? [];
  params = params.concat(
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

// Parses the routing annotation and sets headerRequest for a method. This assumes the routing annotations
// are in a sorted order (e.g. all the annotations for a single parameter are next to each other).

export function getDynamicHeaderRequestParams(
  rules: protos.google.api.IRoutingParameter[]
) {
  const params: DynamicRoutingParameters[][] = [[]];
  let countOfParameters = 0;
  rules.forEach((rule, index) => {
    // Add the first rule to the first array
    if (index === 0) {
      params[countOfParameters].push(getSingleRoutingHeaderParam(rule));
    }
    // If the 'fieldSend' is the same as the previous rule, then add it to the same array. Otherwise, start a new array.
    else if (
      getSingleRoutingHeaderParam(rule).fieldSend ===
      getSingleRoutingHeaderParam(rules[index - 1]).fieldSend
    ) {
      params[countOfParameters].push(getSingleRoutingHeaderParam(rule));
    } else {
      countOfParameters++;
      params[countOfParameters] = [];
      params[countOfParameters].push(getSingleRoutingHeaderParam(rule));
    }
  });
  return params;
}

// This is what each routing annotation is translated into. fieldRetrive is the name of the
// field the header should retrieve from the message. fieldSend is the name of the field the header should send.
// messageRegex is the regex of the path template that the message field should match.
// namedSegment is the regex capture of the named value of the field.
export interface DynamicRoutingParameters {
  fieldRetrieve: string[];
  fieldSend: string;
  messageRegex: string;
  namedSegment: string;
}

// The field to be retrieved needs to be converted into camelCase
export function convertFieldToCamelCase(field: string) {
  const camelCaseFields: string[] = [];
  if (field === '') {
    return camelCaseFields;
  }
  const fieldsToRetrieve = field.split('.');
  fieldsToRetrieve.forEach(field => {
    camelCaseFields.push(field.toCamelCase());
  });
  return camelCaseFields;
}

// This parses a single Routing Parameter and returns a MapRoutingParameters interface.
export function getSingleRoutingHeaderParam(
  rule: protos.google.api.IRoutingParameter
): DynamicRoutingParameters {
  let dynamicRoutingRule: DynamicRoutingParameters = {
    fieldRetrieve: [],
    fieldSend: '',
    messageRegex: '',
    namedSegment: '',
  };
  // If routing parameters are empty, then return empty interface
  if (!rule.field) {
    return dynamicRoutingRule;
  } else if (!rule.pathTemplate) {
    // If there is no path template, then capture the full field from the message
    dynamicRoutingRule = {
      fieldRetrieve: convertFieldToCamelCase(rule.field),
      fieldSend: rule.field,
      messageRegex: '[^/]+',
      namedSegment: '[^/]+',
    };
  }
  // If the annotation is malformed, then return empty interface
  else if (getNamedSegment(rule.pathTemplate).length < 1) {
    return dynamicRoutingRule;
  } else {
    dynamicRoutingRule = {
      fieldRetrieve: convertFieldToCamelCase(rule.field),
      fieldSend: getNamedSegment(rule.pathTemplate)[1],
      messageRegex: convertTemplateToRegex(rule.pathTemplate),
      namedSegment: getNamedSegment(rule.pathTemplate)[3],
    };
  }
  return dynamicRoutingRule;
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
  protoFile: string;
}

function augmentService(parameters: AugmentServiceParameters) {
  const augmentedService = parameters.service as ServiceDescriptorProto;
  augmentedService.packageName = parameters.packageName;
  augmentedService.serviceYaml = parameters.options.serviceYaml!;
  augmentedService.protoFile = parameters.protoFile;
  if (
    parameters.options.serviceYaml?.apis.includes('google.iam.v1.IAMPolicy')
  ) {
    augmentedService.IAMPolicyMixin = 1;
  }
  if (
    parameters.options.serviceYaml?.apis.includes(
      'google.cloud.location.Locations'
    )
  ) {
    augmentedService.LocationMixin = 1;
  }
  if (
    parameters.options.serviceYaml?.apis.includes(
      'google.longrunning.Operations'
    )
  ) {
    augmentedService.LongRunningOperationsMixin = 1;
  }
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
        diregapic: parameters.options.diregapic,
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
  augmentedService.diregapicLRO = augmentedService.method.filter(
    method => method.isDiregapicLRO
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
  diregapic?: boolean;
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
    this.diregapic = parameters.options.diregapic;
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
          protoFile: parameters.fd.name!,
        })
      )
      .reduce((map, service) => {
        map[service.name!] = service;
        return map;
      }, {} as ServicesMap);
  }
}
