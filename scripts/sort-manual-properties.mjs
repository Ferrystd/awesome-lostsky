import { readFile, readdir, writeFile } from 'node:fs/promises';
import { join, relative } from 'node:path';

const root = join(process.cwd(), 'docs', 'manual');
const write = process.argv.includes('--write');

async function markdownFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = await Promise.all(entries.map((entry) => {
    const path = join(directory, entry.name);
    return entry.isDirectory() ? markdownFiles(path) : entry.isFile() && entry.name.endsWith('.md') ? [path] : [];
  }));
  return files.flat();
}

function sortFrontmatter(source, file) {
  const newline = source.includes('\r\n') ? '\r\n' : '\n';
  const match = source.match(/^---\r?\n([\s\S]*?)\r?\n---(?=\r?\n|$)/);
  if (!match) return source;

  const properties = [];
  for (const line of match[1].split(/\r?\n/)) {
    const property = line.match(/^([A-Za-z][A-Za-z0-9_-]*):/);
    if (property) {
      properties.push({ key: property[1], lines: [line] });
    } else if (properties.length && (/^\s/.test(line) || line === '')) {
      properties.at(-1).lines.push(line);
    } else if (line !== '') {
      throw new Error(`Unsupported frontmatter in ${relative(process.cwd(), file)}: ${line}`);
    }
  }

  const sorted = [...properties].sort((a, b) => a.key < b.key ? 1 : a.key > b.key ? -1 : 0);
  const frontmatter = sorted.flatMap(({ lines }) => lines).join(newline);
  return source.replace(match[0], `---${newline}${frontmatter}${newline}---`);
}

const changes = [];
for (const file of await markdownFiles(root)) {
  const source = await readFile(file, 'utf8');
  const sorted = sortFrontmatter(source, file);
  if (sorted !== source) {
    changes.push(file);
    if (write) await writeFile(file, sorted);
  }
}

for (const file of changes) console.log(relative(process.cwd(), file));
console.log(`${write ? 'Updated' : 'Would update'} ${changes.length} manual document(s).`);
