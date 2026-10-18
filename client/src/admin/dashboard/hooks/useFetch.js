import { useCallback, useEffect, useRef, useState } from "react";

export default function useFetch(fetcher, deps = [], options = {}) {
  const { initialData = null, keepPreviousData = true } = options;
  const [data, setData] = useState(initialData);
  const [loading, setLoading] = useState(initialData === null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState("");

  const fetcherRef = useRef(fetcher);
  fetcherRef.current = fetcher;

  const dataRef = useRef(data);
  dataRef.current = data;

  const activeCtrlRef = useRef(null);

  const execute = useCallback(
    async (_isBackground = false) => {
      // Abort prior in-flight request if any
      if (activeCtrlRef.current) {
        activeCtrlRef.current.abort();
      }
      const ctrl = new AbortController();
      activeCtrlRef.current = ctrl;

      const hasData = dataRef.current !== null;

      if (hasData && keepPreviousData) {
        setIsRefreshing(true);
        setLoading(false);
      } else {
        setLoading(true);
        setIsRefreshing(false);
      }

      setError("");

      try {
        const res = await fetcherRef.current(ctrl.signal);
        if (ctrl.signal.aborted) return;
        setData(res?.data ?? null);
        setError("");
      } catch (err) {
        if (ctrl.signal.aborted) return;
        // Keep existing data on background error, but expose readable message
        setError(err?.message || "Failed to load data");
      } finally {
        if (!ctrl.signal.aborted) {
          setLoading(false);
          setIsRefreshing(false);
        }
      }
    },
    [keepPreviousData],
  );

  useEffect(() => {
    execute(false);
    return () => {
      if (activeCtrlRef.current) {
        activeCtrlRef.current.abort();
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  const reload = useCallback(() => {
    return execute(true);
  }, [execute]);

  return {
    data,
    loading,
    isRefreshing,
    refreshing: isRefreshing,
    error,
    reload,
    setData,
  };
}
