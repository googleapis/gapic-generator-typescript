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

import * as plugin from '../../pbjs-genfiles/plugin';

export function commonPrefix(strings: string[]): string {
  if (strings.length === 0) {
    return '';
  }
  let result = '';
  while (result.length < strings[0].length) {
    // try one more character
    const next = result + strings[0][result.length];
    if (strings.every(str => str.startsWith(next))) {
      result = next;
    } else {
      break;
    }
  }
  return result;
}

// Convert a string Duration, e.g. "600s", to a proper protobuf type since
// protobufjs does not support it at this moment.
export function duration(text: string): plugin.google.protobuf.Duration {
  const multipliers: { [suffix: string]: number } = {
    s: 1,
    m: 60,
    h: 60 * 60,
    d: 60 * 60 * 24,
  };
  const match = text.match(/^([\d.]+)([smhd])$/);
  if (!match) {
    throw new Error(`Cannot parse "${text}" into google.protobuf.Duration.`);
  }
  const float = Number(match[1]);
  const suffix = match[2];
  const multiplier = multipliers[suffix];
  const seconds = float * multiplier;
  const floor = Math.floor(seconds);
  const frac = seconds - floor;
  const result = plugin.google.protobuf.Duration.fromObject({
    seconds: floor,
    nanos: frac * 1e9,
  });
  return result;
}

// Convert a Duration to (possibly fractional) seconds.
export function seconds(duration: plugin.google.protobuf.IDuration): number {
  return Number(duration.seconds || 0) + Number(duration.nanos || 0) * 1e-9;
}

// Convert a Duration to (possibly fractional) milliseconds.
export function milliseconds(
  duration: plugin.google.protobuf.IDuration
): number {
  return (
    Number(duration.seconds || 0) * 1000 + Number(duration.nanos || 0) * 1e-6
  );
}

String.prototype.capitalize = function(this: string): string {
  if (this.length === 0) {
    return this;
  }
  return this[0].toUpperCase() + this.slice(1);
};

String.prototype.words = function(this: string): string[] {
  // split on spaces, non-alphanumeric, or capital letters
  return this.split(/(?=[A-Z])|[\s\W_]+/)
    .filter(w => w.length > 0)
    .map(w => w.toLowerCase());
};

String.prototype.toCamelCase = function(this: string): string {
  const words = this.words();
  if (words.length === 0) {
    return this;
  }
  const result = [words[0]];
  result.push(...words.slice(1).map(w => w.capitalize()));
  return result.join('');
};

String.prototype.toPascalCase = function(this: string): string {
  const words = this.words();
  if (words.length === 0) {
    return this;
  }
  const result = words.map(w => w.capitalize());
  return result.join('');
};

String.prototype.toKebabCase = function(this: string): string {
  const words = this.words();
  if (words.length === 0) {
    return this;
  }
  return words.join('-');
};

String.prototype.toSnakeCase = function(this: string): string {
  const words = this.words();
  if (words.length === 0) {
    return this;
  }
  return words.join('_');
};

Array.prototype.camelCaseBeforeDot = function(
  this: string[],
  joiner: string
): string {
  if (this.length <= 1) {
    return this.toString().toCamelCase();
  }
  const res = this.slice(0, -1).map(w => w.toCamelCase());
  return res.join(joiner) + joiner + this[this.length - 1];
};
