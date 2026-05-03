import { existsSync, mkdirSync, readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const STATIC_IMG_DIR = resolve(ROOT, 'static/images');
const MARKER = resolve(STATIC_IMG_DIR, '.fetched');
const FOLDER_ID = process.env.DRIVE_FOLDER_ID ?? '1IWgjywo_HX8Lw_MTDdzXoqIWW6f9x1oC';
const FRESH_MS = 24 * 60 * 60 * 1000;

function countFiles(dir: string): number {
	if (!existsSync(dir)) return 0;
	let n = 0;
	for (const entry of readdirSync(dir, { withFileTypes: true })) {
		if (entry.name.startsWith('.')) continue;
		if (entry.isDirectory()) n += countFiles(resolve(dir, entry.name));
		else n += 1;
	}
	return n;
}

function isFreshLocally(): boolean {
	if (!existsSync(MARKER)) return false;
	const mtime = statSync(MARKER).mtimeMs;
	return Date.now() - mtime < FRESH_MS;
}

function ensureGdown(): boolean {
	const probe = spawnSync('gdown', ['--version'], { stdio: 'ignore' });
	return probe.status === 0;
}

function gdownSupportsRemainingOk(): boolean {
	const probe = spawnSync('gdown', ['--help'], { encoding: 'utf8' });
	return probe.status === 0 && /--remaining-ok/.test(probe.stdout ?? '');
}

function main() {
	mkdirSync(STATIC_IMG_DIR, { recursive: true });

	if (process.env.SKIP_DRIVE_FETCH === '1') {
		console.log('SKIP_DRIVE_FETCH=1 set; using existing static/images/.');
		return;
	}

	if (isFreshLocally()) {
		console.log('static/images/.fetched is < 24 h old; skipping Drive fetch.');
		console.log(`  Files on disk: ${countFiles(STATIC_IMG_DIR)}`);
		return;
	}

	if (!ensureGdown()) {
		console.error('gdown not found on PATH.');
		console.error('Install: pip install gdown   (Python 3.7+)');
		if (countFiles(STATIC_IMG_DIR) > 0) {
			console.warn('Continuing build with existing static/images/ contents.');
			return;
		}
		process.exit(1);
	}

	const url = `https://drive.google.com/drive/folders/${FOLDER_ID}`;
	console.log(`Fetching Drive folder ${FOLDER_ID} → static/images/`);
	const args = ['--folder'];
	if (gdownSupportsRemainingOk()) args.push('--remaining-ok');
	args.push(url, '-O', STATIC_IMG_DIR);
	const result = spawnSync('gdown', args, {
		stdio: 'inherit',
		cwd: ROOT
	});

	if (result.status !== 0) {
		console.error(`\ngdown exited with status ${result.status}.`);
		if (countFiles(STATIC_IMG_DIR) > 0) {
			console.warn('Continuing with existing static/images/ contents.');
			return;
		}
		process.exit(1);
	}

	const total = countFiles(STATIC_IMG_DIR);
	writeFileSync(MARKER, new Date().toISOString());
	console.log(`\nDone. ${total} files in static/images/.`);
}

main();
