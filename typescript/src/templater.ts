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

import * as fs from 'fs';
import * as nunjucks from 'nunjucks';
import * as path from 'path';
import * as util from 'util';

import * as plugin from '../../pbjs-genfiles/plugin';

import { API } from './schema/api';

const commonParameters: { [name: string]: string } = {
  copyrightYear: new Date().getFullYear().toString(),
};

const readDir = util.promisify(fs.readdir);
const fsstat = util.promisify(fs.stat);

async function recursiveFileList(
  basePath: string,
  nameRegex: RegExp
): Promise<string[]> {
  const dirQueue: string[] = [basePath];
  const result: string[] = [];
  while (dirQueue.length > 0) {
    const directory = dirQueue.shift() as string;
    const entries = await readDir(directory);
    for (const entry of entries) {
      const fullPath = path.join(directory, entry);
      const stat = await fsstat(fullPath);
      if (stat.isDirectory()) {
        dirQueue.push(fullPath);
      } else if (stat.isFile() && entry.match(nameRegex)) {
        result.push(fullPath);
      }
    }
  }
  return result;
}

function renderFile(
  targetFilename: string,
  templateName: string,
  renderParameters: {}
) {
  let processed = nunjucks.render(templateName, renderParameters);
  // Pretty-print generated JSON files
  if (targetFilename.match(/\.json$/i)) {
    try {
      const json = JSON.parse(processed);
      const pretty = JSON.stringify(json, null, '  ') + '\n';
      processed = pretty;
    } catch (err) {
      console.warn(
        `The generated JSON file ${targetFilename} does not look like a valid JSON: ${err.toString()}`
      );
    }
  }
  const output = plugin.google.protobuf.compiler.CodeGeneratorResponse.File.create();
  output.name = targetFilename;
  output.content = processed;
  return output;
}

function processOneTemplate(
  basePath: string,
  templateFilename: string,
  api: API
) {
  const result: plugin.google.protobuf.compiler.CodeGeneratorResponse.File[] = [];
  const relativeTemplateName = templateFilename.substr(basePath.length + 1);
  let outputFilename = relativeTemplateName.replace(/\.njk$/, '');

  // Filename can have one or more variables in it that should be substituted
  // with their actual values. Currently supported: $service, $version Note:
  // $version is unique (defined in api.naming), but there can be multiple
  // services.
  outputFilename = outputFilename.replace(/\$version/, api.naming.version);
  // {api, commonParameters}
  if (outputFilename.match(/\$service/)) {
    for (const service of api.services) {
      result.push(
        renderFile(
          outputFilename.replace(/\$service/, service.name!.toSnakeCase()),
          relativeTemplateName,
          { api, commonParameters, service }
        )
      );
    }
  } else {
    result.push(
      renderFile(outputFilename, relativeTemplateName, {
        api,
        commonParameters,
      })
    );
  }

  return result;
}

export async function processTemplates(basePath: string, api: API) {
  nunjucks.configure(basePath);
  basePath = basePath.replace(/\/*$/, '');
  const templateFiles = await recursiveFileList(basePath, /^(?!_[^_]).*\.njk$/);
  const result: plugin.google.protobuf.compiler.CodeGeneratorResponse.File[] = [];
  for (const templateFilename of templateFiles) {
    const generatedFiles = processOneTemplate(basePath, templateFilename, api);
    result.push(...generatedFiles);
  }
  return result;
}
