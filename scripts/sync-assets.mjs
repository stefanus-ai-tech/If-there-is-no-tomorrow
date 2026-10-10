// Copies the source artwork and song into Remotion's public/ folder so the
// originals stay where they are and nothing is duplicated in git.
import {copyFileSync, existsSync, mkdirSync, readdirSync, statSync} from 'node:fs';
import {dirname, join} from 'node:path';
import {fileURLToPath} from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const pub = join(root, 'public');

const copyIfChanged = (src, dest) => {
	if (existsSync(dest) && statSync(dest).mtimeMs >= statSync(src).mtimeMs && statSync(dest).size === statSync(src).size) {
		return;
	}
	mkdirSync(dirname(dest), {recursive: true});
	copyFileSync(src, dest);
	console.log('synced', dest.replace(root, '.'));
};

for (const file of readdirSync(join(root, 'assets'))) {
	if (file.endsWith('.png')) {
		copyIfChanged(join(root, 'assets', file), join(pub, 'assets', file));
	}
}

copyIfChanged(join(root, 'v6 If I Have No Tomorrow.mp3'), join(pub, 'song.mp3'));
