import * as assert from 'assert';
import { execSync } from 'child_process';
import * as fs from 'fs';
import { describe, it } from 'mocha';
import * as path from 'path';
import * as rimraf from 'rimraf';

import { equalToBaseline } from '../util';

const cwd = process.cwd();

const START_SCRIPT = path.join(
  process.cwd(),
  'build',
  'src',
  'start_script.js'
);

const OUTPUT_DIR = path.join(cwd, '.test-out-monitoring');
const GOOGLE_GAX_PROTOS_DIR = path.join(
  cwd,
  'node_modules',
  'google-gax',
  'protos'
);

const PROTOS_DIR = path.join(cwd, 'build', 'test', 'protos');
const MONITOR_PROTO_FILE = path.join(
  PROTOS_DIR,
  'google',
  'monitoring',
  'v3',
  'service_service.proto'
);

const BASELINE_DIR = path.join(
  __dirname,
  '..',
  '..',
  '..',
  'typescript',
  'test',
  'testdata'
);

const BASELINE_DIR_MONITOR = path.join(BASELINE_DIR, 'monitoring');
const SRCDIR = path.join(cwd, 'build', 'src');
const CLI = path.join(SRCDIR, 'cli.js');
const PLUGIN = path.join(SRCDIR, 'protoc-gen-typescript_gapic');

describe('MonitoringGenerateTest', () => {
  describe('Generate Client library', () => {
    it('Generated proto list should have same output with baseline.', function() {
      this.timeout(10000);
      if (fs.existsSync(OUTPUT_DIR)) {
        rimraf.sync(OUTPUT_DIR);
      }
      fs.mkdirSync(OUTPUT_DIR);

      if (fs.existsSync(PLUGIN)) {
        rimraf.sync(PLUGIN);
      }
      fs.copyFileSync(CLI, PLUGIN);
      process.env['PATH'] = SRCDIR + path.delimiter + process.env['PATH'];

      try {
        execSync(`chmod +x ${PLUGIN}`);
      } catch (err) {
        console.warn(`Failed to chmod +x ${PLUGIN}: ${err}. Ignoring...`);
      }

      execSync(
        'node ' +
          START_SCRIPT +
          ` -I${PROTOS_DIR}` +
          ` ${MONITOR_PROTO_FILE}` +
          ` --output_dir=${OUTPUT_DIR}` +
          ` --main_service=monitoring`
      );
      assert(equalToBaseline(OUTPUT_DIR, BASELINE_DIR_MONITOR));
    });
  });
});
