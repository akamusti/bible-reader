import type { Manifest, Translation, TranslationMeta } from "./types";

const cache = new Map<string, Translation>();
const pending = new Map<string, Promise<Translation>>();

function assetUrl(path: string): string {
  return `${import.meta.env.BASE_URL}${path.replace(/^\.?\//, "")}`;
}

async function fetchJson<T>(path: string): Promise<T> {
  const res = await fetch(assetUrl(path), { cache: "force-cache" });
  if (!res.ok) throw new Error(`${res.status} ${res.statusText} — ${path}`);
  return (await res.json()) as T;
}

export async function loadManifest(): Promise<Manifest> {
  return fetchJson<Manifest>("data/manifest.json");
}

export function loadTranslation(meta: TranslationMeta): Promise<Translation> {
  const cached = cache.get(meta.id);
  if (cached) return Promise.resolve(cached);
  const inFlight = pending.get(meta.id);
  if (inFlight) return inFlight;

  const promise = fetchJson<Translation>(meta.file)
    .then((data) => {
      cache.set(meta.id, data);
      pending.delete(meta.id);
      return data;
    })
    .catch((err) => {
      pending.delete(meta.id);
      throw err;
    });

  pending.set(meta.id, promise);
  return promise;
}

export function translationBook(translation: Translation, bookId: string) {
  return translation.books.find((b) => b.id === bookId);
}
