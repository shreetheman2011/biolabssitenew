"use client";

import { useEffect, useRef, useState } from "react";

export type SaveStatus = "idle" | "saving" | "saved" | "error";

export function useAutosave<T>(
  value: T,
  save: (value: T) => Promise<{ error?: string } | void>,
  options: { delay?: number; enabled?: boolean } = {}
): SaveStatus {
  const { delay = 1200, enabled = true } = options;
  const [status, setStatus] = useState<SaveStatus>("idle");
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const latestValue = useRef(value);
  const isFirstRun = useRef(true);
  const serialized = JSON.stringify(value);

  useEffect(() => {
    latestValue.current = value;
  }, [value]);

  useEffect(() => {
    if (!enabled) return;
    if (isFirstRun.current) {
      isFirstRun.current = false;
      return;
    }

    setStatus("saving");
    timeoutRef.current = setTimeout(async () => {
      const result = await save(latestValue.current);
      setStatus(result && "error" in result && result.error ? "error" : "saved");
    }, delay);

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [serialized, enabled]);

  return status;
}
