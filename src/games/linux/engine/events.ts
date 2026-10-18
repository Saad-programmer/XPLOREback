import type { ErrorKind } from './types';

export type SpecialKind =
  'rm_rf_root' | 'sudo' | 'sudo_spam' | 'sl' | 'vim_trap' | 'cd_into_file' | 'exit';

export type EngineEvent =
  | {
      type: 'command';
      raw: string;
      /** First command of the line, '' when the line did not parse. */
      name: string;
      /** All command names of the pipeline, in order. */
      names: string[];
      args: string[];
      exitCode: number;
      errorKind?: ErrorKind;
      pipeLength: number;
      redirect?: '>' | '>>';
    }
  | { type: 'cwd_changed'; from: string; to: string }
  | {
      type: 'fs_changed';
      change: 'create' | 'delete' | 'move' | 'modify' | 'chmod';
      path: string;
      /** New path, for 'move'. */
      to?: string;
      nodeType: 'file' | 'dir';
    }
  | { type: 'special'; kind: SpecialKind }
  | { type: 'goal_reached'; missionId: string }
  | { type: 'clear' };

export type EngineEventType = EngineEvent['type'];
export type EventOf<T extends EngineEventType> = Extract<EngineEvent, { type: T }>;
type Handler = (event: EngineEvent) => void;

/** Small typed emitter. The UI, sounds, memes and goal checker listen to it. */
export class EventBus {
  private readonly handlers = new Map<string, Set<Handler>>();

  /** Listens to one event type, or to all with '*'. Returns an unsubscribe function. */
  on<T extends EngineEventType | '*'>(
    type: T,
    handler: (event: T extends EngineEventType ? EventOf<T> : EngineEvent) => void,
  ): () => void {
    const set = this.handlers.get(type) ?? new Set<Handler>();
    set.add(handler as Handler);
    this.handlers.set(type, set);
    return () => set.delete(handler as Handler);
  }

  emit(event: EngineEvent): void {
    this.handlers.get(event.type)?.forEach((handler) => handler(event));
    this.handlers.get('*')?.forEach((handler) => handler(event));
  }
}
