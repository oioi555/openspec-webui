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

/**
 * Launch the OpenSpec CLI. POSIX uses `openspec` with a structured argv and
 * no shell. Windows targets npm's `openspec.cmd` shim with `shell: true`
 * after quoting each argument and rejecting `"`, `%`, or control characters.
 */
export function execOpenSpec(
  args: readonly string[],
  options: ExecOpenSpecOptions,
  callback: (error: ExecFileException | null, stdout: string, stderr: string) => void,
): ChildProcess | void {
  const platform = options.platform ?? process.platform;
  const exec = options.exec ?? (execFile as OpenSpecExecFile);

  if (platform === 'win32') {
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
