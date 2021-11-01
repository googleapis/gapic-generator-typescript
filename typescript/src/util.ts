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

import * as protos from '../../protos';

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
export function duration(text: string): protos.google.protobuf.Duration {
  const multipliers: {[suffix: string]: number} = {
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
  const result = protos.google.protobuf.Duration.fromObject({
    seconds: floor,
    nanos: frac * 1e9,
  });
  return result;
}

// Convert a Duration to (possibly fractional) seconds.
export function seconds(duration: protos.google.protobuf.IDuration): number {
  return Number(duration.seconds || 0) + Number(duration.nanos || 0) * 1e-9;
}

// Convert a Duration to (possibly fractional) milliseconds.
export function milliseconds(
  duration: protos.google.protobuf.IDuration
): number {
  return (
    Number(duration.seconds || 0) * 1000 + Number(duration.nanos || 0) * 1e-6
  );
}

export function isDigit(value: string): boolean {
  return /^\d+$/.test(value);
}

String.prototype.capitalize = function (this: string): string {
  if (this.length === 0) {
    return this;
  }
  return this[0].toUpperCase() + this.slice(1);
};

String.prototype.words = function (this: string): string[] {
  // split on spaces, non-alphanumeric, or capital letters
  return this.split(/(?=[A-Z])|[\s\W_]+/)
    .filter(w => w.length > 0)
    .map(w => w.toLowerCase());
};

String.prototype.toCamelCase = function (this: string): string {
  const words = this.words();
  if (words.length === 0) {
    return this;
  }
  const result = [words[0]];
  result.push(
    ...words.slice(1).map(w => {
      if (isDigit(w)) {
        return '_' + w;
      }
      return w.capitalize();
    })
  );
  return result.join('');
};

String.prototype.toPascalCase = function (this: string): string {
  const words = this.words();
  if (words.length === 0) {
    return this;
  }
  const result = words.map(w => w.capitalize());
  return result.join('');
};

String.prototype.toKebabCase = function (this: string): string {
  const words = this.words();
  if (words.length === 0) {
    return this;
  }
  return words.join('-');
};

String.prototype.toSnakeCase = function (this: string): string {
  const words = this.words();
  if (words.length === 0) {
    return this;
  }
  return words.join('_');
};

String.prototype.replaceAll = function (
  this: string,
  search: string,
  replacement: string
) {
  return this.split(search).join(replacement);
};

Array.prototype.toCamelCaseString = function (
  this: string[],
  joiner: string
): string {
  return this.map(part => part.toCamelCase()).join(joiner);
};

Array.prototype.toSnakeCaseString = function (
  this: string[],
  joiner: string
): string {
  return this.map(part => part.toSnakeCase()).join(joiner);
};

export function getResourceNameByPattern(pattern: string): string {
  const elements = pattern.split('/');
  const name = [];
  // Multi pattern like: `projects/{project}/cmekSettings`, we need to append `cmekSettings` to the name.
  // Or it will be duplicate with `project/{project}`
  // Iterate the elements, if it comes in pairs: user/{userId}, we take `userId` as part of the name.
  // if it comes as `profile` with no following `/{profile_id}`, we take `profile` as part of the name.
  // So for pattern: `user/{user_id}/profile/blurbs/{blurb_id}`, name will be `userId_profile_blurbId`
  while (elements.length > 0) {
    const eleName = elements.shift();
    if (elements.length === 0) {
      name.push(eleName);
      break;
    } else {
      const nextEle = elements[0];
      if (nextEle.match(/(?<=\{).*?(?=(?:=.*?)?\})/g)) {
        elements.shift();
        const params = nextEle.match(/(?<=\{).*?(?=(?:=.*?)?\})/g);
        if (params!.length === 1) {
          name.push(params![0]);
        } else {
          // For non-slash resource 'organization/{organization}/tasks/{task_id}{task_name}/result'
          // Take parameters that match pattern [{task_id}, {task_name}] and combine them as part of the name.
          const params = nextEle.match(/(?<=\{).*?(?=(?:=.*?)?\})/g);
          name.push(params!.join('_'));
        }
      } else {
        if (eleName!.match(/{[a-zA-Z_]+(?:=.*?)?}/g)) {
          continue;
        } else {
          name.push(eleName);
        }
      }
    }
  }
  return name.join('_');
}

export function isStar(pattern: string): boolean {
  return pattern === '*';
}

export function isDoubleStar(pattern: string): boolean {
  return pattern === '**';
}

// This intakes an array of strings and checks if there is at least one and only one named segment.
// Named segments can be resource names or wildcards.
export function checkIfArrayContainsOnlyOneNamedSegment(
  pattern: string[]
): boolean {
  let countOfNamedSegments = 0;
  // Checks that resources are named
  const regexNamed = new RegExp(/^.+=.+/);
  const regexWildcard = new RegExp(/^{[a-zA-Z\d-]+}/);
  pattern.forEach(element => {
    if (regexNamed.test(element) || regexWildcard.test(element)) {
      countOfNamedSegments++;
    }
  });
  return countOfNamedSegments === 1;
}

// This takes in a path template segment and converts it into regex.
export function convertSegmentToRegex(pattern: string): string {
  const curlyBraceRegex = new RegExp(/{(.[^}]+)/);
  const namedResourceRegex = new RegExp(/=/);
  const getBeforeAfterEqualsSign = new RegExp(/([^=]*)=(.*)/);
  if (isStar(pattern) || isStar(pattern.replaceAll('}', ''))) {
    return '[^/]+';
  }
  // If segment is a double-wildcard, then it will 'eat' the precending '/'.
  else if (isDoubleStar(pattern) || isDoubleStar(pattern.replaceAll('}', ''))) {
    return '(?:/.*)?';
  }
  // If segment has a starting curly brace, and is not named, then it is a wildcard.
  else if (curlyBraceRegex.test(pattern) && !namedResourceRegex.test(pattern)) {
    // Strip any curly braces
    const newPattern = pattern.replaceAll('}', '').replaceAll('{', '');
    return '(?<' + newPattern + '>[^/]+)';
  }
  // If segment contains named resource, then the resource could be a wildcard or
  // a collectionId
  else if (curlyBraceRegex.test(pattern) && namedResourceRegex.test(pattern)) {
    // Strip any curly braces
    const newPattern = pattern.replaceAll('}', '').replaceAll('{', '');
    const elements = newPattern.match(getBeforeAfterEqualsSign);
    const name = '(?<' + elements![1] + '>';
    const resource = elements![2];
    if (isStar(resource)) {
      return name + '[^/]+)';
    } else if (isDoubleStar(resource)) {
      return name + '(?:/.*)?' + ')';
    } else {
      return name + resource + ')';
    }
  }
  // If segment is just a CollectionId, then the regex equivalent is itself.
  else if (pattern.match(/[a-zA-Z_-]+/)) {
    return pattern;
  } else {
    return '';
  }
}

// This takes in a full path template and converts it into regex.
export function convertTemplateToRegex(pattern: string): string {
  const splitStrings = pattern.split('/');
  const regexStrings: string[] = [];
  while (splitStrings.length > 0) {
    const item = splitStrings.shift();
    const itemToRegex = convertSegmentToRegex(item!);
    // If item is a double-wildcard, then do not include a '/' separator as a double-wildcard may be empty.
    const doubleWildcardRegex = new RegExp(/\*\*/);
    if (!doubleWildcardRegex.test(item!)) {
      regexStrings.push('/');
    }
    regexStrings.push(itemToRegex);
  }
  let helperString = regexStrings.join('');
  // Check if string begins with separator
  const separatorRegex = new RegExp(/^\//);
  if (separatorRegex.test(helperString)) {
    helperString = helperString.substring(1);
  }
  return helperString;
}

// This intakes a path template and returns an array where the first element is the full named
// segment, the second element is the name of the segment, the third element is the segment itself,
// and the fourth element is the named capture regex of the named segement.
// If the path template does not contain exactly one named segment, this function will return an empty array.
export function getNamedSegment(pattern: string): string[] {
  // Named segment in path template will always be contained within curly braces, e.g. '{}'
  const curlyBraceRegex = new RegExp(/[^{}]+(?=})/);
  // Named segment may just be a collection id
  const collectionIdRegex = new RegExp(/{.*}/);
  const namedSegmentWithoutCurlyBraces = pattern.match(curlyBraceRegex);
  const namedSegmentWithCurlyBraces = pattern.match(collectionIdRegex);
  if (
    !namedSegmentWithoutCurlyBraces ||
    !namedSegmentWithCurlyBraces ||
    !checkIfArrayContainsOnlyOneNamedSegment(namedSegmentWithCurlyBraces)
  ) {
    return [];
  }
  const namedSegment = [];
  // This contains the full named segment.
  namedSegment.push(namedSegmentWithoutCurlyBraces[0]);
  // This extracts the name from the named segment.
  const nameOfSegmentRegex = new RegExp(/^(.*?)=/);
  const nameOfSegment = namedSegmentWithoutCurlyBraces[0].match(
    nameOfSegmentRegex
  );
  // // If the segment is just a collection id (e.g., {database}), then the name of the segment is itself, and the segment is a wildcard.
  if (!nameOfSegmentRegex.test(namedSegmentWithoutCurlyBraces[0])) {
    namedSegment.push(namedSegmentWithoutCurlyBraces[0]);
    namedSegment.push('*');
    namedSegment.push('[^/]+');
  } else {
    namedSegment.push(nameOfSegment![1]);
    // This extracts the segment from the named segement.
    const extractNameRegex = new RegExp(nameOfSegment![1] + '=(.*)');
    const segment = namedSegmentWithoutCurlyBraces[0].match(
      extractNameRegex
    )![1];
    namedSegment.push(segment);
    // This converts the full named segment into regex.
    // Special case for double wildcard in a named segment as we
    // do want to capture it for a named segment.
    let resourceRegex = convertTemplateToRegex(segment);
    if (isDoubleStar(segment) || isDoubleStar(segment.replaceAll('}', ''))) {
      resourceRegex = '.*';
    }
    const fullRegex = '(?<' + nameOfSegment![1] + '>' + resourceRegex + ')';
    namedSegment.push(fullRegex);
  }
  return namedSegment;
}
