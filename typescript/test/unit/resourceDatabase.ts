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
import { ResourceDatabase } from '../../src/schema/resourceDatabase';
import { describe, it, beforeEach, afterEach } from 'mocha';
import * as assert from 'assert';

describe('ResourceDatabase', () => {
  let warnings: string[] = [];
  const savedWarn = console.warn;
  const errorLocation = 'ERROR LOCATION';
  const resourceName = 'Example';
  const resourceType = 'examples.googleapis.com/Example';
  const resourcePattern = 'locations/{location}/examples/{example}';
  const resourcePattern2 = 'project/{project}/examples/{example}';
  const resourceParameters = ['location', 'example'];
  const parentResourceName = 'Location';
  const parentResourceType = 'locations.googleapis.com/Location';
  const parentResourcePattern = 'locations/{location}';

  beforeEach(() => {
    warnings = [];
    console.warn = (message: string) => {
      warnings.push(message);
    };
  });

  afterEach(() => {
    console.warn = savedWarn;
  });

  it('warns when registering resource with no type', () => {
    const rdb = new ResourceDatabase();
    const resource: plugin.google.api.IResourceDescriptor = {
      type: '',
      pattern: [resourcePattern],
    };

    rdb.registerResource(resource, errorLocation);
    assert(warnings.filter(w => w.includes(errorLocation)).length > 0);
  });

  it('warns when registering resource with malformed type', () => {
    const rdb = new ResourceDatabase();
    const resource: plugin.google.api.IResourceDescriptor = {
      type: 'examples.googleapis.com',
      pattern: [resourcePattern],
    };

    rdb.registerResource(resource, errorLocation);
    assert(warnings.filter(w => w.includes(errorLocation)).length > 0);
  });

  it('warns when registering resource with no pattern', () => {
    const rdb = new ResourceDatabase();
    const resource: plugin.google.api.IResourceDescriptor = {
      type: resourceType,
      pattern: [],
    };

    rdb.registerResource(resource, errorLocation);
    assert(warnings.filter(w => w.includes(errorLocation)).length > 0);
  });

  it('can register multi-pattern resource properly', () => {
    const rdb = new ResourceDatabase();
    const resource: plugin.google.api.IResourceDescriptor = {
      type: resourceType,
      pattern: [resourcePattern, resourcePattern2],
    };

    rdb.registerResource(resource, errorLocation);
    const resourceByType = rdb.getResourceByType(resourceType);
    assert.deepStrictEqual(resourceByType!.pattern, [
      resourcePattern,
      resourcePattern2,
    ]);
    const registeredResource1 = rdb.getResourceByPattern(resourcePattern);
    assert(registeredResource1);
    const registeredResource2 = rdb.getResourceByPattern(resourcePattern2);
    assert(registeredResource2);
    assert.strictEqual(registeredResource1!.type, resourceType);
    assert.strictEqual(registeredResource2!.type, resourceType);
    assert.strictEqual(registeredResource1!.name, 'location_example');
    assert.strictEqual(registeredResource2!.name, 'project_example');
    assert.strictEqual(warnings.length, 0);
  });

  it('can get registered resource by type', () => {
    const rdb = new ResourceDatabase();
    const resource: plugin.google.api.IResourceDescriptor = {
      type: resourceType,
      pattern: [resourcePattern],
    };

    rdb.registerResource(resource, errorLocation);
    const registeredResource = rdb.getResourceByType(resourceType);
    assert(registeredResource);
    assert.strictEqual(registeredResource!.type, resourceType);
    assert.strictEqual(registeredResource!.name, resourceName);
    assert.deepStrictEqual(registeredResource!.pattern, [resourcePattern]);
    assert.strictEqual(warnings.length, 0);
  });

  it('can get registered resource by pattern', () => {
    const rdb = new ResourceDatabase();
    const resource: plugin.google.api.IResourceDescriptor = {
      type: resourceType,
      pattern: [resourcePattern],
    };

    rdb.registerResource(resource, errorLocation);
    const registeredResource = rdb.getResourceByPattern(resourcePattern);
    assert(registeredResource);
    assert.strictEqual(registeredResource!.type, resourceType);
    assert.strictEqual(registeredResource!.name, resourceName);
    assert.deepStrictEqual(registeredResource!.pattern, [resourcePattern]);
    assert.strictEqual(warnings.length, 0);
  });

  it('extracts parameters from pattern', () => {
    const rdb = new ResourceDatabase();
    const resource: plugin.google.api.IResourceDescriptor = {
      type: resourceType,
      pattern: [resourcePattern],
    };

    rdb.registerResource(resource, errorLocation);
    const registeredResource = rdb.getResourceByType(resourceType);
    assert(registeredResource);
    assert.deepStrictEqual(registeredResource!.params, resourceParameters);
    assert.strictEqual(warnings.length, 0);
  });

  it('warns if cannot find resource by name', () => {
    const rdb = new ResourceDatabase();

    const notFoundResource = rdb.getResourceByType(resourceType, errorLocation);
    assert.strictEqual(notFoundResource, undefined);
    assert(warnings.filter(w => w.includes(errorLocation)).length > 0);
  });

  it('warns if cannot find resource by type', () => {
    const rdb = new ResourceDatabase();

    const notFoundResource = rdb.getResourceByType(resourceType, errorLocation);
    assert.strictEqual(notFoundResource, undefined);
    assert(warnings.filter(w => w.includes(errorLocation)).length > 0);
  });

  it('warns if cannot find resource by pattern', () => {
    const rdb = new ResourceDatabase();

    const notFoundResource = rdb.getResourceByPattern(
      resourcePattern,
      errorLocation
    );
    assert.strictEqual(notFoundResource, undefined);
    assert(warnings.filter(w => w.includes(errorLocation)).length > 0);
  });

  it('returns known parent resources', () => {
    const rdb = new ResourceDatabase();
    const parentResource: plugin.google.api.IResourceDescriptor = {
      type: parentResourceType,
      pattern: [parentResourcePattern],
    };
    const resource: plugin.google.api.IResourceDescriptor = {
      type: resourceType,
      pattern: [resourcePattern],
    };
    rdb.registerResource(parentResource);
    rdb.registerResource(resource);

    const parentResources = rdb.getParentResourcesByChildType(resourceType);
    assert.strictEqual(parentResources.length, 2);
    assert.strictEqual(parentResources[0].name, parentResourceName);
    assert.strictEqual(parentResources[1].name, resourceName);
    assert.strictEqual(warnings.length, 0);
  });

  it('can parse different patterns into parameters', () => {
    const rdb = new ResourceDatabase();
    const resource: plugin.google.api.IResourceDescriptor = {
      type: resourceType,
      pattern: [
        'lettersdigits/{abc123}/underscores/{snake_case}/trailing/{trailing=**}',
      ],
    };

    rdb.registerResource(resource, errorLocation);
    const registeredResource = rdb.getResourceByType(resourceType);
    assert(registeredResource);
    assert.deepStrictEqual(registeredResource!.params, [
      'snake_case',
      'trailing',
    ]);
    assert.strictEqual(warnings.length, 0);
  });
});
