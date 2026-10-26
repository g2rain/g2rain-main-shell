/**
 * Per-instanceId serial queue for mount / update / unmount / destroy.
 * Shared by RuntimeStore (and future adapters).
 */

const tails = new Map<string, Promise<unknown>>();

export function createInstanceQueue() {
  return {
    enqueue(instanceId: string, op: () => Promise<void>): Promise<void> {
      const prev = tails.get(instanceId) ?? Promise.resolve();
      const next = prev.catch(() => { }).then(op);
      tails.set(instanceId, next);
      void next.finally(() => {
        if (tails.get(instanceId) === next) {
          tails.delete(instanceId);
        }
      });
      return next as Promise<void>;
    },

    clear(instanceId: string): void {
      tails.delete(instanceId);
    },

    clearAll(): void {
      tails.clear();
    },
  };
}

export type InstanceQueue = ReturnType<typeof createInstanceQueue>;
