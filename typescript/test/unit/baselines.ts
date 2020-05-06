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

import {describe} from 'mocha';
import {runBaselineTest, initBaselineTest} from '../util';

describe('Baseline tests', () => {
  initBaselineTest();

  runBaselineTest({
    baselineName: 'dlp',
    outputDir: '.test-out-dlp',
    protoPath: 'google/privacy/dlp/v2/*.proto',
    useCommonProto: true,
  });

  runBaselineTest({
    baselineName: 'tasks',
    outputDir: '.test-out-tasks',
    protoPath: 'google/cloud/tasks/v2/*.proto',
    useCommonProto: false,
  });

  runBaselineTest({
    baselineName: 'texttospeech',
    outputDir: '.test-out-texttospeech',
    protoPath: 'google/cloud/texttospeech/v1/*.proto',
    useCommonProto: false,
    grpcServiceConfig:
      'google/cloud/texttospeech/v1/texttospeech_grpc_service_config.json',
    packageName: '@google-cloud/text-to-speech',
  });

  runBaselineTest({
    baselineName: 'kms',
    outputDir: '.test-out-kms',
    protoPath: 'google/cloud/kms/v1/*.proto',
    useCommonProto: false,
    iamService: true,
  });

  runBaselineTest({
    baselineName: 'monitoring',
    outputDir: '.test-out-monitoring',
    protoPath: 'google/monitoring/v3/*.proto',
    useCommonProto: false,
    mainServiceName: 'monitoring',
  });

  runBaselineTest({
    baselineName: 'redis',
    outputDir: '.test-out-redis',
    protoPath: 'google/cloud/redis/v1beta1/*.proto',
    useCommonProto: true,
  });

  runBaselineTest({
    baselineName: 'showcase',
    outputDir: '.test-out-showcase',
    protoPath: 'google/showcase/v1beta1/*.proto',
    useCommonProto: false,
    mainServiceName: 'ShowcaseService',
    template: 'typescript_gapic;typescript_packing_test',
  });

  runBaselineTest({
    baselineName: 'asset',
    outputDir: '.test-out-asset',
    protoPath:
      'google/cloud/asset/v1/*.proto;google/cloud/orgpolicy/v1/orgpolicy.proto;google/identity/accesscontextmanager/v1/*.proto;google/identity/accesscontextmanager/type/*.proto',
    useCommonProto: true,
    grpcServiceConfig:
      'google/cloud/asset/v1/cloudasset_grpc_service_config.json',
    packageName: '@google-cloud/asset',
  });

  runBaselineTest({
    baselineName: 'translate',
    outputDir: '.test-out-translate',
    protoPath: 'google/cloud/translate/v3beta1/*.proto',
    useCommonProto: true,
  });

  runBaselineTest({
    baselineName: 'bigquery-storage',
    outputDir: '.test-out-bigquery-storage',
    protoPath: 'google/cloud/bigquery/storage/v1beta1/*.proto',
    useCommonProto: false,
  });

  runBaselineTest({
    baselineName: 'logging',
    outputDir: '.test-out-logging',
    protoPath: 'google/logging/v2/*.proto',
    useCommonProto: true,
    bundleConfig: 'google/logging/v2/logging_gapic.yaml',
    mainServiceName: 'LoggingService',
  });

  runBaselineTest({
    baselineName: 'videointelligence',
    outputDir: '.test-out-videointelligence',
    protoPath: 'google/cloud/videointelligence/v1/*.proto',
    useCommonProto: true,
  });

  runBaselineTest({
    baselineName: 'disable-packing-test',
    outputDir: '.test-out-disable-packing-test',
    protoPath: 'google/showcase/v1beta1/*.proto',
    useCommonProto: false,
    mainServiceName: 'ShowcaseService',
    template: 'typescript_gapic',
  });
});
