// Interactive drill-down for a bare `qpq`: the colon-separated command names
// form a tree (go, go:dev, go:dev:api, ...). Each menu level renders its
// options as the full command line they resolve to (`qpq go:dev:api`) with
// the command's summary alongside, groups shown as `qpq go:??`, and drilling
// continues until the user picks a runnable leaf. Rows are deliberately left
// unstyled so inquirer's active-item highlight colours the whole row.
import { promptSelectDetailed } from '../lib/prompts';
import { CliCommand } from './commandRegistry';

type MenuChoice = { kind: 'run'; command: CliCommand } | { kind: 'drill'; prefix: string } | { kind: 'back' };

type MenuRow = { label: string; summary?: string; value: MenuChoice };

const lastSegment = (name: string): string => name.split(':').slice(-1)[0];

// The first path segment of `name` below `prefix` ('' means the tree root).
const childSegment = (name: string, prefix: string): string => name.slice(prefix ? prefix.length + 1 : 0).split(':')[0];

const runRow = (command: CliCommand): MenuRow => ({
  label: `qpq ${command.name}`,
  summary: command.summary,
  value: { kind: 'run', command },
});

const buildRows = (commands: CliCommand[], prefix: string): MenuRow[] => {
  const exact = prefix ? commands.find((command) => command.name === prefix) : undefined;
  const deeper = commands.filter((command) => command.name !== prefix && (!prefix || command.name.startsWith(`${prefix}:`)));
  const segments = [...new Set(deeper.map((command) => childSegment(command.name, prefix)))];

  const groupRows: MenuRow[] = [];
  const leafRows: MenuRow[] = [];

  for (const segment of segments) {
    const segmentPrefix = prefix ? `${prefix}:${segment}` : segment;
    const subtree = deeper.filter((command) => command.name === segmentPrefix || command.name.startsWith(`${segmentPrefix}:`));

    if (subtree.length === 1 && subtree[0].name === segmentPrefix) {
      leafRows.push(runRow(subtree[0]));
    } else {
      // A group's summary is its own runnable command's summary when it has
      // one, otherwise a listing of what's inside.
      const groupSummary = subtree.find((command) => command.name === segmentPrefix)?.summary;
      groupRows.push({
        label: `qpq ${segmentPrefix}:??`,
        summary: groupSummary ?? subtree.map((command) => lastSegment(command.name)).join(', '),
        value: { kind: 'drill', prefix: segmentPrefix },
      });
    }
  }

  // The current prefix's own command (run what this menu is named after)
  // leads, then groups, then the remaining runnable commands.
  const rows = [...(exact ? [runRow(exact)] : []), ...groupRows, ...leafRows];

  if (prefix) {
    rows.push({ label: '(back)', value: { kind: 'back' } });
  }

  return rows;
};

// Align the rows into two columns: the command line, then its summary.
const toChoices = (rows: MenuRow[]): { name: string; value: MenuChoice; short?: string }[] => {
  const columnWidth = Math.max(...rows.map((row) => row.label.length)) + 2;

  return rows.map((row) => ({
    name: row.summary ? `${row.label.padEnd(columnWidth)}${row.summary}` : row.label,
    value: row.value,
    short: row.label,
  }));
};

// Walk the menu until a runnable command is picked.
export const promptCommandFromMenu = async (commands: CliCommand[]): Promise<CliCommand> => {
  let prefix = '';

  for (;;) {
    const picked = await promptSelectDetailed<MenuChoice>('Run:', toChoices(buildRows(commands, prefix)));

    if (picked.kind === 'run') {
      return picked.command;
    }

    prefix = picked.kind === 'drill' ? picked.prefix : prefix.split(':').slice(0, -1).join(':');
  }
};
