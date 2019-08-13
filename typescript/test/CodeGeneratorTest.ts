const execa = require('execa');
const util = require('util');
const path = require('path');
const fs = require('fs');

const SHOWCASE_CLIENT_LIB = './showcase';
const TMP_CLIENT_LIB = './showcase/tmp';
const GENERATED_CLIENT_LIB_DIR =
    '--typescript_gapic_out=' + path.join(__dirname, '..', '..') +
    '/showcase/tmp';
const GENERATED_CLIENT_FILE = path.join(__dirname, '..', '..') +
    '/showcase/tmp/src/v1beta1/echo_client.ts';
const GOOGLE_GAX_PROTOS_DIR = '-I/usr/local/lib/node_modules/google-gax/protos';
// TODO: Right now we download protos from release page and cp here. Github
//  download will give the whole repo.
const LOCAL_CLIENT_LIB_DIR = '-I/Users/xiaozhenliu/showcase';
const PROTO_DIR = 'google/showcase/v1beta1/echo.proto';
const CLIENT_LIBRARY_BASELINE = path.join(__dirname, '..', '..') +
    '/typescript/test/testdata/echo_client_baseline';

describe('CodeGeneratorTest', () => {
  describe('Create ./showcase dir and get the protos', () => {
    it('Download showcase repo in ./showcase dir.', () => {
      // Create ./showcase directory.
      if (!fs.existsSync(SHOWCASE_CLIENT_LIB)) {
        fs.mkdirSync(SHOWCASE_CLIENT_LIB);
      }
    });
  });

  describe('Create ./showcase/tmp dir', () => {
    it('./showcase/tmp created', () => {
      // create ./showcase/tmp/ directory for generated client library
      if (!fs.existsSync(TMP_CLIENT_LIB)) {
        fs.mkdirSync(TMP_CLIENT_LIB);
      }
    });
  });

  describe('Generate client library', () => {
    it('Generated client library should have same output with baseline.',
       async () => {
         await execa('protoc', [
           GENERATED_CLIENT_LIB_DIR, GOOGLE_GAX_PROTOS_DIR,
           LOCAL_CLIENT_LIB_DIR, PROTO_DIR
         ]);
         await execa('cmp', [GENERATED_CLIENT_FILE, CLIENT_LIBRARY_BASELINE]);
       });
  });
});
