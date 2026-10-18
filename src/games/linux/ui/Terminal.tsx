'use client';

import { FitAddon } from '@xterm/addon-fit';
import { Terminal as XTerm } from '@xterm/xterm';
import '@xterm/xterm/css/xterm.css';
import { useEffect, useRef } from 'react';
import { getProgressStore } from '@/src/shared/progress';
import { pickText } from '@/src/shared/i18n/text';
import { complete } from '../completion';
import { UI } from '../strings';
import { useGameStore } from './game-context';
import styles from './Terminal.module.css';

/** Tokyo Night (PRD section 8). */
const THEME = {
  background: '#16161e',
  foreground: '#c0caf5',
  cursor: '#c0caf5',
  cursorAccent: '#16161e',
  selectionBackground: '#33467c',
  black: '#15161e',
  red: '#f7768e',
  green: '#9ece6a',
  yellow: '#e0af68',
  blue: '#7aa2f7',
  magenta: '#bb9af7',
  cyan: '#7dcfff',
  white: '#a9b1d6',
  brightBlack: '#414868',
  brightRed: '#f7768e',
  brightGreen: '#9ece6a',
  brightYellow: '#e0af68',
  brightBlue: '#7aa2f7',
  brightMagenta: '#bb9af7',
  brightCyan: '#7dcfff',
  brightWhite: '#c0caf5',
};

const HOST = 'fst';
const ANSI = {
  reset: '\x1b[0m',
  user: '\x1b[1;32m',
  path: '\x1b[1;34m',
  ok: '\x1b[32m',
  bad: '\x1b[31m',
};

const crlf = (text: string) => text.replace(/\r?\n/g, '\r\n');

/**
 * The player's terminal. xterm.js only draws; this component is the line
 * editor (cursor, history, Tab) and sends finished lines to the game store.
 */
export default function Terminal() {
  const store = useGameStore();
  const container = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const element = container.current;
    const shell = store.getState().getShell();
    if (!element || !shell) return;

    const fontFamily =
      getComputedStyle(element).getPropertyValue('--font-mono').trim() || 'monospace';
    const term = new XTerm({
      fontFamily,
      fontSize: 15,
      lineHeight: 1.25,
      cursorBlink: true,
      scrollback: 2000,
      theme: THEME,
    });
    const fit = new FitAddon();
    term.loadAddon(fit);
    term.open(element);
    fit.fit();
    const resize = new ResizeObserver(() => fit.fit());
    resize.observe(element);
    let disposed = false;
    // Re-measure the cells once JetBrains Mono has loaded.
    void document.fonts.ready.then(() => {
      if (disposed) return;
      term.options.fontFamily = 'monospace';
      term.options.fontFamily = fontFamily;
      fit.fit();
    });

    let buffer = '';
    let cursor = 0;
    let historyIndex = -1;
    let draft = '';
    let lastWasTab = false;
    /** Cursor position (in cells from the prompt start) after the last render. */
    let renderedCursor = 0;

    const commandNames = new Set(shell.commandNames());
    const lang = () => getProgressStore().getState().settings.language;

    const promptText = () => {
      const cwd = shell.cwd();
      const home = shell.user.home;
      const shown =
        cwd === home ? '~' : cwd.startsWith(`${home}/`) ? `~${cwd.slice(home.length)}` : cwd;
      return {
        plain: `${shell.user.name}@${HOST}:${shown}$ `,
        colored: `${ANSI.user}${shell.user.name}@${HOST}${ANSI.reset}:${ANSI.path}${shown}${ANSI.reset}$ `,
      };
    };

    /** The command word turns green when it exists, red when it does not (PRD section 8). */
    const highlight = (line: string) => {
      const match = /^(\s*)(\S+)(.*)$/.exec(line);
      if (!match) return line;
      const [, space, word, rest] = match;
      const known = commandNames.has(word);
      const color = known ? ANSI.ok : rest || line.endsWith(' ') ? ANSI.bad : ANSI.reset;
      return `${space}${color}${word}${ANSI.reset}${rest}`;
    };

    /** Redraws prompt + line, even when it wraps over several rows. */
    const render = () => {
      const { plain, colored } = promptText();
      const cols = term.cols;
      const up = Math.floor(renderedCursor / cols);
      let out = up > 0 ? `\x1b[${up}A` : '';
      out += `\r\x1b[J${colored}${highlight(buffer)}`;
      const end = plain.length + buffer.length;
      const target = plain.length + cursor;
      const endRow = Math.floor(end / cols);
      const targetRow = Math.floor(target / cols);
      if (endRow > targetRow) out += `\x1b[${endRow - targetRow}A`;
      out += `\x1b[${(target % cols) + 1}G`;
      term.write(out);
      renderedCursor = target;
    };

    const newPrompt = () => {
      buffer = '';
      cursor = 0;
      renderedCursor = 0;
      historyIndex = -1;
      render();
    };

    const moveToEnd = () => {
      cursor = buffer.length;
      render();
    };

    const runLine = () => {
      moveToEnd();
      term.write('\r\n');
      const result = store.getState().run(buffer);
      if (result) {
        for (const chunk of result.chunks) term.write(crlf(chunk.text));
      }
      newPrompt();
    };

    const insert = (text: string) => {
      buffer = buffer.slice(0, cursor) + text + buffer.slice(cursor);
      cursor += text.length;
      render();
    };

    const showHistory = (direction: -1 | 1) => {
      const history = shell.history();
      if (!history.length) return;
      if (historyIndex === -1) {
        if (direction === 1) return;
        draft = buffer;
        historyIndex = history.length;
      }
      historyIndex = Math.min(Math.max(historyIndex + direction, 0), history.length);
      buffer = historyIndex === history.length ? draft : history[historyIndex];
      if (historyIndex === history.length) historyIndex = -1;
      cursor = buffer.length;
      render();
    };

    /** Like bash: one Tab completes, a second Tab lists the choices. */
    const tab = (repeated: boolean) => {
      if (cursor !== buffer.length) return;
      const result = complete(shell, buffer);
      if (result.line !== buffer) {
        buffer = result.line;
        cursor = buffer.length;
        render();
      } else if (result.candidates.length && repeated) {
        moveToEnd();
        term.write(`\r\n${result.candidates.join('  ')}\r\n`);
        renderedCursor = 0;
        render();
      } else {
        term.write('\x07');
      }
    };

    const keys: Record<string, () => void> = {
      '\r': runLine,
      '\x7f': () => {
        if (cursor === 0) return;
        buffer = buffer.slice(0, cursor - 1) + buffer.slice(cursor);
        cursor--;
        render();
      },
      '\x1b[3~': () => {
        buffer = buffer.slice(0, cursor) + buffer.slice(cursor + 1);
        render();
      },
      '\x1b[D': () => {
        cursor = Math.max(0, cursor - 1);
        render();
      },
      '\x1b[C': () => {
        cursor = Math.min(buffer.length, cursor + 1);
        render();
      },
      '\x1b[A': () => showHistory(-1),
      '\x1b[B': () => showHistory(1),
      '\x1b[H': () => {
        cursor = 0;
        render();
      },
      '\x1b[F': moveToEnd,
      '\x01': () => {
        cursor = 0;
        render();
      },
      '\x05': moveToEnd,
      '\x15': () => {
        buffer = buffer.slice(cursor);
        cursor = 0;
        render();
      },
      '\x03': () => {
        moveToEnd();
        term.write('^C\r\n');
        newPrompt();
      },
      '\x0c': () => {
        term.clear();
        render();
      },
    };
    keys['\x1bOH'] = keys['\x1b[H'];
    keys['\x1bOF'] = keys['\x1b[F'];

    const onData = term.onData((data) => {
      const repeatedTab = lastWasTab;
      lastWasTab = data === '\t';
      if (data === '\t') return tab(repeatedTab);
      const handler = keys[data];
      if (handler) return handler();
      if (data.startsWith('\x1b')) return;
      // Typing or pasting. A pasted line break runs the first line.
      const [first, ...rest] = data.split(/\r\n|\r|\n/);
      const text = first.replace(/[\x00-\x1f\x7f]/g, '');
      if (text) insert(text);
      if (rest.length) runLine();
    });

    // Ctrl+C copies when text is selected; Ctrl+V pastes (the browser handles both).
    term.attachCustomKeyEventHandler((event) => {
      const mod = event.ctrlKey || event.metaKey;
      if (event.type === 'keydown' && mod && event.key === 'c' && term.hasSelection()) {
        void navigator.clipboard?.writeText(term.getSelection());
        return false;
      }
      return !(mod && event.key === 'v');
    });

    const offClear = shell.events.on('clear', () => term.clear());

    term.write(crlf(`${pickText(UI.terminalWelcome, lang())}\n\n`));
    newPrompt();
    term.focus();

    return () => {
      disposed = true;
      offClear();
      onData.dispose();
      resize.disconnect();
      term.dispose();
    };
  }, [store]);

  return (
    <div
      ref={container}
      className={styles.terminal}
      onClick={() => container.current?.querySelector('textarea')?.focus()}
    />
  );
}
