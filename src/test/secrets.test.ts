import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const root = resolve(__dirname, '../..');

function walk(dir: string, out: string[] = []): string[] {
  for (const name of readdirSync(dir)) {
    if (['node_modules', '.git', 'dist', 'coverage'].includes(name)) continue;
    const full = join(dir, name);
    if (statSync(full).isDirectory()) walk(full, out);
    else if (/\.(ts|tsx|js|mjs|json|html|sql|md|toml|example)$/.test(name) || name.startsWith('.env')) out.push(full);
  }
  return out;
}

/** True if the text holds a JWT whose payload has role "service_role" (a legacy secret key). */
function hasServiceRoleJwt(text: string): boolean {
  const jwts = text.match(/eyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}/g) ?? [];
  return jwts.some((token) => {
    try {
      const payload = JSON.parse(Buffer.from(token.split('.')[1], 'base64url').toString('utf8'));
      return payload?.role === 'service_role';
    } catch {
      return false;
    }
  });
}

const SECRET_KEY = /sb_secret_[A-Za-z0-9_-]{10,}/;

const files = walk(root).filter((f) => !f.endsWith('secrets.test.ts'));

describe('Secrets hygiene', () => {
  it('never references the Supabase service-role key in code', () => {
    const offenders = files
      .filter((f) => /\/(src|scripts)\//.test(f))
      .filter((f) => /service[_-]?role|SUPABASE_SECRET|sb_secret_/i.test(readFileSync(f, 'utf8')));
    expect(offenders).toEqual([]);
  });

  it('contains no secret or service-role keys anywhere in the project (including .env files)', () => {
    const offenders = files.filter((f) => {
      const text = readFileSync(f, 'utf8');
      return SECRET_KEY.test(text) || hasServiceRoleJwt(text);
    });
    expect(offenders).toEqual([]);
  });

  it('.env.example only contains placeholders', () => {
    const example = readFileSync(join(root, '.env.example'), 'utf8');
    expect(example).toMatch(/your-project-ref/);
    expect(example).toMatch(/your-publishable-or-anon-key/);
  });

  it('.gitignore keeps real .env files out of Git', () => {
    const gitignore = readFileSync(join(root, '.gitignore'), 'utf8');
    expect(gitignore).toMatch(/^\.env$/m);
    expect(gitignore).toMatch(/^\.env\.\*$/m);
    expect(gitignore).toMatch(/^!\.env\.example$/m);
  });

  it('the built site (if present) contains no service-role or secret keys', () => {
    const dist = join(root, 'dist');
    if (!existsSync(dist)) return;
    const builtFiles: string[] = [];
    const walkDist = (d: string) => {
      for (const n of readdirSync(d)) {
        const full = join(d, n);
        if (statSync(full).isDirectory()) walkDist(full);
        else if (/\.(js|html|css)$/.test(n)) builtFiles.push(full);
      }
    };
    walkDist(dist);
    // The public publishable/anon key is expected in the build. The plain word
    // "service_role" also appears inside the Supabase library, so we look for
    // actual secret key values instead.
    const offenders = builtFiles.filter((f) => {
      const text = readFileSync(f, 'utf8');
      return SECRET_KEY.test(text) || hasServiceRoleJwt(text);
    });
    expect(offenders).toEqual([]);
  });
});
