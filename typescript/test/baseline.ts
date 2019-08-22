import * as assert from 'assert';
import {execSync} from 'child_process';
import * as fs from 'fs';
import {ncp} from 'ncp';
import * as path from 'path';
import * as rimraf from 'rimraf';
import * as util from 'util';

const cwd = process.cwd();
const rmrf = util.promisify(rimraf);
const ncpp = util.promisify(ncp);

const OUTPUT_DIR = path.join(cwd, '.baseline-test-out');
const GENERATED_CLIENT_FILE =
    path.join(OUTPUT_DIR, 'src', 'v1beta1', 'echo_client.ts');
const GOOGLE_GAX_PROTOS_DIR =
    path.join(cwd, 'node_modules', 'google-gax', 'protos');
const PROTOS_DIR = path.join(cwd, 'build', 'test', 'protos');
const ECHO_PROTO_FILE =
    path.join(PROTOS_DIR, 'google', 'showcase', 'v1beta1', 'echo.proto');
const CLIENT_LIBRARY_BASELINE = path.join(
    cwd, 'typescript', 'test', 'testdata', 'echo_client_baseline.ts.txt');
const SRCDIR = path.join(cwd, 'build', 'src');
const CLI = path.join(SRCDIR, 'cli.js');
const PLUGIN = path.join(SRCDIR, 'protoc-gen-typescript_gapic');

describe('CodeGeneratorTest', () => {
  describe('Generate client library', () => {
    it('Generated client library should have same output with baseline.',
       async () => {
         if (fs.existsSync(OUTPUT_DIR)) {
           await rmrf(OUTPUT_DIR);
         }
         fs.mkdirSync(OUTPUT_DIR);

         ncpp(CLI, PLUGIN);
         process.env['PATH'] = SRCDIR + path.delimiter + process.env['PATH'];
         console.log(process.env['PATH']);

         try {
           execSync(`chmod +x ${PLUGIN}`);
         } catch (err) {
           console.log(`Failed to chmod +x ${PLUGIN}: ${err}. Ignoring...`);
         }

         console.log(
             `protoc --typescript_gapic_out=${OUTPUT_DIR} ` +
             `-I${GOOGLE_GAX_PROTOS_DIR} ` +
             `-I${PROTOS_DIR} ` + ECHO_PROTO_FILE);
         execSync(
             `protoc --typescript_gapic_out=${OUTPUT_DIR} ` +
             `-I${GOOGLE_GAX_PROTOS_DIR} ` +
             `-I${PROTOS_DIR} ` + ECHO_PROTO_FILE);
         assert(fs.readFileSync(GENERATED_CLIENT_FILE)
                    .equals(fs.readFileSync(CLIENT_LIBRARY_BASELINE)));
       });
  });
});
