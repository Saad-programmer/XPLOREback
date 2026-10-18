import { cat } from './cat';
import { cd } from './cd';
import { chmod } from './chmod';
import { clear } from './clear';
import { cp } from './cp';
import { echo } from './echo';
import { exit } from './exit';
import { find } from './find';
import { grep } from './grep';
import { head } from './head';
import { help } from './help';
import { history } from './history';
import { ls } from './ls';
import { man } from './man';
import { mkdir } from './mkdir';
import { mv } from './mv';
import { pwd } from './pwd';
import { CommandRegistry } from './registry';
import { rm } from './rm';
import { sl } from './sl';
import { sort } from './sort';
import { sudo } from './sudo';
import { tail } from './tail';
import { touch } from './touch';
import { uniq } from './uniq';
import { vim } from './vim';
import { wc } from './wc';
import { whoami } from './whoami';
import type { Command } from './types';

/** v1 commands (PRD section 10). Adding a command = one file + one line here. */
export const LINUX_COMMANDS: Command[] = [
  // Navigation
  pwd,
  ls,
  cd,
  clear,
  // Reading
  cat,
  head,
  tail,
  wc,
  echo,
  // Files
  mkdir,
  touch,
  cp,
  mv,
  rm,
  // Search
  grep,
  find,
  // Text
  sort,
  uniq,
  // Permissions
  whoami,
  chmod,
  // Help
  help,
  man,
  history,
  // Fun
  sl,
  sudo,
  vim,
  exit,
];

export function createRegistry(commands: Command[] = LINUX_COMMANDS): CommandRegistry {
  return new CommandRegistry(commands);
}
