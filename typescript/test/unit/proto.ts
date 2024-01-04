// Copyright 2020 Google LLC
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

import assert from 'assert';
import {describe, it} from 'mocha';
import type * as protos from '../../../protos/index.js';
import {
  convertFieldToCamelCase,
  DynamicRoutingParameters,
  getDynamicHeaderRequestParams,
  getHeaderRequestParams,
  getSingleRoutingHeaderParam,
  MessagesMap,
  MethodDescriptorProto,
  Proto,
} from '../../src/schema/proto.js';
import {Options} from '../../src/schema/naming.js';
import {ResourceDatabase} from '../../src/schema/resource-database.js';
import {Comment, Comments, CommentsMap} from '../../src/schema/comments.js';
import { Http } from '../../src/serviceyaml.js';
import { Method } from 'protobufjs';

describe('src/schema/proto.ts', () => {
  describe('should get header parameters from http rule', () => {
    it('works with no parameter', () => {
      const httpRule: protos.google.api.IHttpRule = {
        post: '{=abc/*/d/*/ef/}',
      };
      assert.deepStrictEqual(getHeaderRequestParams(httpRule), []);
    });

    it('works only one parameter', () => {
      const httpRule: protos.google.api.IHttpRule = {
        post: '{param1=abc/*/d/*/ef/}',
      };
      assert.deepStrictEqual(getHeaderRequestParams(httpRule), [['param1']]);
    });

    it('works with multiple parameter', () => {
      const httpRule: protos.google.api.IHttpRule = {
        post: '{param1.param2.param3=abc/*/d/*/ef/}',
      };
      assert.deepStrictEqual(getHeaderRequestParams(httpRule), [
        ['param1', 'param2', 'param3'],
      ]);
    });

    it('works with additional bindings', () => {
      const httpRule: protos.google.api.IHttpRule = {
        post: '{param1.param2.param3=abc/*/d/*/ef/}',
        additionalBindings: [
          {
            post: '{foo1.foo2=foos/*}',
          },
          {
            post: 'no_parameters_here',
          },
          {
            post: '{bar1.bar2.bar3=bars/*}',
          },
        ],
      };
      assert.deepStrictEqual(getHeaderRequestParams(httpRule), [
        ['param1', 'param2', 'param3'],
        ['foo1', 'foo2'],
        ['bar1', 'bar2', 'bar3'],
      ]);
    });

    it('dedups parameters', () => {
      const httpRule: protos.google.api.IHttpRule = {
        post: '{param1.param2.param3=abc/*/d/*/ef/}',
        additionalBindings: [
          {
            post: '{foo1.foo2=foos/*}',
          },
          {
            post: '{param1.param2.param3=abc/*/d/*/ef/}',
          },
          {
            post: '{param1.param2.param3=abc/*/d/*/ef/}',
          },
        ],
      };
      assert.deepStrictEqual(getHeaderRequestParams(httpRule), [
        ['param1', 'param2', 'param3'],
        ['foo1', 'foo2'],
      ]);
    });

    it('works with multiple variables', () => {
      const httpRule: protos.google.api.IHttpRule = {
        get: 'v1/param1/{foo}/param2/{bar}/',
        additionalBindings: [
          {
            get: 'v1/param1/{foo}',
          },
        ],
      };
      assert.deepStrictEqual(getHeaderRequestParams(httpRule), [
        ['foo'],
        ['bar'],
      ]);
    });
  });

  describe('should get all the dynamic routing header parameters from routing parameters rule', () => {
    it('returns array with an empty rule if an annotation is malformed', () => {
      const routingParameters: protos.google.api.IRoutingParameter[] = [
        {
          field: 'name',
          pathTemplate: 'test/database',
        },
      ];
      const expectedRoutingParameters: DynamicRoutingParameters[][] = [
        [
          {
            pathTemplate: 'test/database',
            fieldRetrieve: [],
            fieldSend: '',
            messageRegex: '',
          },
        ],
      ];
      assert.deepStrictEqual(
        getDynamicHeaderRequestParams(routingParameters),
        expectedRoutingParameters
      );
    });
    it('works with a couple rules with the same parameter', () => {
      const routingParameters: protos.google.api.IRoutingParameter[] = [
        {
          field: 'name',
          pathTemplate: '{routing_id=projects/*}/**',
        },
        {
          field: 'database',
          pathTemplate: '{routing_id=**}',
        },
        {
          field: 'database',
          pathTemplate: '{routing_id=projects/*/databases/*}/documents/*/**',
        },
      ];
      const expectedRoutingParameters: DynamicRoutingParameters[][] = [
        [
          {
            pathTemplate: '{routing_id=projects/*}/**',
            fieldRetrieve: ['name'],
            fieldSend: 'routing_id',
            messageRegex: '(?<routing_id>projects/[^/]+)(?:/.*)?',
          },
          {
            pathTemplate: '{routing_id=**}',
            fieldRetrieve: ['database'],
            fieldSend: 'routing_id',
            messageRegex: '(?<routing_id>(?:.*)?)',
          },
          {
            pathTemplate: '{routing_id=projects/*/databases/*}/documents/*/**',
            fieldRetrieve: ['database'],
            fieldSend: 'routing_id',
            messageRegex:
              '(?<routing_id>projects/[^/]+/databases/[^/]+)/documents/[^/]+(?:/.*)?',
          },
        ],
      ];
      assert.deepStrictEqual(
        getDynamicHeaderRequestParams(routingParameters),
        expectedRoutingParameters
      );
    });
    it('works with a couple rules with different parameters', () => {
      const routingParameters: protos.google.api.IRoutingParameter[] = [
        {
          field: 'name',
          pathTemplate: '{routing_id=projects/*}/**',
        },
        {
          field: 'app_profile_id',
          pathTemplate: '{profile_id=projects/*}/**',
        },
      ];
      const expectedRoutingParameters: DynamicRoutingParameters[][] = [
        [
          {
            pathTemplate: '{routing_id=projects/*}/**',
            fieldRetrieve: ['name'],
            fieldSend: 'routing_id',
            messageRegex: '(?<routing_id>projects/[^/]+)(?:/.*)?',
          },
        ],
        [
          {
            pathTemplate: '{profile_id=projects/*}/**',
            fieldRetrieve: ['appProfileId'],
            fieldSend: 'profile_id',
            messageRegex: '(?<profile_id>projects/[^/]+)(?:/.*)?',
          },
        ],
      ];
      assert.deepStrictEqual(
        getDynamicHeaderRequestParams(routingParameters),
        expectedRoutingParameters
      );
    });
    it('works with a several rules with different parameters', () => {
      const routingParameters: protos.google.api.IRoutingParameter[] = [
        {
          field: 'name',
          pathTemplate: '{routing_id=projects/*}/**',
        },
        {
          field: 'name',
          pathTemplate:
            'test/{routing_id=projects/*/databases/*}/documents/*/**',
        },
        {
          field: 'app_profile_id',
          pathTemplate: '{profile_id=projects/*}/**',
        },
      ];
      const expectedRoutingParameters: DynamicRoutingParameters[][] = [
        [
          {
            pathTemplate: '{routing_id=projects/*}/**',
            fieldRetrieve: ['name'],
            fieldSend: 'routing_id',
            messageRegex: '(?<routing_id>projects/[^/]+)(?:/.*)?',
          },
          {
            pathTemplate:
              'test/{routing_id=projects/*/databases/*}/documents/*/**',
            fieldRetrieve: ['name'],
            fieldSend: 'routing_id',
            messageRegex:
              'test/(?<routing_id>projects/[^/]+/databases/[^/]+)/documents/[^/]+(?:/.*)?',
          },
        ],
        [
          {
            pathTemplate: '{profile_id=projects/*}/**',
            fieldRetrieve: ['appProfileId'],
            fieldSend: 'profile_id',
            messageRegex: '(?<profile_id>projects/[^/]+)(?:/.*)?',
          },
        ],
      ];
      assert.deepStrictEqual(
        getDynamicHeaderRequestParams(routingParameters),
        expectedRoutingParameters
      );
    });
    it('regression test: Cloud Run location', () => {
      const routingParameters: protos.google.api.IRoutingParameter[] = [
        {
          field: 'parent',
          pathTemplate: 'projects/*/locations/{location=*}',
        },
      ];
      const expectedRoutingParameters: DynamicRoutingParameters[][] = [
        [
          {
            pathTemplate: 'projects/*/locations/{location=*}',
            fieldRetrieve: ['parent'],
            fieldSend: 'location',
            messageRegex: 'projects/[^/]+/locations/(?<location>[^/]+)',
          },
        ],
      ];
      assert.deepStrictEqual(
        getDynamicHeaderRequestParams(routingParameters),
        expectedRoutingParameters
      );
    });
  });

  describe('should return a string set to camelCase', () => {
    it('should return this to camelCase', () => {
      assert.deepStrictEqual(convertFieldToCamelCase('name.name2.name3'), [
        'name',
        'name2',
        'name3',
      ]);
      assert.deepStrictEqual(convertFieldToCamelCase(''), []);
      assert.deepStrictEqual(convertFieldToCamelCase('parent_id'), [
        'parentId',
      ]);
      assert.deepStrictEqual(convertFieldToCamelCase('app_profile_id'), [
        'appProfileId',
      ]);
      assert.deepStrictEqual(
        convertFieldToCamelCase('name.parent_id.another_parent_id'),
        ['name', 'parentId', 'anotherParentId']
      );
    });
  });

  describe('should get return an array from a single routing parameters rule', () => {
    it('should return an empty DynamicRoutingParameters interface if the annotation is malformed', () => {
      const routingRule: protos.google.api.IRoutingParameter = {
        field: 'name',
        pathTemplate: 'test/database',
      };
      const expectedRoutingParameters: DynamicRoutingParameters = {
        pathTemplate: 'test/database',
        fieldRetrieve: [],
        fieldSend: '',
        messageRegex: '',
      };
      assert.deepStrictEqual(
        expectedRoutingParameters,
        getSingleRoutingHeaderParam(routingRule)
      );
    });
    it('works with no parameters', () => {
      const routingRule: protos.google.api.IRoutingParameter = {};
      const expectedRoutingParameters: DynamicRoutingParameters = {
        pathTemplate: '',
        fieldRetrieve: [],
        fieldSend: '',
        messageRegex: '',
      };
      assert.deepStrictEqual(
        expectedRoutingParameters,
        getSingleRoutingHeaderParam(routingRule)
      );
    });
    it('works with no path template', () => {
      const routingRule: protos.google.api.IRoutingParameter = {
        field: 'name',
      };
      const expectedRoutingParameters: DynamicRoutingParameters = {
        pathTemplate: '',
        fieldRetrieve: ['name'],
        fieldSend: 'name',
        messageRegex: '(?<name>.*)',
      };
      assert.deepStrictEqual(
        expectedRoutingParameters,
        getSingleRoutingHeaderParam(routingRule)
      );
    });
    it('works with a basic path template', () => {
      const routingRule: protos.google.api.IRoutingParameter = {
        field: 'app_profile_id.parent_id',
        pathTemplate: '{routing_id=**}',
      };
      const expectedRoutingParameters: DynamicRoutingParameters = {
        pathTemplate: '{routing_id=**}',
        fieldRetrieve: ['appProfileId', 'parentId'],
        fieldSend: 'routing_id',
        messageRegex: '(?<routing_id>(?:.*)?)',
      };
      assert.deepStrictEqual(
        expectedRoutingParameters,
        getSingleRoutingHeaderParam(routingRule)
      );
    });
    it('works with a standard path template', () => {
      const routingRule: protos.google.api.IRoutingParameter = {
        field: 'app_profile_id',
        pathTemplate: '{routing_id=projects/*}/**',
      };
      const expectedRoutingParameters: DynamicRoutingParameters = {
        pathTemplate: '{routing_id=projects/*}/**',
        fieldRetrieve: ['appProfileId'],
        fieldSend: 'routing_id',
        messageRegex: '(?<routing_id>projects/[^/]+)(?:/.*)?',
      };
      assert.deepStrictEqual(
        expectedRoutingParameters,
        getSingleRoutingHeaderParam(routingRule)
      );
    });
  });

  describe('AugmentService', () => {
    it('should pass proto file name to the service', () => {
      const fd = {} as protos.google.protobuf.FileDescriptorProto;
      fd.name = 'google/cloud/showcase/v1beta1/test.proto';
      fd.package = 'google.cloud.showcase.v1beta1';
      fd.service = [{} as protos.google.protobuf.ServiceDescriptorProto];
      fd.service[0].name = 'TestService';
      fd.service[0].method = [
        {} as protos.google.protobuf.MethodDescriptorProto,
      ];
      fd.service[0].method[0] =
        {} as protos.google.protobuf.MethodDescriptorProto;
      fd.service[0].method[0].name = 'Test';
      fd.service[0].method[0].outputType =
        '.google.cloud.showcase.v1beta1.TestOutput';
      const options: Options = {
        grpcServiceConfig: {} as protos.grpc.service_config.ServiceConfig,
      };
      const allMessages: MessagesMap = {};
      const commentsMap = new CommentsMap([fd]);
      const proto = new Proto({
        fd,
        packageName: 'google.cloud.showcase.v1beta1',
        allMessages,
        allResourceDatabase: new ResourceDatabase(),
        resourceDatabase: new ResourceDatabase(),
        options,
        commentsMap,
      });
      assert.strictEqual(proto.services[fd.service[0].name].protoFile, fd.name);
    });
  });

  describe('special work around for talent API', () => {
    it('The pagingFieldName should be undefined for SearchJobs & SearchProfiles rpc', () => {
      const fd = {} as protos.google.protobuf.FileDescriptorProto;
      fd.name = 'google/cloud/talent/v4beta1/service.proto';
      fd.package = 'google.cloud.talent.v4beta1';
      fd.service = [{} as protos.google.protobuf.ServiceDescriptorProto];
      fd.service[0].name = 'service';
      fd.service[0].method = [
        {} as protos.google.protobuf.MethodDescriptorProto,
      ];
      fd.service[0].method[0] =
        {} as protos.google.protobuf.MethodDescriptorProto;
      fd.service[0].method[0].name = 'SearchJobs';
      fd.service[0].method[1] =
        {} as protos.google.protobuf.MethodDescriptorProto;
      fd.service[0].method[1].name = 'SearchProfiles';
      fd.service[0].method[2] =
        {} as protos.google.protobuf.MethodDescriptorProto;
      fd.service[0].method[2].name = 'SearchJobsForAlert';
      fd.service[0].method[3] =
        {} as protos.google.protobuf.MethodDescriptorProto;
      fd.service[0].method[3].name = 'ListJobs';
      fd.service[0].method[3].outputType =
        '.google.cloud.talent.v4beta1.ListJobsOutput';
      fd.service[0].method[3].inputType =
        '.google.cloud.talent.v4beta1.ListJobsInput';

      fd.messageType = [{} as protos.google.protobuf.DescriptorProto];
      fd.messageType[0] = {} as protos.google.protobuf.DescriptorProto;
      fd.messageType[1] = {} as protos.google.protobuf.DescriptorProto;

      fd.messageType[0].name = 'ListJobsOutput';
      fd.messageType[1].name = 'ListJobsInput';

      fd.messageType[0].field = [
        {} as protos.google.protobuf.FieldDescriptorProto,
      ];
      fd.messageType[0].field[0] =
        {} as protos.google.protobuf.FieldDescriptorProto;
      fd.messageType[0].field[0].name = 'next_page_token';
      fd.messageType[0].field[0].label = 3; // LABEL_REPEATED
      fd.messageType[1].field = [
        {} as protos.google.protobuf.FieldDescriptorProto,
      ];
      fd.messageType[1].field[0] =
        {} as protos.google.protobuf.FieldDescriptorProto;
      fd.messageType[1].field[0].name = 'page_size';
      fd.messageType[1].field[1] =
        {} as protos.google.protobuf.FieldDescriptorProto;
      fd.messageType[1].field[1].name = 'page_token';
      const options: Options = {
        grpcServiceConfig: {} as protos.grpc.service_config.ServiceConfig,
      };
      const allMessages: MessagesMap = {};
      fd.messageType
        ?.filter(message => message.name)
        .forEach(message => {
          allMessages['.' + fd.package! + '.' + message.name!] = message;
        });
      const commentsMap = new CommentsMap([fd]);
      const proto = new Proto({
        fd,
        packageName: 'google.cloud.talent.v4beta1',
        allMessages,
        allResourceDatabase: new ResourceDatabase(),
        resourceDatabase: new ResourceDatabase(),
        options,
        commentsMap,
      });
      assert.deepStrictEqual(
        proto.services['service'].method[0].pagingFieldName,
        undefined
      );
      assert.deepStrictEqual(
        proto.services['service'].method[1].pagingFieldName,
        undefined
      );
      assert.deepStrictEqual(
        proto.services['service'].method[2].pagingFieldName,
        undefined
      );
      assert.deepStrictEqual(
        proto.services['service'].method[3].pagingFieldName,
        'next_page_token'
      );
    });
    it("should allow generate a proto has no service and its package name differ from service's", () => {
      const fd = {} as protos.google.protobuf.FileDescriptorProto;
      fd.name = 'google/cloud/showcase/v1beta1/test.proto';
      fd.package = 'google.cloud.showcase.v1beta1.errors';
      const allMessages: MessagesMap = {};
      const options: Options = {
        grpcServiceConfig: {} as protos.grpc.service_config.ServiceConfig,
      };
      const commentsMap = new CommentsMap([fd]);
      const proto = new Proto({
        fd,
        packageName: 'google.cloud.talent.v4beta1',
        allMessages,
        allResourceDatabase: new ResourceDatabase(),
        resourceDatabase: new ResourceDatabase(),
        options,
        commentsMap,
      });
      assert.deepStrictEqual(proto.fileToGenerate, true);
    });
    it("should not allow generate a service proto with package name differ from the param's pakage name", () => {
      const fd = {} as protos.google.protobuf.FileDescriptorProto;
      fd.name = 'google/cloud/showcase/v1beta1/test.proto';
      fd.package = 'google.cloud.showcase.v1beta1.TestService';
      fd.service = [{} as protos.google.protobuf.ServiceDescriptorProto];
      fd.service[0].name = 'service';
      fd.service[0].method = [
        {} as protos.google.protobuf.MethodDescriptorProto,
      ];
      fd.service[0].method[0] =
        {} as protos.google.protobuf.MethodDescriptorProto;
      fd.service[0].method[0].name = 'Test';
      fd.service[0].method[0].outputType =
        '.google.cloud.showcase.v1beta1.TestOutput';
      const options: Options = {
        grpcServiceConfig: {} as protos.grpc.service_config.ServiceConfig,
      };
      const allMessages: MessagesMap = {};
      const commentsMap = new CommentsMap([fd]);
      const proto = new Proto({
        fd,
        packageName: 'google.cloud.showcase.v1beta1.MainService',
        allMessages,
        allResourceDatabase: new ResourceDatabase(),
        resourceDatabase: new ResourceDatabase(),
        options,
        commentsMap,
      });
      assert.deepStrictEqual(proto.fileToGenerate, false);
    });
  });
  describe('throw error for misconfigured LRO', () => {
    it('throw error if method returns Operation, but without operation_info option', () => {
      const fd = {} as protos.google.protobuf.FileDescriptorProto;
      fd.name = 'google/cloud/showcase/v1beta1/test.proto';
      fd.package = 'google.cloud.showcase.v1beta1';
      fd.service = [{} as protos.google.protobuf.ServiceDescriptorProto];
      fd.service[0].name = 'service';
      fd.service[0].method = [
        {} as protos.google.protobuf.MethodDescriptorProto,
      ];
      fd.service[0].method[0] =
        {} as protos.google.protobuf.MethodDescriptorProto;
      fd.service[0].method[0].name = 'Test';
      fd.service[0].method[0].outputType = '.google.longrunning.Operation';
      const options: Options = {
        grpcServiceConfig: {} as protos.grpc.service_config.ServiceConfig,
      };
      const allMessages: MessagesMap = {};
      const commentsMap = new CommentsMap([fd]);
      assert.throws(() => {
        new Proto({
          fd,
          packageName: 'google.cloud.showcase.v1beta1',
          allMessages,
          allResourceDatabase: new ResourceDatabase(),
          resourceDatabase: new ResourceDatabase(),
          options,
          commentsMap,
        });
      }, 'rpc "google.cloud.showcase.v1beta1.Test" returns google.longrunning.Operation but is missing option google.longrunning.operation_info');
    });
    it('throw error if method returns Operation, but without operation_info option', () => {
      const fd = {} as protos.google.protobuf.FileDescriptorProto;
      fd.name = 'google/cloud/showcase/v1beta1/test.proto';
      fd.package = 'google.cloud.showcase.v1beta1';
      fd.service = [{} as protos.google.protobuf.ServiceDescriptorProto];
      fd.service[0].name = 'service';
      fd.service[0].method = [
        {} as protos.google.protobuf.MethodDescriptorProto,
      ];
      fd.service[0].method[0] =
        {} as protos.google.protobuf.MethodDescriptorProto;
      fd.service[0].method[0].name = 'Test';
      fd.service[0].method[0].outputType = '.google.longrunning.Operation';
      const options: Options = {
        grpcServiceConfig: {} as protos.grpc.service_config.ServiceConfig,
      };
      fd.service[0].method[0].options =
        {} as protos.google.protobuf.MethodOptions;
      fd.service[0].method[0].options['.google.longrunning.operationInfo'] = {};
      const allMessages: MessagesMap = {};
      const commentsMap = new CommentsMap([fd]);
      assert.throws(() => {
        new Proto({
          fd,
          packageName: 'google.cloud.showcase.v1beta1',
          allMessages,
          allResourceDatabase: new ResourceDatabase(),
          resourceDatabase: new ResourceDatabase(),
          options,
          commentsMap,
        });
      }, /rpc "google.cloud.showcase.v1beta1.Test" has google.longrunning.operation_info but is missing option google.longrunning.operation_info.metadata_type/);
    });
  });

  describe('should add diregapic option for Proto class', () => {
    it('should be false when diregapic is not set', () => {
      const fd = {} as protos.google.protobuf.FileDescriptorProto;
      const proto = new Proto({
        fd,
        packageName: 'google.cloud.example.v1beta1',
        allMessages: {},
        allResourceDatabase: new ResourceDatabase(),
        resourceDatabase: new ResourceDatabase(),
        options: {
          grpcServiceConfig: {} as protos.grpc.service_config.ServiceConfig,
        },
        commentsMap: new CommentsMap([fd]),
      });
      assert.strictEqual(proto.diregapic, undefined);
    });
    it('should be true when diregapic is set', () => {
      const fd = {} as protos.google.protobuf.FileDescriptorProto;
      const proto = new Proto({
        fd,
        packageName: 'google.cloud.example.v1beta1',
        allMessages: {},
        allResourceDatabase: new ResourceDatabase(),
        resourceDatabase: new ResourceDatabase(),
        options: {
          grpcServiceConfig: {} as protos.grpc.service_config.ServiceConfig,
          diregapic: true,
        },
        commentsMap: new CommentsMap([fd]),
      });
      assert.strictEqual(proto.diregapic, true);
    });
  });

  describe('should return auto populated fields for a given method and service', () => {
    it('should return any autopopulated fields in service.yaml that are also in the method', () => {
      const fd = {} as protos.google.protobuf.FileDescriptorProto;
      fd.service = [{} as protos.google.protobuf.ServiceDescriptorProto];
      fd.service[0].name = 'service';
      fd.service[0].method = [
        {} as protos.google.protobuf.MethodDescriptorProto,
      ];
      fd.service[0].method[0] =
        {} as protos.google.protobuf.MethodDescriptorProto;
      fd.service[0].method[0].name = 'Echo';
      const proto = new Proto({
        fd,
        packageName: 'google.showcase.v1beta1',
        allMessages: {},
        allResourceDatabase: new ResourceDatabase(),
        resourceDatabase: new ResourceDatabase(),
        options: {
          serviceYaml: {title: 'google.cloud.example', http: {} as Http, apis: ['example'], publishing: {method_settings: [{selector: 'google.showcase.v1beta1.Echo.Echo', auto_populated_fields: ['request_id']}]}},
          grpcServiceConfig: {} as protos.grpc.service_config.ServiceConfig,
        },
        commentsMap: {
          comments: { "EchoRequest:request_id": { "paramName": "request_id", "paramType": "TYPE_STRING", "comments": [" A random request_id to test autopopulation"], "fieldBehavior": 1, "fieldInfo": { "format": 1 } as protos.google.api.FieldInfo } },
          getCommentsMap: function (): Comments {
            return { "EchoRequest:request_id": { "paramName": "request_id", "paramType": "TYPE_STRING", "comments": [" A random request_id to test autopopulation"], "fieldBehavior": 1, "fieldInfo": { "format": 1 } } } as unknown as Comments
          },
          getServiceComment: function (serviceName: string): string[] {
            return ['not needed']
          },
          getMethodComments: function (serviceName: string, methodName: string): string[] {
            return ['not needed']
          },
          getParamComments: function (messageName: string, fieldName: string): Comment {
            return { "paramName": "request_id", "paramType": "TYPE_STRING", "comments": [" A random request_id to test autopopulation"], "fieldBehavior": 1, "fieldInfo": { "format": 1 } } as Comment;
          }
        },
      });
      // throw new Error(`${JSON.stringify(proto)}`)
      assert.deepStrictEqual(proto.services["service"].method[0].autoPopulatedFields, ['request_id']);
    });

    it('should not return autoPopulated fields if they are unary', () => {
      const fd = {} as protos.google.protobuf.FileDescriptorProto;
      fd.service = [{} as protos.google.protobuf.ServiceDescriptorProto];
      fd.service[0].name = 'service';
      fd.service[0].method = [
        {} as protos.google.protobuf.MethodDescriptorProto,
      ];
      fd.service[0].method[0] =
        {} as protos.google.protobuf.MethodDescriptorProto;
      fd.service[0].method[0].name = 'Echo';
      fd.service[0].method[0].serverStreaming = true;
      const proto = new Proto({
        fd,
        packageName: 'google.showcase.v1beta1',
        allMessages: {},
        allResourceDatabase: new ResourceDatabase(),
        resourceDatabase: new ResourceDatabase(),
        options: {
          serviceYaml: {title: 'google.cloud.example', http: {} as Http, apis: ['example'], publishing: {method_settings: [{selector: 'google.showcase.v1beta1.Echo.Echo', auto_populated_fields: ['request_id']}]}},
          grpcServiceConfig: {} as protos.grpc.service_config.ServiceConfig,
        },
        commentsMap: {
          comments: { "EchoRequest:request_id": { "paramName": "request_id", "paramType": "TYPE_STRING", "comments": [" A random request_id to test autopopulation"], "fieldBehavior": 1, "fieldInfo": { "format": 1 } as protos.google.api.FieldInfo } },
          getCommentsMap: function (): Comments {
            return { "EchoRequest:request_id": { "paramName": "request_id", "paramType": "TYPE_STRING", "comments": [" A random request_id to test autopopulation"], "fieldBehavior": 1, "fieldInfo": { "format": 1 } } } as unknown as Comments
          },
          getServiceComment: function (serviceName: string): string[] {
            return ['not needed']
          },
          getMethodComments: function (serviceName: string, methodName: string): string[] {
            return ['not needed']
          },
          getParamComments: function (messageName: string, fieldName: string): Comment {
            return { "paramName": "request_id", "paramType": "TYPE_STRING", "comments": [" A random request_id to test autopopulation"], "fieldBehavior": 1, "fieldInfo": { "format": 1 } } as Comment;
          }
        },
      });
      assert.deepStrictEqual(proto.services["service"].method[0].autoPopulatedFields, []);
    });

    it('should not return autoPopulated fields if the autopopulated fields do not refer to the correct method', () => {
      const fd = {} as protos.google.protobuf.FileDescriptorProto;
      fd.service = [{} as protos.google.protobuf.ServiceDescriptorProto];
      fd.service[0].name = 'service';
      fd.service[0].method = [
        {} as protos.google.protobuf.MethodDescriptorProto,
      ];
      fd.service[0].method[0] =
        {} as protos.google.protobuf.MethodDescriptorProto;
      fd.service[0].method[0].name = 'TheWrongMethod';
      const proto = new Proto({
        fd,
        packageName: 'google.showcase.v1beta1',
        allMessages: {},
        allResourceDatabase: new ResourceDatabase(),
        resourceDatabase: new ResourceDatabase(),
        options: {
          serviceYaml: {title: 'google.cloud.example', http: {} as Http, apis: ['example'], publishing: {method_settings: [{selector: 'google.showcase.v1beta1.Echo.Echo', auto_populated_fields: ['request_id']}]}},
          grpcServiceConfig: {} as protos.grpc.service_config.ServiceConfig,
        },
        commentsMap: {
          comments: { "EchoRequest:request_id": { "paramName": "request_id", "paramType": "TYPE_STRING", "comments": [" A random request_id to test autopopulation"], "fieldBehavior": 1, "fieldInfo": { "format": 1 } as protos.google.api.FieldInfo } },
          getCommentsMap: function (): Comments {
            return { "EchoRequest:request_id": { "paramName": "request_id", "paramType": "TYPE_STRING", "comments": [" A random request_id to test autopopulation"], "fieldBehavior": 1, "fieldInfo": { "format": 1 } } } as unknown as Comments
          },
          getServiceComment: function (serviceName: string): string[] {
            return ['not needed']
          },
          getMethodComments: function (serviceName: string, methodName: string): string[] {
            return ['not needed']
          },
          getParamComments: function (messageName: string, fieldName: string): Comment {
            return { "paramName": "request_id", "paramType": "TYPE_STRING", "comments": [" A random request_id to test autopopulation"], "fieldBehavior": 1, "fieldInfo": { "format": 1 } } as Comment;
          }
        },
      });
      assert.deepStrictEqual(proto.services["service"].method[0].autoPopulatedFields, []);
    });

    it('should not return autoPopulated fields if the field is required', () => {
      const fd = {} as protos.google.protobuf.FileDescriptorProto;
      fd.service = [{} as protos.google.protobuf.ServiceDescriptorProto];
      fd.service[0].name = 'service';
      fd.service[0].method = [
        {} as protos.google.protobuf.MethodDescriptorProto,
      ];
      fd.service[0].method[0] =
        {} as protos.google.protobuf.MethodDescriptorProto;
      fd.service[0].method[0].name = 'Echo';
      const proto = new Proto({
        fd,
        packageName: 'google.showcase.v1beta1',
        allMessages: {},
        allResourceDatabase: new ResourceDatabase(),
        resourceDatabase: new ResourceDatabase(),
        options: {
          serviceYaml: {title: 'google.cloud.example', http: {} as Http, apis: ['example'], publishing: {method_settings: [{selector: 'google.showcase.v1beta1.Echo.Echo', auto_populated_fields: ['request_id']}]}},
          grpcServiceConfig: {} as protos.grpc.service_config.ServiceConfig,
        },
        commentsMap: {
          comments: { "EchoRequest:request_id": { "paramName": "request_id", "paramType": "TYPE_STRING", "comments": [" A random request_id to test autopopulation"], "fieldBehavior": 2, "fieldInfo": { "format": 1 } as protos.google.api.FieldInfo } },
          getCommentsMap: function (): Comments {
            return { "EchoRequest:request_id": { "paramName": "request_id", "paramType": "TYPE_STRING", "comments": [" A random request_id to test autopopulation"], "fieldBehavior": 2, "fieldInfo": { "format": 1 } } } as unknown as Comments
          },
          getServiceComment: function (serviceName: string): string[] {
            return ['hi!']
          },
          getMethodComments: function (serviceName: string, methodName: string): string[] {
            return ['hi!']
          },
          getParamComments: function (messageName: string, fieldName: string): Comment {
            return { "paramName": "request_id", "paramType": "TYPE_STRING", "comments": [" A random request_id to test autopopulation"], "fieldBehavior": 2, "fieldInfo": { "format": 1 } } as Comment;
          }
        },
      });
      assert.deepStrictEqual(proto.services["service"].method[0].autoPopulatedFields, []);
    });

    it('should not return autoPopulated fields if the format is not UUID', () => {
      const fd = {} as protos.google.protobuf.FileDescriptorProto;
      fd.service = [{} as protos.google.protobuf.ServiceDescriptorProto];
      fd.service[0].name = 'service';
      fd.service[0].method = [
        {} as protos.google.protobuf.MethodDescriptorProto,
      ];
      fd.service[0].method[0] =
        {} as protos.google.protobuf.MethodDescriptorProto;
      fd.service[0].method[0].name = 'Echo';
      const proto = new Proto({
        fd,
        packageName: 'google.showcase.v1beta1',
        allMessages: {},
        allResourceDatabase: new ResourceDatabase(),
        resourceDatabase: new ResourceDatabase(),
        options: {
          serviceYaml: {title: 'google.cloud.example', http: {} as Http, apis: ['example'], publishing: {method_settings: [{selector: 'google.showcase.v1beta1.Echo.Echo', auto_populated_fields: ['request_id']}]}},
          grpcServiceConfig: {} as protos.grpc.service_config.ServiceConfig,
        },
        commentsMap: {
          comments: { "EchoRequest:request_id": { "paramName": "request_id", "paramType": "TYPE_STRING", "comments": [" A random request_id to test autopopulation"], "fieldBehavior": 1, "fieldInfo": { "format": 2 } as protos.google.api.FieldInfo } },
          getCommentsMap: function (): Comments {
            return { "EchoRequest:request_id": { "paramName": "request_id", "paramType": "TYPE_STRING", "comments": [" A random request_id to test autopopulation"], "fieldBehavior": 1, "fieldInfo": { "format": 2 } } } as unknown as Comments
          },
          getServiceComment: function (serviceName: string): string[] {
            return ['hi!']
          },
          getMethodComments: function (serviceName: string, methodName: string): string[] {
            return ['hi!']
          },
          getParamComments: function (messageName: string, fieldName: string): Comment {
            return { "paramName": "request_id", "paramType": "TYPE_STRING", "comments": [" A random request_id to test autopopulation"], "fieldBehavior": 1, "fieldInfo": { "format": 2 } } as Comment;
          }
        },
      });
      assert.deepStrictEqual(proto.services["service"].method[0].autoPopulatedFields, []);
    });
  });

  describe('should support pagination for non-gRPC APIs, diregapic mode', () => {
    it('should be page field if diregapic mode and use "max_results" as field name', () => {
      const fd = {} as protos.google.protobuf.FileDescriptorProto;
      fd.name = 'google/cloud/showcase/v1beta1/test.proto';
      fd.package = 'google.cloud.showcase.v1beta1';
      fd.service = [{} as protos.google.protobuf.ServiceDescriptorProto];
      fd.service[0].name = 'service';
      fd.service[0].method = [
        {} as protos.google.protobuf.MethodDescriptorProto,
      ];
      fd.service[0].method[0] =
        {} as protos.google.protobuf.MethodDescriptorProto;
      fd.service[0].method[0].name = 'List';
      fd.service[0].method[0].outputType =
        '.google.cloud.showcase.v1beta1.AddressList';
      fd.service[0].method[0].inputType =
        '.google.cloud.showcase.v1beta1.ListAddressesRequest';

      fd.messageType = [{} as protos.google.protobuf.DescriptorProto];
      fd.messageType[0] = {} as protos.google.protobuf.DescriptorProto;
      fd.messageType[1] = {} as protos.google.protobuf.DescriptorProto;

      fd.messageType[0].name = 'AddressList';
      fd.messageType[1].name = 'ListAddressesRequest';

      fd.messageType[0].field = [
        {} as protos.google.protobuf.FieldDescriptorProto,
      ];
      fd.messageType[0].field[0] =
        {} as protos.google.protobuf.FieldDescriptorProto;
      fd.messageType[0].field[0].name = 'next_page_token';
      fd.messageType[0].field[0].label = 3; // LABEL_REPEATED
      fd.messageType[0].field[0].type = 11; // TYPE_MESSAGE
      fd.messageType[0].field[0].typeName =
        '.google.cloud.showcase.v1beta1.Address';
      fd.messageType[1].field = [
        {} as protos.google.protobuf.FieldDescriptorProto,
      ];
      fd.messageType[1].field[0] =
        {} as protos.google.protobuf.FieldDescriptorProto;
      fd.messageType[1].field[0].name = 'max_results';
      fd.messageType[1].field[1] =
        {} as protos.google.protobuf.FieldDescriptorProto;
      fd.messageType[1].field[1].name = 'page_token';
      const options: Options = {
        grpcServiceConfig: {} as protos.grpc.service_config.ServiceConfig,
        diregapic: true,
      };
      const allMessages: MessagesMap = {};
      fd.messageType
        ?.filter(message => message.name)
        .forEach(message => {
          allMessages['.' + fd.package! + '.' + message.name!] = message;
        });
      const commentsMap = new CommentsMap([fd]);
      const proto = new Proto({
        fd,
        packageName: 'google.cloud.showcase.v1beta1',
        allMessages,
        allResourceDatabase: new ResourceDatabase(),
        resourceDatabase: new ResourceDatabase(),
        options,
        commentsMap,
      });
      assert.deepStrictEqual(
        proto.services['service'].method[0].pagingFieldName,
        'next_page_token'
      );
      assert.deepStrictEqual(proto.services['service'].paging[0].name, 'List');
      assert.deepStrictEqual(
        proto.services['service'].paging[0].inputType,
        '.google.cloud.showcase.v1beta1.ListAddressesRequest'
      );
      assert.deepStrictEqual(
        proto.services['service'].paging[0].outputType,
        '.google.cloud.showcase.v1beta1.AddressList'
      );
      assert.deepStrictEqual(
        proto.services['service'].paging[0].pagingResponseType,
        '.google.cloud.showcase.v1beta1.Address'
      );
    });
    it('should not be page field if api is not google discovery api but use "max_result"', () => {
      const fd = {} as protos.google.protobuf.FileDescriptorProto;
      fd.name = 'google/cloud/showcase/v1beta1/test.proto';
      fd.package = 'google.cloud.showcase.v1beta1';
      fd.service = [{} as protos.google.protobuf.ServiceDescriptorProto];
      fd.service[0].name = 'service';
      fd.service[0].method = [
        {} as protos.google.protobuf.MethodDescriptorProto,
      ];
      fd.service[0].method[0] =
        {} as protos.google.protobuf.MethodDescriptorProto;
      fd.service[0].method[0].name = 'List';
      fd.service[0].method[0].outputType =
        '.google.cloud.showcase.v1beta1.AddressList';
      fd.service[0].method[0].inputType =
        '.google.cloud.showcase.v1beta1.ListAddressesRequest';

      fd.messageType = [{} as protos.google.protobuf.DescriptorProto];
      fd.messageType[0] = {} as protos.google.protobuf.DescriptorProto;
      fd.messageType[1] = {} as protos.google.protobuf.DescriptorProto;

      fd.messageType[0].name = 'AddressList';
      fd.messageType[1].name = 'ListAddressesRequest';

      fd.messageType[0].field = [
        {} as protos.google.protobuf.FieldDescriptorProto,
      ];
      fd.messageType[0].field[0] =
        {} as protos.google.protobuf.FieldDescriptorProto;
      fd.messageType[0].field[0].name = 'next_page_token';
      fd.messageType[0].field[0].label = 3; // LABEL_REPEATED
      fd.messageType[1].field = [
        {} as protos.google.protobuf.FieldDescriptorProto,
      ];
      fd.messageType[1].field[0] =
        {} as protos.google.protobuf.FieldDescriptorProto;
      fd.messageType[1].field[0].name = 'max_results';
      fd.messageType[1].field[1] =
        {} as protos.google.protobuf.FieldDescriptorProto;
      fd.messageType[1].field[1].name = 'page_token';
      const options: Options = {
        grpcServiceConfig: {} as protos.grpc.service_config.ServiceConfig,
      };
      const allMessages: MessagesMap = {};
      const commentsMap = new CommentsMap([fd]);
      const proto = new Proto({
        fd,
        packageName: 'google.cloud.showcase.v1beta1',
        allMessages,
        allResourceDatabase: new ResourceDatabase(),
        resourceDatabase: new ResourceDatabase(),
        options,
        commentsMap,
      });
      assert.deepStrictEqual(
        proto.services['service'].method[0].pagingFieldName,
        undefined
      );
      assert.deepStrictEqual(proto.services['service'].paging.length, 0);
    });
  });
});
