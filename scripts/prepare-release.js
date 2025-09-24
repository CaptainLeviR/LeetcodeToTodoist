const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const bumpType = process.argv[2] ?? 'patch';
const manifestPath = path.resolve(__dirname, '..', 'src', 'manifest.json');
const packagePath = path.resolve(__dirname, '..', 'package.json');
const releaseDir = path.resolve(__dirname, '..', 'release');

function bumpVersion(version, type) {
  const parts = version.split('.').map((part) => Number(part));
  if (parts.some((part) => Number.isNaN(part))) {
    throw new Error(`Invalid version string: ${version}`);
  }
  while (parts.length < 3) {
    parts.push(0);
  }
  switch (type) {
    case 'major':
      parts[0] += 1;
      parts[1] = 0;
      parts[2] = 0;
      break;
    case 'minor':
      parts[1] += 1;
      parts[2] = 0;
      break;
    case 'patch':
      parts[2] += 1;
      break;
    default:
      throw new Error(`Unknown bump type: ${type}`);
  }
  return parts.join('.');
}

function writeJson(filePath, data) {
  fs.writeFileSync(filePath, `${JSON.stringify(data, null, 2)}\n`, 'utf8');
}

function main() {
  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  const pkg = JSON.parse(fs.readFileSync(packagePath, 'utf8'));

  const newVersion = bumpVersion(manifest.version ?? pkg.version ?? '0.0.0', bumpType);

  manifest.version = newVersion;
  pkg.version = newVersion;

  writeJson(manifestPath, manifest);
  writeJson(packagePath, pkg);

  console.log(`Version bumped to ${newVersion}`);

  execSync('npm run build', { stdio: 'inherit' });

  fs.mkdirSync(releaseDir, { recursive: true });

  const zipName = `leetcode-to-todoist-v${newVersion}.zip`;
  const zipPath = path.join(releaseDir, zipName);

  execSync(`zip -r ${JSON.stringify(zipPath)} .`, {
    stdio: 'inherit',
    cwd: path.resolve(__dirname, '..', 'dist'),
  });

  console.log(`Release package created: ${zipPath}`);
}

main();
