import path from 'node:path';

export function resolveSafePath(baseDir: string, targetPath: string): string {
  const resolvedBase = path.resolve(baseDir);
  const resolvedTarget = path.resolve(resolvedBase, targetPath);

  if (!resolvedTarget.startsWith(`${resolvedBase}${path.sep}`) && resolvedTarget !== resolvedBase) {
    throw new Error('Path traversal detected.');
  }

  return resolvedTarget;
}
