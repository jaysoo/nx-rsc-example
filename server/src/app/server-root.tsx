import { Suspense } from 'react';
import { Todo } from './todo';

export async function ServerRoot() {
  console.log('render root')
  return (
    <>
      <h1>Demo</h1>
      <Todo />
    </>
  );
}

