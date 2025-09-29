import React, { useEffect, useRef, useState, useCallback } from "react";
import SearchLibrary from "./searchLibrary.js";

export default function useSearch(
  apiFn,
  { debounceTime = 400, limit = 20 } = {}
) {
  const libRef = useRef(new SearchLibrary(apiFn, { debounceTime }));
  const lib = libRef?.current;

  const [query, setQuery] = useState("");
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(null);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(false);

  useEffect(() => {
    if (!query) {
      setItems([]);
      setTotal(null);
      setHasMore(false);
      return;
    }
    setLoading(true);
    lib
      .search(query, limit)
      .then((res) => {
        setItems(res.items);
        setTotal(res.total);
        setHasMore(res.hasMore);
      })
      .finally(() => setLoading(false));
  }, [query, limit, lib]);

  const loadMore = useCallback(() => {
    if (!query || loading || !hasMore) return;
    setLoading(true);
    lib
      .loadMore(query, limit)
      .then((res) => {
        setItems(res.items);
        setTotal(res.total);
        setHasMore(res.hasMore);
      })
      .finally(() => setLoading(false));
  }, [query, limit, loading, hasMore, lib]);

  return { items, total, loading, hasMore, setQuery, loadMore };
}
