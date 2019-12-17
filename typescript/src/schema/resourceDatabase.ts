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

export interface ResourceDescriptor
  extends plugin.google.api.IResourceDescriptor {
  name: string;
  params: string[];
}

export class ResourceDatabase {
  private patterns: { [pattern: string]: ResourceDescriptor };
  private types: { [type: string]: ResourceDescriptor };

  constructor() {
    this.patterns = {};
    this.types = {};
  }

  registerResource(
    resource: plugin.google.api.IResourceDescriptor | undefined,
    errorLocation?: string
  ) {
    if (!resource) {
      return;
    }

    if (!resource.type) {
      if (errorLocation) {
        console.warn(
          `Warning: ${errorLocation} refers to a resource which does not have a type: ${resource}`
        );
      }
      return;
    }

    const arr = resource.type.match(/\/([^.]+)$/);
    if (!arr?.[1]) {
      if (errorLocation) {
        console.warn(
          `Warning: ${errorLocation} refers to a resource which does not have a proper name: ${resource}`
        );
      }
      return;
    }
    const name = arr[1];

    const pattern = resource.pattern;
    if (!pattern?.[0]) {
      if (errorLocation) {
        console.warn(
          `Warning: ${errorLocation} refers to a resource which does not have a proper pattern: ${resource}`
        );
      }
      return;
    }
    const params = pattern[0].match(/{[a-zA-Z]+}/g) || [];
    for (let i = 0; i < params.length; i++) {
      params[i] = params[i].replace('{', '').replace('}', '');
    }

    const resourceDescriptor: ResourceDescriptor = Object.assign(
      {
        name,
        params,
      },
      resource
    );

    this.patterns[pattern?.[0]] = resourceDescriptor;
    this.types[resourceDescriptor.type!] = resourceDescriptor;
  }

  getResourceByType(
    type: string | null | undefined,
    errorLocation?: string
  ): ResourceDescriptor | undefined {
    if (!type) {
      return undefined;
    }
    if (!this.types[type]) {
      if (errorLocation) {
        console.warn(
          `Warning: ${errorLocation} refers to an unknown resource: ${type}`
        );
      }
      return undefined;
    }
    return this.types[type];
  }

  getResourceByPattern(
    pattern: string | null | undefined,
    errorLocation?: string
  ): ResourceDescriptor | undefined {
    if (!pattern) {
      return undefined;
    }
    if (!this.patterns[pattern]) {
      if (errorLocation) {
        console.warn(
          `Warning: ${errorLocation} refers to an unknown resource: ${pattern}`
        );
      }
      return undefined;
    }
    return this.patterns[pattern];
  }

  getParentResourcesByChildType(
    childType: string | null | undefined,
    errorLocation?: string
  ): ResourceDescriptor[] {
    // childType looks like "datacatalog.googleapis.com/EntryGroup"
    // its pattern would be like "projects/{project}/locations/{location}/entryGroups/{entry_group}"
    const result: ResourceDescriptor[] = [];

    if (!childType) {
      return result;
    }

    const childResource = this.getResourceByType(childType, errorLocation);
    if (!childResource) {
      return result;
    }

    const childPattern = childResource.pattern?.[0];
    if (!childPattern) {
      return result;
    }

    let pattern = '';
    for (const segment of childPattern.split('/')) {
      if (pattern !== '') {
        pattern += '/';
      }
      pattern += segment;
      const parent = this.getResourceByPattern(pattern);
      if (parent) {
        result.push(parent);
      }
    }

    return result;
  }
}
