import { describe, expect, it } from 'vitest';
import { parse } from '@/src/games/linux/engine/parser/parser';

function pipelineOf(line: string, env: Record<string, string> = {}) {
  const result = parse(line, env);
  if (!result.ok) throw new Error(result.message);
  return result.pipeline;
}

function errorOf(line: string) {
  const result = parse(line);
  if (result.ok) throw new Error('expected a parse error');
  return result.message;
}

describe('parser', () => {
  it('splits words and keeps the raw line', () => {
    expect(pipelineOf('  ls   -la  docs ')).toEqual({
      commands: [{ name: 'ls', args: ['-la', 'docs'] }],
      redirect: undefined,
      raw: 'ls   -la  docs',
    });
  });

  it('returns null for empty lines and comments', () => {
    expect(pipelineOf('   ')).toBeNull();
    expect(pipelineOf('# just a comment')).toBeNull();
  });

  it('handles quotes and escapes', () => {
    expect(pipelineOf(`echo "hello world" 'a  b' c\\ d ""`)?.commands[0].args).toEqual([
      'hello world',
      'a  b',
      'c d',
      '',
    ]);
    expect(pipelineOf('echo "say \\"hi\\""')?.commands[0].args).toEqual(['say "hi"']);
  });

  it('expands variables, but not inside single quotes', () => {
    const env = { HOME: '/home/intern' };
    expect(pipelineOf('echo $HOME "$HOME/x" \'$HOME\'', env)?.commands[0].args).toEqual([
      '/home/intern',
      '/home/intern/x',
      '$HOME',
    ]);
    expect(pipelineOf('echo $NOPE end', env)?.commands[0].args).toEqual(['end']);
  });

  it('parses pipes and a final redirect', () => {
    expect(pipelineOf('cat log | sort | uniq -c > out.txt')).toMatchObject({
      commands: [
        { name: 'cat', args: ['log'] },
        { name: 'sort', args: [] },
        { name: 'uniq', args: ['-c'] },
      ],
      redirect: { op: '>', target: 'out.txt' },
    });
    expect(pipelineOf('echo hi >>log.txt')?.redirect).toEqual({ op: '>>', target: 'log.txt' });
    expect(pipelineOf('grep "a|b" file')?.commands[0].args).toEqual(['a|b', 'file']);
  });

  it('gives bash-like syntax errors', () => {
    expect(errorOf('| ls')).toBe("bash: syntax error near unexpected token `|'");
    expect(errorOf('ls >')).toBe("bash: syntax error near unexpected token `newline'");
    expect(errorOf('ls |')).toBe("bash: syntax error near unexpected token `newline'");
    expect(errorOf("echo 'oops")).toBe("bash: unexpected EOF while looking for matching `''");
  });

  it('explains what is not supported yet', () => {
    expect(errorOf('ls; pwd')).toContain("';' is not supported");
    expect(errorOf('ls && pwd')).toContain("'&&' is not supported");
    expect(errorOf('rm *.txt')).toContain('wildcards');
    expect(errorOf('ls > a | wc')).toContain('only work at the end');
    expect(errorOf('> file')).toContain('a command is missing');
  });

  it('allows wildcards inside quotes', () => {
    expect(pipelineOf('find . -name "*.txt"')?.commands[0].args).toEqual(['.', '-name', '*.txt']);
  });
});
