import * as fs from 'fs-extra';
import * as path from 'path';

const NO_OUTPUT_FILE = 0;
const IDENTICAL_FILE = 1;
const FILE_WITH_DIFF_CONTENT = 2;

const BASELINE_EXTENSION = '.baseline';

export function equalToBaseline(
  outpurDir: string,
  baselineDir: string
): boolean {
  let result = true;
  // put all baseline files into fileStack
  let fileStack: string[] = [];
  const dirStack: string[] = [];
  putAllBaselineFiles(baselineDir, fileStack, dirStack);
  // store every item (file or directory with full path in output dir and baseline dir) in stack, pop once a time
  const protoItemStack: Item[] = [];
  putItemToStack(protoItemStack, outpurDir, baselineDir);
  while (protoItemStack.length !== 0) {
    const item = protoItemStack[protoItemStack.length - 1];
    protoItemStack.pop();
    // if item is a file, compare it with baseline
    if (fs.lstatSync(item.outputPath).isFile()) {
      const compareResult = checkIdenticalFile(
        item.outputPath,
        item.baselinePath + BASELINE_EXTENSION
      );
      if (compareResult === NO_OUTPUT_FILE) {
        result = false;
      }
      // if two files are identical or it's generated properly, filter it from the stack.
      if (
        compareResult === IDENTICAL_FILE ||
        compareResult === NO_OUTPUT_FILE
      ) {
        fileStack = fileStack.filter(
          file => file !== item.baselinePath + BASELINE_EXTENSION
        );
      }
    } else if (fs.lstatSync(item.outputPath).isDirectory()) {
      // if item is a directory, loop the folder and put every item in stack again
      putItemToStack(protoItemStack, item.outputPath, item.baselinePath);
    }
  }
  if (fileStack.length !== 0) {
    fileStack.forEach(file => {
      console.warn(file + ' is not identical with the generated file. ');
    });
    result = false;
  }
  return result;
}

function checkIdenticalFile(
  outputFullPath: string,
  baselineFullPath: string
): number {
  if (outputFullPath.endsWith('.proto')) {
    return IDENTICAL_FILE;
  }
  if (!fs.existsSync(baselineFullPath)) {
    console.warn(baselineFullPath + ' is not generated. ');
    return NO_OUTPUT_FILE;
  }
  const readOutput = fs.readFileSync(outputFullPath).toString();
  const baselineOutput = fs.readFileSync(baselineFullPath).toString();
  if (readOutput === baselineOutput) return IDENTICAL_FILE;
  return FILE_WITH_DIFF_CONTENT;
}

function putItemToStack(
  protoItemStack: Item[],
  outputDir: string,
  baselinDir: string
) {
  const outputFiles = fs.readdirSync(outputDir);

  outputFiles.forEach(file => {
    const fileFullPath = path.join(outputDir, file);
    const baselinePath = path.join(baselinDir, file);
    protoItemStack.push(new Item(file, fileFullPath, baselinePath));
  });
}

function putFiletoStack(dir: string, fileStack: string[], dirStack: string[]) {
  const items = fs.readdirSync(dir);
  items.forEach(item => {
    const baselinePath = path.join(dir, item);
    if (fs.lstatSync(baselinePath).isFile()) {
      fileStack.push(baselinePath);
    } else if (fs.lstatSync(baselinePath).isDirectory()) {
      dirStack.push(baselinePath);
    }
  });
}

function putAllBaselineFiles(
  dir: string,
  fileStack: string[],
  dirStack: string[]
) {
  putFiletoStack(dir, fileStack, dirStack);
  while (dirStack.length !== 0) {
    const dir = dirStack.pop();
    putFiletoStack(dir!, fileStack, dirStack);
  }
}

class Item {
  fileName: string; // file name: package.json
  outputPath: string; // full path in output folder: __dirname/.../.baseline-test-out/package.json
  baselinePath: string; // full baseline path: __dirname/.../test/testdata/showcase/package.json.baseline
  constructor(file: string, output: string, baseline: string) {
    this.fileName = file;
    this.outputPath = output;
    this.baselinePath = baseline;
  }
}
