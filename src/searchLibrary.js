export default class SearchLibrary {
  constructor(apiFn, { debounceTime = 400, maxQueries = 200 } = {}) {
    if (typeof apiFn !== "function")
      throw new Error("apiFn must be a function");
    this.apiFn = apiFn;
    this.debounceTime = debounceTime;
    this.maxQueries = maxQueries;
    this.cache = new Map();
    this.pendingRequests = new Map();
    this.debounceTimers = new Map();
    this.debouncePromises = new Map();
    this.abortControllers = new Map();
  }

  _normalize(s) {
    return String(s || "")
      .trim()
      .toLowerCase();
  }
  _keyBase(s, limit) {
    return `${this._normalize(s)}|${Number(limit)}`;
  }
  _pageKey(base, offset) {
    return `${base}|${Number(offset)}`;
  }

  _ensureCache(base) {
    if (!this.cache.has(base)) {
      this.cache.set(base, {
        pages: new Map(),
        total: null,
        lastAccess: Date.now(),
      });
      if (this.cache.size > this.maxQueries)
        this.cache.delete(this.cache.keys().next().value);
    }
    return this.cache.get(base);
  }

  _combinedItems(entry) {
    if (!entry) return [];
    const offs = [...entry.pages.keys()].map(Number).sort((a, b) => a - b);
    return offs.flatMap((o) => entry.pages.get(o));
  }

  async fetchPage(query, limit, offset) {
    const base = this._keyBase(query, limit);
    const key = this._pageKey(base, offset);

    if (this.pendingRequests.has(key)) return this.pendingRequests.get(key);
    const entry = this._ensureCache(base);

    if (entry.pages.has(offset)) {
      return Promise.resolve({
        items: this._combinedItems(entry),
        total: entry.total,
        hasMore:
          entry.total === null
            ? true
            : this._combinedItems(entry).length < entry.total,
      });
    }

    const ctrl = new AbortController();
    this.abortControllers.set(key, ctrl);

    const p = (async () => {
      try {
        const res = await this.apiFn(query, limit, offset, ctrl.signal);
        if (!res || !Array.isArray(res.items))
          throw new Error("apiFn must return {items:[], total:number}");
        entry.pages.set(offset, res.items);
        if (typeof res.total === "number") entry.total = res.total;
        return {
          items: this._combinedItems(entry),
          total: entry.total,
          hasMore:
            entry.total === null
              ? true
              : this._combinedItems(entry).length < entry.total,
        };
      } finally {
        this.pendingRequests.delete(key);
        this.abortControllers.delete(key);
      }
    })();

    this.pendingRequests.set(key, p);
    return p;
  }

  search(query, limit = 10) {
    this.latestQuery = { query, limit };

    if (this.debouncePromise) return this.debouncePromise;

    let resFn, rejFn;
    this.debouncePromise = new Promise((res, rej) => {
      resFn = res;
      rejFn = rej;
    });
    this.debounceResolve = resFn;
    this.debounceReject = rejFn;

    if (this.debounceTimer) clearTimeout(this.debounceTimer);

    this.debounceTimer = setTimeout(() => {
      this.debounceTimer = null;
      const { query, limit } = this.latestQuery;

      this.fetchPage(query, limit, 0)
        .then((r) => {
          this.debounceResolve(r);
          this.debouncePromise = null;
        })
        .catch((e) => {
          this.debounceReject(e);
          this.debouncePromise = null;
        });
    }, this.debounceTime);

    return this.debouncePromise;
  }

  loadMore(query, limit = 10) {
    const base = this._keyBase(query, limit);
    const entry = this._ensureCache(base);
    const count = this._combinedItems(entry).length;
    if (entry.total !== null && count >= entry.total) {
      return Promise.resolve({
        items: this._combinedItems(entry),
        total: entry.total,
        hasMore: false,
      });
    }
    return this.fetchPage(query, limit, count);
  }
}
