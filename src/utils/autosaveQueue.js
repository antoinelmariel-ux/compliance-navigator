const DEFAULT_BASE_DELAY = 1000;
const MAX_RETRY_DELAY = 8000;

const wait = (delay) => new Promise((resolve) => {
  setTimeout(resolve, delay);
});

export const createAutosaveQueue = ({ processItem, onStatusChange }) => {
  const queue = [];
  let isRunning = false;

  const setStatus = (status, details = {}) => {
    if (typeof onStatusChange === 'function') {
      onStatusChange(status, details);
    }
  };

  const run = async () => {
    if (isRunning) {
      return;
    }

    isRunning = true;
    while (queue.length > 0) {
      const item = queue.shift();

      if (typeof navigator !== 'undefined' && navigator.onLine === false) {
        queue.unshift(item);
        setStatus('offline', { queueSize: queue.length });
        isRunning = false;
        return;
      }

      setStatus('syncing', { queueSize: queue.length + 1 });

      try {
        const result = await processItem(item);
        setStatus('synced', {
          queueSize: queue.length,
          updatedAt: result?.updatedAt,
          updatedBy: result?.updatedBy,
          projectId: item?.project?.id
        });
      } catch (error) {
        if (error?.name === 'ConflictError') {
          setStatus('conflict', {
            queueSize: queue.length,
            error,
            projectId: item?.project?.id,
            serverRecord: error.serverRecord
          });
          continue;
        }

        const retryCount = (item.retryCount || 0) + 1;
        const retryDelay = Math.min(DEFAULT_BASE_DELAY * (2 ** (retryCount - 1)), MAX_RETRY_DELAY);
        queue.unshift({
          ...item,
          retryCount
        });
        setStatus('syncing', { queueSize: queue.length, retryInMs: retryDelay });
        await wait(retryDelay);
      }
    }

    isRunning = false;
  };

  return {
    enqueue(item) {
      queue.push({ ...item, retryCount: 0 });
      run();
    },
    flush() {
      run();
    },
    size() {
      return queue.length;
    }
  };
};
