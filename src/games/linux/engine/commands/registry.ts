import type { Command } from './types';

export class CommandRegistry {
  private readonly byName = new Map<string, Command>();

  constructor(private readonly commands: Command[]) {
    for (const command of commands) {
      for (const name of [command.name, ...(command.aliases ?? [])]) this.byName.set(name, command);
    }
  }

  get(name: string): Command | undefined {
    return this.byName.get(name);
  }

  /** One entry per command, sorted by name. */
  list(): Command[] {
    return [...this.commands].sort((a, b) => a.name.localeCompare(b.name));
  }

  /** Every name the player can type, aliases included (for Tab completion). */
  names(): string[] {
    return [...this.byName.keys()].sort();
  }
}
