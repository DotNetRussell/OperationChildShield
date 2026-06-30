type Task<T> = () => Promise<T>;

class FetchQueue {
  private queue: Array<{
    task: Task<unknown>;
    resolve: (value: unknown) => void;
    reject: (reason: unknown) => void;
  }> = [];
  private active = 0;

  constructor(private maxConcurrent = 3) {}

  enqueue<T>(task: Task<T>): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      this.queue.push({
        task: task as Task<unknown>,
        resolve: resolve as (value: unknown) => void,
        reject,
      });
      this.drain();
    });
  }

  private drain() {
    while (this.active < this.maxConcurrent && this.queue.length > 0) {
      const item = this.queue.shift();
      if (!item) return;
      this.active++;
      item
        .task()
        .then(item.resolve)
        .catch(item.reject)
        .finally(() => {
          this.active--;
          this.drain();
        });
    }
  }
}

export const reportCardQueue = new FetchQueue(3);