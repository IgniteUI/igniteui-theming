import { copyFile, access } from 'node:fs/promises';
import path from 'node:path';

const rootDir = path.resolve(import.meta.dirname, '..');
const buildDir = path.join(rootDir, process.argv[2] ?? 'dist');
const fileNames = ['llms.txt', 'llms-full.txt'];

for (const fileName of fileNames) {
  const sourcePath = path.join(buildDir, fileName);
  const destinationPath = path.join(rootDir, fileName);

  try {
    await access(sourcePath);
    await copyFile(sourcePath, destinationPath);
    console.log(`Copied ${fileName} to project root.`);
  } catch {
    console.warn(
      `Skipped ${fileName} because it was not found in ${path.relative(rootDir, buildDir)}/.`
    );
  }
}
