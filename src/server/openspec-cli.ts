import { execFile } from 'node:child_process';
import type { ChildProcess, ExecFileException, ExecFileOptions } from 'node:child_process';

/**
 * Minimal `execFile` shape used to launch the OpenSpec CLI. Call sites and
 * tests inject this seam so Windows vs POSIX spawn can be asserted without a
 * real subprocess.
 */
export type OpenSpecExecFile = (
  file: string,
  args: readonly string[],
  options: ExecFileOptions,
  callback: (error: ExecFileException | null, stdout: string, stderr: string) => void,
) => ChildProcess | void;

export interface ExecOpenSpecOptions {
  cwd?: ExecFileOptions['cwd'];
  timeout?: number;
  exec?: OpenSpecExecFile;
  platform?: NodeJS.Platform;
}

const WINDOWS_UNSAFE_ARGUMENT = /["%\u0000-\u001F\u007F]/;

function isWindowsUnsafeArgument(value: string): boolean {
  return WINDOWS_UNSAFE_ARGUMENT.test(value);
}

function quoteWindowsArgument(value: string): string {
  return `"${value}"`;
}

function createUnsafeArgumentError(argument: string): ExecFileException {
  const error = new Error(
    `OpenSpec CLI argument contains a Windows-unsafe character: ${JSON.stringify(argument)}`,
  ) as ExecFileException;
  error.code = 'ERR_INVALID_ARG_VALUE';
  return error;
}

type WindowsLaunchStrategy = 'direct' | 'shim';

/**
 * Windows launch strategy cached per `exec` implementation. The default
 * `execFile` therefore caches for the process lifetime, while tests that
 * inject their own `exec` start with a fresh cache.
 */
const windowsStrategyCache = new WeakMap<OpenSpecExecFile, WindowsLaunchStrategy>();

function launchWindowsShim(
  exec: OpenSpecExecFile,
  args: readonly string[],
  options: ExecOpenSpecOptions,
  callback: (error: ExecFileException | null, stdout: string, stderr: string) => void,
): ChildProcess | void {
  for (const arg of args) {
    if (isWindowsUnsafeArgument(arg)) {
      callback(createUnsafeArgumentError(arg), '', '');
      return undefined;
    }
  }

  return exec(
    'openspec.cmd',
    args.map(quoteWindowsArgument),
    {
      cwd: options.cwd,
      timeout: options.timeout,
      shell: true,
    },
    callback,
  );
}

/**
 * Launch the OpenSpec CLI. POSIX uses `openspec` with a structured argv and
 * no shell. Windows first launches `openspec` directly (resolving a
 * standalone `openspec.exe`) without a shell; only when that reports
 * `ENOENT` does it fall back to npm's `openspec.cmd` shim with `shell: true`,
 * quoting each argument and rejecting `"`, `%`, or control characters. The
 * working Windows strategy is cached.
 */
export function execOpenSpec(
  args: readonly string[],
  options: ExecOpenSpecOptions,
  callback: (error: ExecFileException | null, stdout: string, stderr: string) => void,
): ChildProcess | void {
  const platform = options.platform ?? process.platform;
  const exec = options.exec ?? (execFile as OpenSpecExecFile);

  if (platform === 'win32') {
    const cached = windowsStrategyCache.get(exec);
    if (cached === 'shim') {
      return launchWindowsShim(exec, args, options, callback);
    }

    return exec(
      'openspec',
      args,
      {
        cwd: options.cwd,
        timeout: options.timeout,
      },
      (error, stdout, stderr) => {
        if (error && error.code === 'ENOENT' && cached !== 'direct') {
          windowsStrategyCache.set(exec, 'shim');
          launchWindowsShim(exec, args, options, callback);
          return;
        }
        if (!error || error.code !== 'ENOENT') {
          windowsStrategyCache.set(exec, 'direct');
        }
        callback(error, stdout, stderr);
      },
    );
  }

  return exec(
    'openspec',
    args,
    {
      cwd: options.cwd,
      timeout: options.timeout,
    },
    callback,
  );
}

/**
 * `execFile`-compatible wrapper for injectable seams that still pass a
 * command name. The file argument is ignored; the helper always launches
 * the OpenSpec CLI for the current platform.
 */
type ExecOpenSpecFileOptions = ExecFileOptions & Pick<ExecOpenSpecOptions, 'exec' | 'platform'>;

export function execOpenSpecFile(
  _file: string,
  args: readonly string[] | undefined | null,
  options: ExecOpenSpecFileOptions | undefined | null,
  callback: (error: ExecFileException | null, stdout: string, stderr: string) => void,
): ChildProcess | void {
  return execOpenSpec(
    args ?? [],
    {
      cwd: options?.cwd,
      timeout: options?.timeout,
      exec: options?.exec,
      platform: options?.platform,
    },
    callback,
  );
}
