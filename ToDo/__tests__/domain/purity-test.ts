import fs from 'fs';
import path from 'path';

/**
 * Layer rule (docs/PLAN.md): `domain` and `constants` are pure. They must not import
 * Firebase, React, React Native or Expo, so the data model can be tested and reused anywhere.
 */
const SRC = path.join(__dirname, '..', '..', 'src');
const FORBIDDEN = /from\s+['"](firebase|react|react-native|expo)[^'"]*['"]/;

function sourceFiles(dir: string): string[] {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name);
    return entry.isDirectory() ? sourceFiles(full) : /\.(ts|tsx)$/.test(entry.name) ? [full] : [];
  });
}

describe('layer purity', () => {
  const domainFiles = sourceFiles(path.join(SRC, 'domain'));
  const constantFiles = sourceFiles(path.join(SRC, 'constants'));

  it('finds the files it is meant to check', () => {
    expect(domainFiles.length).toBeGreaterThanOrEqual(3);
    expect(constantFiles.length).toBeGreaterThanOrEqual(3);
  });

  it.each([...domainFiles, ...constantFiles].map((file) => [path.relative(SRC, file), file]))(
    '%s has no framework or Firebase imports',
    (_name, file) => {
      expect(fs.readFileSync(file, 'utf8')).not.toMatch(FORBIDDEN);
    },
  );

  it('keeps Firebase inside services/firebase and repositories only', () => {
    const allowed = [path.join(SRC, 'services'), path.join(SRC, 'repositories')];
    const files = sourceFiles(SRC).filter((file) => !allowed.some((dir) => file.startsWith(dir)));
    expect(files.length).toBeGreaterThan(10);
    for (const file of files) {
      expect(fs.readFileSync(file, 'utf8')).not.toMatch(/from\s+['"]firebase/);
    }
  });
});
