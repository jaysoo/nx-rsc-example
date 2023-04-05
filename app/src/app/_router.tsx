// @ts-ignore
import { StrictMode, useEffect, useState, use, startTransition } from 'react';
import { createRoot } from 'react-dom/client';
import { /* FOR FRAMEWORK DEVS */ createFromFetch } from 'react-server-dom-webpack/client';

// HACK: map webpack resolution to native ESM
// @ts-ignore
window.__webpack_require__ = async (id) => {
  return import(id);
};

const root = createRoot(document.getElementById('root'));
root.render(
  <Router />
);

let callbacks = [];
// @ts-ignore
window.router = {
  navigate(/** @type {string} */ url) {
    window.history.replaceState({}, '', url);
    callbacks.forEach((cb) => cb());
  }
};

function Router() {
  const [url, setUrl] = useState('/rsc' + window.location.search);

  useEffect(() => {
    function handleNavigate() {
      startTransition(() => {
        setUrl('/rsc' + window.location.search);
      });
    }
    callbacks.push(handleNavigate);
    window.addEventListener('popstate', handleNavigate);
    return () => {
      callbacks.splice(callbacks.indexOf(handleNavigate), 1);
      window.removeEventListener('popstate', handleNavigate);
    };
  }, []);

  return (
    <>
      <ServerOutput url={url} />
    </>
  );
}

const initialCache = new Map();

function ServerOutput({ url }) {
  const [cache, setCache] = useState(initialCache);
  if (!cache.has(url)) {
    cache.set(url, createFromFetch(fetch(url)));
  }
  const lazyJsx = cache.get(url);
  return use(lazyJsx);
}

