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

import * as objectHash from 'object-hash';
import * as plugin from '../../../pbjs-genfiles/plugin';

export const defaultNonIdempotentRetryCodesName = 'non_idempotent';
export const defaultNonIdempotentCodes: plugin.google.rpc.Code[] = [];
export const defaultIdempotentRetryCodesName = 'idempotent';
export const defaultIdempotentCodes = [
  plugin.google.rpc.Code.DEADLINE_EXCEEDED,
  plugin.google.rpc.Code.UNAVAILABLE,
];
export const defaultParametersName = 'default';
export const defaultParameters = {
  initial_retry_delay_millis: 100,
  retry_delay_multiplier: 1.3,
  max_retry_delay_millis: 60000,
  // note: the following four parameters are unused but currently required by google-gax.
  // setting them to some big safe default values.
  initial_rpc_timeout_millis: 60000,
  rpc_timeout_multiplier: 1.0,
  max_rpc_timeout_millis: 60000,
  total_timeout_millis: 600000,
};

export class RetryableCodeMap {
  codeEnumMapping: {
    [index: string]: string;
  };
  uniqueCodesNamesMap: {
    [uniqueName: string]: string;
  };
  prettyCodesNamesMap: {
    [prettyName: string]: string[];
  };
  uniqueParamsNamesMap: {
    [uniqueName: string]: string;
  };
  prettyParamNamesMap: {
    [prettyName: string]: {};
  };
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
      // toSnakeCase() splits on uppercase and we only want to split on
      // underscores since all enum codes are uppercase.
      .toLowerCase()
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
