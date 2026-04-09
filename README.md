# post-bgg

Posts entries to a BoardGameGeek geeklist from a CSV file or public Google Sheet.

## Setup

```bash
npm install
cp .env.example .env
# Edit .env and fill in your BGG credentials
cp templates/entry.hbs.example templates/entry.hbs
# Edit templates/entry.hbs to your liking
```

## CSV Format

Six columns, header row required (see `data/games.csv.sample`):

| Title | Cost | Condition | Notes | URL | Available |
|-------|------|-----------|-------|-----|-----------|
| Wingspan | $45 | Near mint | Includes all promos | https://boardgamegeek.com/boardgame/266192/wingspan | |
| Pandemic | $5 | | Good condition | https://boardgamegeek.com/boardgame/30549/pandemic | X |

- **Available**: leave blank to include the row; put `X` to skip it
- **Cost**: leading `$` is optional — the template adds it
- **URL**: must be a `boardgamegeek.com` game URL — the numeric BGG ID is extracted automatically
- Column headers are case-insensitive
- For `--sheet`, the Google Sheet must be shared as "Anyone with the link can view"

## Template

Edit `templates/entry.hbs` to control the body text of each posted item. Available variables:

| Variable | Description |
|----------|-------------|
| `{{title}}` | Game title |
| `{{cost}}` | Price (leading `$` stripped) |
| `{{condition}}` | Condition |
| `{{notes}}` | Freeform notes |
| `{{url}}` | Full BGG URL |
| `{{bggId}}` | Numeric BGG object ID |

Handlebars built-ins work normally, e.g. `{{#if cost}}Price is firm.{{/if}}`.

## Usage

```bash
# Preview rendered entries without posting (CSV)
npx ts-node src/index.ts --csv games.csv --dry-run

# Preview rendered entries without posting (Google Sheet)
npx ts-node src/index.ts --sheet "https://docs.google.com/spreadsheets/d/..." --dry-run

# Post entries to a geeklist
npx ts-node src/index.ts --csv games.csv
npx ts-node src/index.ts --sheet "https://docs.google.com/spreadsheets/d/..."

# Post only the first 3 entries
npx ts-node src/index.ts --csv games.csv --limit 3

# Override the geeklist ID from .env
npx ts-node src/index.ts --csv games.csv --geeklist 12345

# Use a custom template
npx ts-node src/index.ts --csv games.csv --template my-template.hbs
```

## Options

| Flag | Required | Description |
|------|----------|-------------|
| `--csv <path>` | One of `--csv`/`--sheet` | Path to input CSV file |
| `--sheet <url>` | One of `--csv`/`--sheet` | URL of a public Google Sheet |
| `--geeklist <id>` | No | BGG geeklist ID (overrides `BGG_GEEKLIST` in `.env`) |
| `--template <path>` | No | Path to `.hbs` template (default: `templates/entry.hbs`) |
| `--limit <n>` | No | Only process the first N available entries |
| `--dry-run` | No | Render and print entries without posting |

## Notes

BGG's write API is undocumented/internal. If posting fails unexpectedly, inspect an add-item request in your browser's DevTools Network tab to verify the current endpoint and payload shape, then adjust `src/bgg-client.ts` accordingly.

If you plan to use this, create your own Geeklist to test against before actually posting to a public geeklist. That way you can really verify that the entries match your expectations.
