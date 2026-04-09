// Entry point. Orchestrates CSV reading, template rendering, and BGG posting.
import 'dotenv/config';
import { Command } from 'commander';
import * as path from 'path';
import { GameEntry, readCsv } from './csv-reader';
import { loadTemplate, renderEntry } from './template';
import { BggClient, sleep } from './bgg-client';

const DEFAULT_TEMPLATE = path.join(__dirname, '..', 'templates', 'entry.hbs');
const POST_DELAY_MS = 1000;

async function main() {
  const program = new Command();

  program
    .name('post-bgg')
    .description('Post entries to a BGG geeklist from a CSV file')
    .requiredOption('--csv <path>', 'Path to input CSV file')
    .option('--geeklist <id>', 'BGG geeklist ID to post to (overrides BGG_GEEKLIST in .env)', parseInt)
    .option('--template <path>', 'Path to Handlebars template file', DEFAULT_TEMPLATE)
    .option('--dry-run', 'Render entries and print them without posting', false)
    .option('--limit <n>', 'Only process the first N available entries', parseInt)
    .parse();

  const opts = program.opts<{
    csv: string;
    geeklist: number | undefined;
    template: string;
    dryRun: boolean;
    limit: number | undefined;
  }>();

  const username = process.env.BGG_USERNAME;
  const password = process.env.BGG_PASSWORD;

  const geeklistId = opts.geeklist ?? (process.env.BGG_GEEKLIST ? parseInt(process.env.BGG_GEEKLIST, 10) : undefined);
  if (!geeklistId) {
    console.error('Error: geeklist ID must be set via --geeklist or BGG_GEEKLIST in .env');
    process.exit(1);
  }

  if (!opts.dryRun) {
    if (!username || !password) {
      console.error('Error: BGG_USERNAME and BGG_PASSWORD must be set in .env (or environment)');
      process.exit(1);
    }
  }

  let entries: Array<GameEntry>;
  try {
    entries = await readCsv(opts.csv);
  } catch (e) {
    console.error(`CSV error: ${(e as Error).message}`);
    process.exit(1);
  }

  if (opts.limit !== undefined) {
    entries = entries.slice(0, opts.limit);
  }

  console.log(`Loaded ${entries.length} entries from ${opts.csv}`);

  const template = loadTemplate(opts.template);

  if (opts.dryRun) {
    for (const entry of entries) {
      console.log(`\n${'─'.repeat(60)}`);
      console.log(`Title: ${entry.title}  |  BGG ID: ${entry.bggId}`);
      console.log('─'.repeat(60));
      console.log(renderEntry(template, entry));
    }
    console.log(`\nDry run complete — ${entries.length} entries rendered, nothing posted.`);
    return;
  }

  const client = new BggClient();

  console.log(`Logging in as ${username}...`);
  try {
    await client.login(username!, password!);
  } catch (e) {
    console.error(`Login failed: ${(e as Error).message}`);
    process.exit(1);
  }
  console.log('Logged in.');

  let successCount = 0;
  let failCount = 0;

  for (let i = 0; i < entries.length; i++) {
    const entry = entries[i];
    const body = renderEntry(template, entry);

    process.stdout.write(`[${i + 1}/${entries.length}] Posting "${entry.title}" (BGG ID ${entry.bggId})... `);
    try {
      await client.postGeeklistItem({
        geeklistId,
        objectId: entry.bggId,
        body,
      });
      console.log('OK');
      successCount++;
    } catch (e) {
      console.log(`FAILED: ${(e as Error).message}`);
      failCount++;
    }

    if (i < entries.length - 1) {
      await sleep(POST_DELAY_MS);
    }
  }

  console.log(`\nDone. ${successCount} posted, ${failCount} failed.`);
}

main();
