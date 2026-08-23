/**
 * Regenerates static/.well-known/agent-skills/index.json from the SKILL.md
 * files on disk (Agent Skills Discovery RFC v0.2.0). Runs as part of
 * prepare-content so the sha256 digests can never drift from the file bytes.
 */
import { createHash } from 'node:crypto';
import { existsSync, readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const SKILLS_DIR = resolve(ROOT, 'static/.well-known/agent-skills');

if (!existsSync(SKILLS_DIR)) {
	console.log('No agent-skills directory, skipping.');
	process.exit(0);
}

const skills = readdirSync(SKILLS_DIR)
	.filter((d) => statSync(resolve(SKILLS_DIR, d)).isDirectory())
	.sort()
	.flatMap((name) => {
		const file = resolve(SKILLS_DIR, name, 'SKILL.md');
		if (!existsSync(file)) return [];
		const bytes = readFileSync(file); // digest the exact bytes, no trim
		const description =
			/^---\n[\s\S]*?^description:\s*(.+)$/m.exec(bytes.toString('utf8'))?.[1]?.trim() ?? '';
		return [
			{
				name,
				type: 'skill-md',
				description,
				url: `/.well-known/agent-skills/${name}/SKILL.md`,
				digest: `sha256:${createHash('sha256').update(bytes).digest('hex')}`
			}
		];
	});

writeFileSync(
	resolve(SKILLS_DIR, 'index.json'),
	JSON.stringify(
		{ $schema: 'https://schemas.agentskills.io/discovery/0.2.0/schema.json', skills },
		null,
		'\t'
	) + '\n'
);

console.log(`Agent skills index: ${skills.length} skill(s)`);
