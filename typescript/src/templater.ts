import * as fs from 'fs';
import * as nunjucks from 'nunjucks';
import * as path from 'path';
import * as util from 'util';

import * as plugin from '../../pbjs-genfiles/plugin';

import {API} from './schema/api';

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

export async function processTemplates(basePath: string, api: API) {
  basePath = basePath.replace(/\/*$/, '');
  const files = await recursiveFileList(basePath, /^(?!_[^_]).*\.j2$/);
  const result: plugin.google.protobuf.compiler.CodeGeneratorResponse.File[] =
      [];
  for (const file of files) {
    const outputFilename =
        file.substr(basePath.length + 1).replace(/\.j2$/, '');
    const processed = nunjucks.render(file, {api});
    const output =
        plugin.google.protobuf.compiler.CodeGeneratorResponse.File.create();
    output.name = outputFilename;
    output.content = processed;
    result.push(output);
  }
  return result;
}