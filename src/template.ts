// Loads and compiles a Handlebars template file, then renders it against a GameEntry.
import Handlebars from 'handlebars';
import * as fs from 'fs';
import { GameEntry } from './csv-reader';

export type CompiledTemplate = HandlebarsTemplateDelegate<GameEntry>;

export function loadTemplate(templatePath: string): CompiledTemplate {
  const source = fs.readFileSync(templatePath, 'utf-8');
  // BGG geeklist bodies are plain text, not HTML — disable escaping.
  return Handlebars.compile(source, { noEscape: true });
}

export function renderEntry(template: CompiledTemplate, entry: GameEntry): string {
  return template(entry);
}
