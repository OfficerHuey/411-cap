import { useReducer, useEffect, useCallback, useRef } from "react";

//discriminated union — one shape per state, no orphaned flags
export type AsyncState<T> =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "success"; data: T }
  | { status: "error"; error: string };

type AsyncAction<T> =
  | { type: "start" }
  | { type: "success"; data: T }
  | { type: "error"; error: string }
  | { type: "reset" };

function reducer<T>(_state: AsyncState<T>, action: AsyncAction<T>): AsyncState<T> {
  switch (action.type) {
    case "start":
      return { status: "loading" };
    case "success":
      return { status: "success", data: action.data };
    case "error":
      return { status: "error", error: action.error };
    case "reset":
      return { status: "idle" };
  }
}

const initialState: AsyncState<unknown> = { status: "idle" };

export function useAsyncData<T>(fetcher: () => Promise<T>, deps: unknown[] = []) {
  const [state, dispatch] = useReducer(
    reducer as React.Reducer<AsyncState<T>, AsyncAction<T>>,
    initialState as AsyncState<T>,
  );

  //keep the latest fetcher reference without forcing reload on every render
  const fetcherRef = useRef(fetcher);
  fetcherRef.current = fetcher;

  //track unmounted/stale to avoid setting state after navigation
  const activeKey = useRef(0);

  const reload = useCallback(async () => {
    const callKey = ++activeKey.current;
    dispatch({ type: "start" });
    try {
      const data = await fetcherRef.current();
      if (callKey !== activeKey.current) return;
      dispatch({ type: "success", data });
    } catch (err: any) {
      if (callKey !== activeKey.current) return;
      dispatch({ type: "error", error: err?.message || "Failed to load" });
    }
  }, []);

  useEffect(() => {
    reload();
    return () => { activeKey.current++; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return { state, reload };
}
