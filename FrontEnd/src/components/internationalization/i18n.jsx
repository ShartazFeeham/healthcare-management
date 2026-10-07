import { useState, useEffect } from "react";
import AxiosInstance from "scripts/axioInstance";

const API = "http://localhost:5400/v1/language/resources";

// One shared dictionary for the whole app. Every (tag, language) pair is requested at most once, so
// rendering a component never triggers a request loop (even when the translator is unreachable).
let cache = {};
let loaded = false;
let loading = null;
const requested = new Set();
const subscribers = new Set();
const notify = () => subscribers.forEach((bump) => bump((n) => n + 1));

const loadAll = () => {
  if (!loading) {
    loading = AxiosInstance.get(`${API}/map`)
      .then((result) => { cache = result.data || {}; })
      .catch(() => {})
      .finally(() => { loaded = true; notify(); });
  }
  return loading;
};

const useI18N = () => {
  const [, bump] = useState(0);

  useEffect(() => {
    subscribers.add(bump);
    loadAll();
    return () => subscribers.delete(bump);
  }, []);

  const text = (tag, alternative) => {
    const language = localStorage.getItem("language") || "English";
    const translated = cache[tag]?.translations?.[language]?.localizedText;
    if (translated) return translated;

    // English is the source language, and nothing is requested until the dictionary has loaded.
    if (language === "English" || !loaded) return alternative;

    const key = `${tag}|${language}`;
    if (!requested.has(key)) {
      requested.add(key);
      AxiosInstance.get(`${API}/map/${encodeURIComponent(tag)}/alternate/${encodeURIComponent(alternative)}`)
        .then((result) => {
          cache = { ...cache, [tag]: { ...(cache[tag] || {}), ...result.data } };
          notify();
        })
        .catch(() => {});
    }
    return alternative;
  };

  return { text, isBaseReady: loaded };
};

export default useI18N;
