"use client";

import { useSyncExternalStore } from "react";

const searchParamsChangeEvent = "sidestage:search-params-change";

function subscribe(onChange: () => void) {
  window.addEventListener("popstate", onChange);
  window.addEventListener(searchParamsChangeEvent, onChange);
  return () => {
    window.removeEventListener("popstate", onChange);
    window.removeEventListener(searchParamsChangeEvent, onChange);
  };
}

function getSearch() {
  return window.location.search;
}

function getServerSearch() {
  return "";
}

export function useUrlSearchParams() {
  const search = useSyncExternalStore(subscribe, getSearch, getServerSearch);
  return new URLSearchParams(search);
}

export function updateUrlSearchParams(updates: Record<string, string | null>) {
  const params = new URLSearchParams(window.location.search);
  for (const [key, value] of Object.entries(updates)) {
    if (value) params.set(key, value);
    else params.delete(key);
  }
  const search = params.toString();
  window.history.replaceState(null, "", `${window.location.pathname}${search ? `?${search}` : ""}${window.location.hash}`);
  window.dispatchEvent(new Event(searchParamsChangeEvent));
}
