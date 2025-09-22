import { createWorker, type Worker as TesseractWorker } from 'tesseract.js';
import type { OCRLanguage } from '../types/ocr-types';
import { getResourcePaths } from '../config/pathConfig';
import { appConfig } from '../config/appConfig';
import { recordMetric } from './PerformanceMonitor';

type LangKey = string;

interface WorkerEntry {
  id: string;
  worker: TesseractWorker;
  busy: boolean;
  lastUsed: number;
  useCount: number;
}

interface Pool {
  entries: WorkerEntry[];
  waiters: Array<(entry: WorkerEntry) => void>;
  capacity: number;
  creating: number;
}

// Map workerId -> progress callback (set per-lease)
const progressCallbacks = new Map<string, (progress: number) => void>();

function langKey(langs: OCRLanguage[]): LangKey {
  return [...langs].sort().join('+');
}

function now() { return Date.now(); }

async function create10LangWorker(langs: OCRLanguage[], id: string, onLog?: (m: any) => void): Promise<TesseractWorker> {
  const paths = await getResourcePaths();
  let coreLogged = false;
  const logger = (m: any) => {
    if (!coreLogged && m?.status === 'loading tesseract core') {
      coreLogged = true;
      try {
        const core = paths.corePath || '';
        const auto = !core.endsWith('.wasm.js');
        const label = auto ? 'auto-select (directory)' : `explicit (${core.split('/').pop()})`;
        console.info(`[OCR] Tesseract core: ${label} at ${core}${auto ? ' — SIMD/LSTM expected if supported' : ''}`);
      } catch {}
    }
    // Only forward recognition progress and only if a callback is assigned to this worker id
    if (m?.status === 'recognizing text' && typeof m.progress === 'number') {
      const cb = progressCallbacks.get(id);
      if (cb) {
        try { cb(m.progress); } catch { /* ignore */ }
      }
    }
    if (appConfig.dev.LOGGING.ENABLED && onLog) onLog(m);
  };

  const worker = await createWorker(langs, 1, {
    logger,
    workerPath: paths.workerPath,
    corePath: paths.corePath,
    langPath: paths.langPath.endsWith('/') ? paths.langPath : paths.langPath + '/',
  } as any);

  try { await worker.setParameters({ classify_enable_learning: '0' }); } catch {}
  return worker;
}

export class OCRWorkerPool {
  private static pools: Map<LangKey, Pool> = new Map();

  static getPool(langs: OCRLanguage[]): Pool | undefined {
    return this.pools.get(langKey(langs));
  }

  static async ensurePool(langs: OCRLanguage[], size: number): Promise<void> {
    const key = langKey(langs);
    let pool = this.pools.get(key);
    if (!pool) {
      pool = { entries: [], waiters: [], capacity: Math.max(1, size), creating: 0 };
      this.pools.set(key, pool);
    } else {
      pool.capacity = Math.max(1, size);
    }

    const toCreate = Math.max(0, pool.capacity - (pool.entries.length + pool.creating));
    if (toCreate <= 0) return;

    const createOne = async () => {
      pool!.creating += 1;
      const id = `w-${Math.random().toString(36).slice(2, 9)}-${Date.now()}`;
      try {
        const worker = await create10LangWorker(langs, id);
        const entry: WorkerEntry = { id, worker, busy: false, lastUsed: now(), useCount: 0 };
        pool!.entries.push(entry);
      } finally {
        pool!.creating -= 1;
      }
    };

    await Promise.all(Array.from({ length: toCreate }, createOne));
  }

  static async acquire(langs: OCRLanguage[], opts?: { onProgress?: (p: number) => void; timeoutMs?: number })
    : Promise<{ worker: TesseractWorker, release: (failed?: boolean) => Promise<void> }>
  {
    const t0 = (typeof performance !== 'undefined' ? performance.now() : Date.now());
    const key = langKey(langs);
    let pool = this.pools.get(key);
    if (!pool) {
      const size = appConfig.cache.OCR.MULTIWORKER_POOL_SIZE || 2;
      await this.ensurePool(langs, size);
      pool = this.pools.get(key)!;
    }

    const tryTake = (): WorkerEntry | null => {
      for (const entry of pool!.entries) {
        if (!entry.busy) {
          entry.busy = true;
          entry.lastUsed = now();
          entry.useCount += 1;
          return entry;
        }
      }
      return null;
    };

    const immediate = tryTake();
    if (!immediate) {
      // If capacity not reached, create one and take it immediately after creation
      if (pool!.entries.length + pool!.creating < pool!.capacity) {
        await this.ensurePool(langs, pool!.capacity);
        const created = tryTake();
        if (created) {
          if (opts?.onProgress) progressCallbacks.set(created.id, opts.onProgress);
          const t1 = (typeof performance !== 'undefined' ? performance.now() : Date.now());
          try { recordMetric('ocr.pool.acquire_wait_ms', t1 - t0, 'ocr', { key }); } catch {}
          return {
            worker: created.worker,
            release: async (failed?: boolean) => {
              progressCallbacks.delete(created.id);
              if (failed) {
                try { await created.worker.terminate(); } catch {}
                // Replace with a fresh worker to keep capacity
                const replacement = await create10LangWorker(langs, created.id);
                created.worker = replacement;
              }
              created.busy = false;
              // Hand off to waiter if present
              const waiter = pool!.waiters.shift();
              if (waiter) {
                created.busy = true;
                waiter(created);
              }
            }
          };
        }
      }
    } else {
      if (opts?.onProgress) progressCallbacks.set(immediate.id, opts.onProgress);
      const t1 = (typeof performance !== 'undefined' ? performance.now() : Date.now());
      try { recordMetric('ocr.pool.acquire_wait_ms', t1 - t0, 'ocr', { key }); } catch {}
      return {
        worker: immediate.worker,
        release: async (failed?: boolean) => {
          progressCallbacks.delete(immediate.id);
          if (failed) {
            try { await immediate.worker.terminate(); } catch {}
            const replacement = await create10LangWorker(langs, immediate.id);
            immediate.worker = replacement;
          }
          immediate.busy = false;
          const waiter = pool!.waiters.shift();
          if (waiter) {
            immediate.busy = true;
            waiter(immediate);
          }
        }
      };
    }

    // Wait for release
    return new Promise((resolve, reject) => {
      const timeout = opts?.timeoutMs ?? 30_000;
      const timer = setTimeout(() => {
        const idx = pool!.waiters.indexOf(waiter);
        if (idx >= 0) pool!.waiters.splice(idx, 1);
        reject(new Error('OCRWorkerPool.acquire timeout'));
      }, timeout);

      const waiter = (entry: WorkerEntry) => {
        clearTimeout(timer);
        const t1 = (typeof performance !== 'undefined' ? performance.now() : Date.now());
        try { recordMetric('ocr.pool.acquire_wait_ms', t1 - t0, 'ocr', { key }); } catch {}
        if (opts?.onProgress) progressCallbacks.set(entry.id, opts.onProgress);
        resolve({
          worker: entry.worker,
          release: async (failed?: boolean) => {
            progressCallbacks.delete(entry.id);
            if (failed) {
              try { await entry.worker.terminate(); } catch {}
              const replacement = await create10LangWorker(langs, entry.id);
              entry.worker = replacement;
            }
            entry.busy = false;
            const next = pool!.waiters.shift();
            if (next) {
              entry.busy = true;
              next(entry);
            }
          }
        });
      };
      pool!.waiters.push(waiter);
    });
  }

  static async terminateAll() {
    for (const pool of this.pools.values()) {
      for (const entry of pool.entries) {
        try { await entry.worker.terminate(); } catch {}
      }
      pool.entries = [];
      pool.waiters = [];
      pool.creating = 0;
    }
    this.pools.clear();
    progressCallbacks.clear();
  }

  static getPoolStats() {
    const stats: Record<string, any> = {};
    for (const [key, pool] of this.pools.entries()) {
      stats[key] = {
        capacity: pool.capacity,
        total: pool.entries.length,
        busy: pool.entries.filter(e => e.busy).length,
        creating: pool.creating,
        useCounts: pool.entries.map(e => e.useCount),
      };
    }
    return stats;
  }
}
