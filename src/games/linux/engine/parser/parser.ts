export interface SimpleCommand {
  name: string;
  /** Quotes and escapes are already removed, variables already expanded. */
  args: string[];
}

export interface Redirect {
  op: '>' | '>>';
  target: string;
}

export interface Pipeline {
  commands: SimpleCommand[];
  /** Applies to the output of the last command. */
  redirect?: Redirect;
  raw: string;
}

/** `pipeline` is null for an empty line or a comment. */
export type ParseResult = { ok: true; pipeline: Pipeline | null } | { ok: false; message: string };

type Token = { kind: 'word'; value: string } | { kind: 'op'; value: '|' | '>' | '>>' };
type TokenizeResult = { ok: true; tokens: Token[] } | { ok: false; message: string };

const GLOB_MESSAGE =
  'bash: wildcards (* and ?) are not supported in this terminal yet. ' +
  'Put patterns in quotes, for example: find . -name "*.txt"';

function unsupported(symbol: string): { ok: false; message: string } {
  return { ok: false, message: `bash: '${symbol}' is not supported in this terminal yet` };
}

function syntaxError(token: string): { ok: false; message: string } {
  return { ok: false, message: `bash: syntax error near unexpected token \`${token}'` };
}

function tokenize(line: string, env: Record<string, string>): TokenizeResult {
  const tokens: Token[] = [];
  let word = '';
  let inWord = false;
  const endWord = () => {
    if (inWord) tokens.push({ kind: 'word', value: word });
    word = '';
    inWord = false;
  };
  /** Reads `$NAME` at `index`. Returns the value and the index after it. */
  const readVariable = (index: number): [string, number] => {
    const match = /^[A-Za-z_][A-Za-z0-9_]*/.exec(line.slice(index + 1));
    if (!match) return ['$', index + 1];
    return [env[match[0]] ?? '', index + 1 + match[0].length];
  };

  let i = 0;
  while (i < line.length) {
    const ch = line[i];
    if (/\s/.test(ch)) {
      endWord();
      i++;
    } else if (ch === '#' && !inWord) {
      break;
    } else if (ch === "'") {
      const end = line.indexOf("'", i + 1);
      if (end < 0)
        return { ok: false, message: "bash: unexpected EOF while looking for matching `''" };
      word += line.slice(i + 1, end);
      inWord = true;
      i = end + 1;
    } else if (ch === '"') {
      inWord = true;
      i++;
      for (;;) {
        if (i >= line.length) {
          return { ok: false, message: 'bash: unexpected EOF while looking for matching `"\'' };
        }
        const c = line[i];
        if (c === '"') {
          i++;
          break;
        }
        if (c === '\\' && i + 1 < line.length && '"\\$`'.includes(line[i + 1])) {
          word += line[i + 1];
          i += 2;
        } else if (c === '$') {
          const [value, next] = readVariable(i);
          word += value;
          i = next;
        } else {
          word += c;
          i++;
        }
      }
    } else if (ch === '\\') {
      if (i + 1 < line.length) {
        word += line[i + 1];
        inWord = true;
      }
      i += 2;
    } else if (ch === '$') {
      const [value, next] = readVariable(i);
      word += value;
      // Like bash, an empty unquoted variable is not an argument.
      if (value) inWord = true;
      i = next;
    } else if (ch === '|') {
      if (line[i + 1] === '|') return unsupported('||');
      endWord();
      tokens.push({ kind: 'op', value: '|' });
      i++;
    } else if (ch === '>') {
      endWord();
      const append = line[i + 1] === '>';
      tokens.push({ kind: 'op', value: append ? '>>' : '>' });
      i += append ? 2 : 1;
    } else if (ch === '&' && line[i + 1] === '&') {
      return unsupported('&&');
    } else if (';&<`()'.includes(ch)) {
      return unsupported(ch);
    } else if (ch === '*' || ch === '?') {
      return { ok: false, message: GLOB_MESSAGE };
    } else {
      word += ch;
      inWord = true;
      i++;
    }
  }
  endWord();
  return { ok: true, tokens };
}

/**
 * Parses one input line into a pipeline. v1 supports words, quotes, escapes,
 * `$VAR`, pipes and a final `>` or `>>`. Everything else gets a clear error.
 */
export function parse(line: string, env: Record<string, string> = {}): ParseResult {
  const tokenized = tokenize(line, env);
  if (!tokenized.ok) return tokenized;
  const { tokens } = tokenized;
  if (tokens.length === 0) return { ok: true, pipeline: null };

  const commands: SimpleCommand[] = [];
  let redirect: Redirect | undefined;
  let words: string[] = [];

  for (let i = 0; i < tokens.length; i++) {
    const token = tokens[i];
    if (token.kind === 'word') {
      words.push(token.value);
      continue;
    }
    if (token.value === '|') {
      if (words.length === 0) return syntaxError('|');
      if (redirect) {
        return {
          ok: false,
          message: 'bash: in this terminal, > and >> only work at the end of the line',
        };
      }
      commands.push({ name: words[0], args: words.slice(1) });
      words = [];
      continue;
    }
    const next = tokens[i + 1];
    if (!next || next.kind !== 'word') return syntaxError(next ? next.value : 'newline');
    redirect = { op: token.value, target: next.value };
    i++;
  }

  if (words.length === 0) {
    if (commands.length > 0) return syntaxError('newline');
    return { ok: false, message: `bash: a command is missing before '${redirect?.op ?? '>'}'` };
  }
  commands.push({ name: words[0], args: words.slice(1) });
  return { ok: true, pipeline: { commands, redirect, raw: line.trim() } };
}
