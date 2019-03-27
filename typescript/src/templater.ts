import * as fs from 'fs';
import * as nunjucks from 'nunjucks';
import * as path from 'path';
import * as util from 'util';

import * as plugin from '../../pbjs-genfiles/plugin';

import {API} from './schema/api';

const commonParameters: {[name: string]: string} = {
  copyrightYear: new Date().getFullYear().toString(),
};

const readFile = util.promisify(fs.readFile);
const readDir = util.promisify(fs.readdir);
const lstat = util.promisify(fs.lstat);

async function recursiveFileList(
    basePath: string, nameRegex: RegExp): Promise<string[]> {
  const dirQueue: string[] = [basePath];
  const result: string[] = [];
  while (dirQueue.length > 0) {
    const directory = dirQueue.shift() as string;
    const entries = await readDir(directory);
    for (const entry of entries) {
      const fullPath = path.join(directory, entry);
      const stat = await lstat(fullPath);
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
    targetFilename: string, templateFilename: string, renderParameters: {}) {
  const processed = nunjucks.render(templateFilename, renderParameters);
  const output =
      plugin.google.protobuf.compiler.CodeGeneratorResponse.File.create();
  output.name = targetFilename;
  output.content = processed;
  return output;
}

function processOneTemplate(
    basePath: string, templateFilename: string, api: API) {
  const result: plugin.google.protobuf.compiler.CodeGeneratorResponse.File[] =
      [];
  let outputFilename =
      templateFilename.substr(basePath.length + 1).replace(/\.njk$/, '');

  // Filename can have one or more variables in it that should be substituted
  // with their actual values. Currently supported: $service, $version Note:
  // $version is unique (defined in api.naming), but there can be multiple
  // services.
  outputFilename = outputFilename.replace(/\$version/, api.naming.version);
  // {api, commonParameters}
  if (outputFilename.match(/\$service/)) {
    for (const service of api.services) {
      result.push(renderFile(
          outputFilename.replace(/\$service/, service.name!.toLowerCase()),
          templateFilename, {api, commonParameters, service}));
    }
  } else {
    result.push(
        renderFile(outputFilename, templateFilename, {api, commonParameters}));
  }

  return result;
}

export async function processTemplates(basePath: string, api: API) {
  basePath = basePath.replace(/\/*$/, '');
  const templateFiles = await recursiveFileList(basePath, /^(?!_[^_]).*\.njk$/);
  const result: plugin.google.protobuf.compiler.CodeGeneratorResponse.File[] =
      [];
  for (const templateFilename of templateFiles) {
    const generatedFiles = processOneTemplate(basePath, templateFilename, api);
    result.push(...generatedFiles);
  }
  return result;
}