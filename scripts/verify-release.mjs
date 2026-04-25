#!/usr/bin/env node

import { mkdir, mkdtemp, readFile, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { spawn, spawnSync } from 'node:child_process';

import { repoRoot } from './dev-utils.mjs';

const npmCommand = process.platform === 'win32' ? 'npm.cmd' : 'npm';
const packedBinName = process.platform === 'win32' ? 'openspec-webui.cmd' : 'openspec-webui';

function run(command, args, options = {}) {
  const result = spawnSync(command, args, {
    cwd: repoRoot,
    env: process.env,
    encoding: 'utf8',
    stdio: options.capture ? ['ignore', 'pipe', 'pipe'] : 'inherit',
  });

  if (result.status !== 0) {
    const stderr = result.stderr?.trim();
    const stdout = result.stdout?.trim();
    const detail = stderr || stdout;
    throw new Error(
      `${command} ${args.join(' ')} failed with exit code ${result.status}${detail ? `\n${detail}` : ''}`
    );
  }

  return result;
}

function parsePackJson(stdout) {
  const parsed = JSON.parse(stdout);
  if (!Array.isArray(parsed) || parsed.length === 0) {
    throw new Error('npm pack did not return tarball metadata');
  }
  return parsed[0];
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function normalizePathEntry(file) {
  return typeof file === 'string' ? file : file.path;
}

function hasCompiledTestArtifact(filePath) {
  return /^dist\/.*\.(test|spec)\.(d\.ts|d\.ts\.map|js|js\.map)$/.test(filePath);
}

function verifyTarballContents(packInfo, packageJson, packageLock) {
  assert(packInfo.name === packageJson.name, 'Tarball package name does not match package.json');
  assert(packInfo.version === packageJson.version, 'Tarball version does not match package.json');
  assert(packageLock.name === packageJson.name, 'package-lock.json name does not match package.json');
  assert(packageLock.version === packageJson.version, 'package-lock.json version does not match package.json');
  assert(
    packageLock.packages?.['']?.version === packageJson.version,
    'package-lock.json root package version does not match package.json'
  );

  const filePaths = packInfo.files.map(normalizePathEntry);
  const unexpectedFiles = filePaths.filter(hasCompiledTestArtifact);

  assert(unexpectedFiles.length === 0, `Tarball contains compiled test artifacts: ${unexpectedFiles.join(', ')}`);
  assert(filePaths.includes('ThirdPartyNotices.txt'), 'Tarball is missing ThirdPartyNotices.txt');
  assert(filePaths.includes('README.md'), 'Tarball is missing README.md');
  assert(filePaths.includes('LICENSE'), 'Tarball is missing LICENSE');
  assert(filePaths.includes('dist/cli/index.js'), 'Tarball is missing dist/cli/index.js');
  assert(filePaths.includes('dist-frontend/index.html'), 'Tarball is missing dist-frontend/index.html');
}

async function smokeTestInstalledCli(installDir, expectedVersion, configHome) {
  const helpOutput = run(
    npmCommand,
    ['exec', '--prefix', installDir, 'openspec-webui', '--', '--help'],
    { capture: true }
  ).stdout;
  const versionOutput = run(
    npmCommand,
    ['exec', '--prefix', installDir, 'openspec-webui', '--', '--version'],
    { capture: true }
  ).stdout.trim();

  assert(helpOutput.includes('Usage: openspec-webui'), 'Packed CLI help output did not contain expected usage text');
  assert(versionOutput === expectedVersion, 'Packed CLI version output does not match package.json');

  await new Promise((resolve, reject) => {
    const child = spawn(
      npmCommand,
      ['exec', '--prefix', installDir, 'openspec-webui', '--', '--no-open', '--port', '0'],
      {
        cwd: repoRoot,
        env: { ...process.env, XDG_CONFIG_HOME: configHome },
        stdio: ['ignore', 'pipe', 'pipe'],
        shell: process.platform === 'win32',
      }
    );

    let settled = false;
    let stdout = '';
    let stderr = '';
    let ready = false;

    const finish = (callback) => {
      if (settled) {
        return;
      }
      settled = true;
      clearTimeout(timer);
      callback();
    };

    const timer = setTimeout(() => {
      child.kill('SIGTERM');
      finish(() => reject(new Error(`Timed out waiting for packed CLI startup\nSTDOUT:\n${stdout}\nSTDERR:\n${stderr}`)));
    }, 15_000);

    child.stdout.on('data', (chunk) => {
      stdout += chunk.toString();
      if (!ready && stdout.includes('OpenSpec WebUI running at http://127.0.0.1:')) {
        ready = true;
        child.kill('SIGTERM');
      }
    });

    child.stderr.on('data', (chunk) => {
      stderr += chunk.toString();
    });

    child.on('error', (error) => {
      finish(() => reject(error));
    });

    child.on('exit', (code) => {
      if (!ready && code !== 0) {
        finish(() => reject(new Error(`Packed CLI startup failed with exit code ${code}\nSTDOUT:\n${stdout}\nSTDERR:\n${stderr}`)));
        return;
      }

      if (!ready) {
        finish(() => reject(new Error(`Packed CLI exited before reporting startup\nSTDOUT:\n${stdout}\nSTDERR:\n${stderr}`)));
        return;
      }

      finish(resolve);
    });
  });
}

async function main() {
  const packageJson = JSON.parse(await readFile(join(repoRoot, 'package.json'), 'utf8'));
  const packageLock = JSON.parse(await readFile(join(repoRoot, 'package-lock.json'), 'utf8'));

  console.log('Running release verification...');
  run(npmCommand, ['run', 'licenses:generate']);
  run(npmCommand, ['run', 'build']);
  run(npmCommand, ['run', 'test']);
  run(npmCommand, ['run', 'typecheck']);

  const dryRunInfo = parsePackJson(run(npmCommand, ['pack', '--dry-run', '--json'], { capture: true }).stdout);
  verifyTarballContents(dryRunInfo, packageJson, packageLock);

  const tempRoot = await mkdtemp(join(tmpdir(), 'openspec-webui-release-'));
  const packDir = join(tempRoot, 'pack');
  const installDir = join(tempRoot, 'install');
  const configHome = join(tempRoot, 'config');

  try {
    await mkdir(packDir, { recursive: true });
    await mkdir(installDir, { recursive: true });
    await mkdir(configHome, { recursive: true });

    const packedInfo = parsePackJson(
      run(npmCommand, ['pack', '--json', '--pack-destination', packDir], { capture: true }).stdout
    );
    const tarballPath = join(packDir, packedInfo.filename);

    run(npmCommand, ['install', '--prefix', installDir, '--no-package-lock', tarballPath]);
    await smokeTestInstalledCli(installDir, packageJson.version, configHome);

    console.log(`Verified tarball: ${packedInfo.filename}`);
    console.log(`Verified packed CLI version: ${packageJson.version}`);
    console.log('Verified packed CLI startup: openspec-webui --no-open --port 0');
  } finally {
    await rm(tempRoot, { recursive: true, force: true });
  }
}

await main();
