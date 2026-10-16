import { readFile, writeFile } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const vault = process.argv[2];
if (!vault) throw new Error('Pass the existing Obsidian vault path. Back up .obsidian first.');
const configPath = join(vault, '.obsidian', 'plugins', 'hearth', 'data.json');
const appearancePath = join(vault, '.obsidian', 'appearance.json');
const config = JSON.parse(await readFile(configPath, 'utf8'));
const home = config.dashboards?.find(d => d.id === 'dash-mvawm6fb-2495');
if (!home || home.name !== 'The Unseen') throw new Error('The existing The Unseen Hearth dashboard was not found.');
const beforeCards = JSON.stringify(home.cards);
const image = 'Personal AI OS V4 Prototype/Assets/the-unseen-evening.png';
config.cardDesign = 'classic'; // Expressive ignores cardOpacity and fills cards with accent-tinted surfaces.
config.cardOpacity = 0.64;
config.cardBlur = 5;
config.cardBorderWidth = 1;
config.cardRadius = 14;
config.backgroundKind = 'image';
config.backgroundValue = image;
config.backgroundOpacity = 0.98;
config.backgroundBlur = 0;
config.backgroundSkyDesign = 'classic';
home.background = { kind: 'image', value: image, opacity: 0.98, blur: 0 };
if (JSON.stringify(home.cards) !== beforeCards) throw new Error('Card contents changed unexpectedly.');
await writeFile(configPath, JSON.stringify(config, null, 2) + '\n', 'utf8');

const appearance = JSON.parse(await readFile(appearancePath, 'utf8'));
const snippetName = 'the-unseen-hearth';
const source = join(dirname(fileURLToPath(import.meta.url)), '..', 'assets', `${snippetName}.css`);
const destination = join(vault, '.obsidian', 'snippets', `${snippetName}.css`);
await writeFile(destination, await readFile(source));
appearance.enabledCssSnippets ??= [];
if (!appearance.enabledCssSnippets.includes(snippetName)) appearance.enabledCssSnippets.push(snippetName);
await writeFile(appearancePath, JSON.stringify(appearance, null, 2) + '\n', 'utf8');
console.log(JSON.stringify({ cards: home.cards.length, cardDesign: config.cardDesign,
  cardOpacity: config.cardOpacity, backgroundOpacity: home.background.opacity, snippet: snippetName }));
