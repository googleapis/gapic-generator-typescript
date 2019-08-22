const {execSync} = require('child_process');
const util = require('util');
const path = require('path');
const fs = require('fs');
const assert = require('assert');
const cwd = process.cwd();
const SHOWCASE_CLIENT_LIB = path.join(cwd, 'showcase');
const TMP_CLIENT_LIB = path.join(cwd, 'showcase', 'tmp');
const GENERATED_CLIENT_LIB_DIR = '--typescript_gapic_out=' +
    path.join(__dirname, '..', '..', 'showcase', 'tmp');
const GENERATED_CLIENT_FILE = path.join(
    __dirname, '..', '..', 'showcase', 'tmp', 'src', 'v1beta1',
    'echo_client.ts');
const GOOGLE_GAX_PROTOS_DIR = '-I/' +
    path.join('usr', 'local', 'lib', 'node_modules', 'google-gax/protos');
const LOCAL_CLIENT_LIB_DIR =
    '-I' + path.join(__dirname, '..', '..', 'typescript', 'test', 'protos');

const PROTO_DIR = path.join('google', 'showcase', 'v1beta1', 'echo.proto');
const CLIENT_LIBRARY_BASELINE = path.join(
    __dirname, '..', '..', 'typescript', 'test', 'testdata',
    'echo_client_baseline');

describe('CodeGeneratorTest', () => {
  describe('Generate client library', () => {
    it('Generated client library should have same output with baseline.',
       async () => {
         if (!fs.existsSync(SHOWCASE_CLIENT_LIB)) {
           fs.mkdirSync(SHOWCASE_CLIENT_LIB);
         }
         if (!fs.existsSync(TMP_CLIENT_LIB)) {
           fs.mkdirSync(TMP_CLIENT_LIB);
         }
         console.log('mkdir complete');
         execSync('protoc ' + GENERATED_CLIENT_LIB_DIR + ' ' + GOOGLE_GAX_PROTOS_DIR + ' ' + LOCAL_CLIENT_LIB_DIR + ' ' + PROTO_DIR);
         console.log('protoc completed');
         assert.strictEqual(fs.readFileSync(GENERATED_CLIENT_FILE), fs.readFileSync(CLIENT_LIBRARY_BASELINE));
       });
  });
});
