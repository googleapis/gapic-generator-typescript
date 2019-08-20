const execa = require('execa');
const util = require('util');
const path = require('path');
const fs = require('fs');

const cwd = process.cwd();
const SHOWCASE_CLIENT_LIB = path.join(cwd, 'showcase');
const TMP_CLIENT_LIB = path.join(cwd, 'showcase', 'tmp');
const GENERATED_CLIENT_LIB_DIR =
    '--typescript_gapic_out=' + path.join(__dirname, '..', '..', 'showcase', 'tmp');
const GENERATED_CLIENT_FILE = path.join(__dirname, '..', '..', 'showcase', 'tmp', 'src', 'v1beta1', 'echo_client.ts');
const GOOGLE_GAX_PROTOS_DIR = '-I/' + path.join('usr', 'local', 'lib', 'node_modules', 'google-gax/protos');
// TODO: Right now we download protos from release page and cp here. Github
//  download will give the whole repo.
const LOCAL_CLIENT_LIB_DIR = '-I/' + path.join('Users', 'xiaozhenliu', 'showcase');
const PROTO_DIR = path.join('google', 'showcase', 'v1beta1', 'echo.proto');
const CLIENT_LIBRARY_BASELINE = path.join(__dirname, '..', '..', 'typescript', 'test', 'testdata', 'echo_client_baseline');

function compareFiles(file1: string, file2: string): boolean {
    const clientBuf = fs.readFileSync(file1);
    const baselineBuf = fs.readFileSync(file2);
    return clientBuf.equals(baselineBuf);
}

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
         await execa('protoc', [
           GENERATED_CLIENT_LIB_DIR, GOOGLE_GAX_PROTOS_DIR,
           LOCAL_CLIENT_LIB_DIR, PROTO_DIR
         ]);
         console.log(compareFiles(GENERATED_CLIENT_FILE, CLIENT_LIBRARY_BASELINE));
       });
  });
});
