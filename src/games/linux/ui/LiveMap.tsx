'use client';

import { hierarchy } from 'd3-hierarchy';
import { useEffect, useMemo, useRef } from 'react';
import { buildMapTree, type MapNode } from '../map-model';
import { UI } from '../strings';
import { useGame, useGameStore, useReducedMotion, useText } from './game-context';
import styles from './LiveMap.module.css';
import { Penguin } from './Penguin';

const ROW = 30;
const INDENT = 22;
/** Room on the left for the penguin. */
const GUTTER = 38;
const CHAR = 8.6;

interface Row {
  node: MapNode;
  depth: number;
  index: number;
  parentIndex: number | null;
}

function displayPath(path: string, home: string): string {
  if (path === home) return '~';
  return path.startsWith(`${home}/`) ? `~${path.slice(home.length)}` : path;
}

/** The folder tree the player has discovered, with the penguin on the current folder. */
export function LiveMap() {
  const t = useText();
  const store = useGameStore();
  const known = useGame((s) => s.known);
  const fsVersion = useGame((s) => s.fsVersion);
  const cwd = useGame((s) => s.cwd);
  const reducedMotion = useReducedMotion();
  const scroller = useRef<HTMLDivElement>(null);
  const shell = store.getState().getShell();
  const home = shell?.user.home ?? '/';

  const rows = useMemo(() => {
    if (!shell) return [];
    void fsVersion; // the file system changed: rebuild
    const list: Row[] = [];
    const indexOf = new Map<string, number>();
    hierarchy(buildMapTree(shell.vfs, known), (node) => node.children).eachBefore((d) => {
      indexOf.set(d.data.path, list.length);
      list.push({
        node: d.data,
        depth: d.depth,
        index: list.length,
        parentIndex: d.parent ? indexOf.get(d.parent.data.path)! : null,
      });
    });
    return list;
  }, [shell, known, fsVersion]);

  const current = rows.find((row) => row.node.path === cwd);

  useEffect(() => {
    scroller.current?.querySelector('[data-current]')?.scrollIntoView({
      block: 'nearest',
      inline: 'nearest',
      behavior: reducedMotion ? 'auto' : 'smooth',
    });
  }, [cwd, rows, reducedMotion]);

  const x = (depth: number) => GUTTER + depth * INDENT;
  const width = Math.max(
    ...rows.map((row) => x(row.depth) + 22 + (row.node.name.length + 2) * CHAR),
    200,
  );
  const height = rows.length * ROW + 12;
  const where = displayPath(cwd, home);

  return (
    <section className={styles.map} aria-label={t(UI.map)}>
      <header className={styles.header}>
        <span className={styles.path}>{where}</span>
      </header>
      <div className={styles.scroller} ref={scroller}>
        <svg
          width={width}
          height={height}
          className={styles.svg}
          role="img"
          aria-label={`${t(UI.map)}: ${t(UI.mapYouAreHere)} ${where}`}
        >
          <g transform="translate(0 6)">
            {rows.map((row) =>
              row.parentIndex === null ? null : (
                <path
                  key={`line:${row.node.path}`}
                  className={styles.link}
                  d={`M${x(row.depth - 1) + 6} ${row.parentIndex * ROW + ROW / 2 + 7} V${row.index * ROW + ROW / 2} H${x(row.depth) - 2}`}
                />
              ),
            )}
            {current && (
              <path
                className={styles.currentBand}
                d={`M0 ${current.index * ROW + 2}h${width}v${ROW - 4}h-${width}z`}
              />
            )}
            {rows.map((row) => {
              const isCurrent = row.node.path === cwd;
              return (
                <g
                  key={row.node.path}
                  className={styles.row}
                  data-type={row.node.type}
                  data-hidden={row.node.hidden || undefined}
                  data-current={isCurrent || undefined}
                  transform={`translate(${x(row.depth)} ${row.index * ROW})`}
                >
                  <g className={styles.pop}>
                    {row.node.type === 'dir' ? (
                      <rect
                        className={styles.dir}
                        x="0"
                        y={ROW / 2 - 6}
                        width="12"
                        height="12"
                        rx="2.5"
                      />
                    ) : (
                      <circle className={styles.file} cx="6" cy={ROW / 2} r="4.5" />
                    )}
                    <text className={styles.label} x="20" y={ROW / 2 + 4.5}>
                      {row.node.name}
                      {row.node.unexplored && (
                        <tspan className={styles.unexplored}>
                          {' …'}
                          <title>{t(UI.mapUnexplored)}</title>
                        </tspan>
                      )}
                    </text>
                  </g>
                </g>
              );
            })}
            {current && (
              <g
                className={styles.penguin}
                style={{
                  transform: `translate(${x(current.depth) - 32}px, ${current.index * ROW + 1}px)`,
                }}
              >
                <Penguin size={28} />
              </g>
            )}
          </g>
        </svg>
      </div>
    </section>
  );
}
