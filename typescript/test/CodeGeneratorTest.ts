const execa = require('execa');
const path = require('path');
const GENERATED_CLIENT_LIB_DIR = '--typescript_gapic_out=' + path.join(__dirname, '..', '..', '..') + '/showcase/tmp_xz1';
const GENERATED_CLIENT_FILE = path.join(__dirname, '..', '..', '..') + '/showcase/tmp_xz1/src/v1beta1/echo_client.ts'
const GOOGLE_GAX_PROTOS_DIR = '-I/usr/local/lib/node_modules/google-gax/protos';
const CLIENT_LIB_DIR = '-I/Users/xiaozhenliu/showcase';
const PROTO_DIR = 'google/showcase/v1beta1/echo.proto';
const CLIENT_LIBRARY_BASELINE = __dirname + '/testdata/src/v1beta1/echo_client_baseline.ts';


describe('CodeGeneratorTest', () => {
  describe('Generate showcase library', () => {
    it('should return same good output with baseline library', async() => {
      //This throws error: ' Command failed with exit code 1 (EPERM) '
      await execa('protoc', [GENERATED_CLIENT_LIB_DIR, GOOGLE_GAX_PROTOS_DIR, CLIENT_LIB_DIR, PROTO_DIR]);
      await execa('cmp', [GENERATED_CLIENT_FILE, CLIENT_LIBRARY_BASELINE]);
    });
  });
});

