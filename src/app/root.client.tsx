import { useState, Suspense } from 'react';
import { ErrorBoundary } from 'react-error-boundary';
// @ts-ignore
import { createFromFetch } from 'react-server-dom-webpack';

const cache = new Map();

function useServerResponse(location: any) {
  const key = JSON.stringify(location);
  let response = cache.get(key);
  if (response) {
    return response;
  }
  response = createFromFetch(
    fetch('/react?location=' + encodeURIComponent(key))
  );
  cache.set(key, response);
  return response;
}

export default function Root() {
  return (
    <Suspense fallback={null}>
      <ErrorBoundary FallbackComponent={Error}>
        <Content />
      </ErrorBoundary>
    </Suspense>
  );
}

function Content() {
  const response = useServerResponse('/');
  return (
    <>
      {response.readRoot()}
    </>
  );
}

function Error({ error }: any) {
  return (
    <div>
      <h1>Application Error</h1>
      <pre style={{ whiteSpace: 'pre-wrap' }}>{error.stack}</pre>
    </div>
  );
}
