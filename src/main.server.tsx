import type { Request, Response } from 'express';
import * as fs from 'fs';
// @ts-ignore
import * as ReactDOMServer from 'react-dom/server.browser';
import * as isbot from 'isbot';

import { ServerRoot } from './app/root.server';

let indexHtml: null | string = null;

export function handleRequest(indexPath: string) {
  return function render(req: Request, res: Response) {
    let didError = false;

    if (!indexHtml) {
      indexHtml = fs.readFileSync(indexPath).toString();
    }

    const [htmlStart, htmlEnd] = indexHtml.split(`<div id="root"></div>`);
    const appHtml = ReactDOMServer.renderToString(<ServerRoot />);

    res.write(`${htmlStart}<div id="root">`);
    res.write(appHtml)
    res.write(`</div>${htmlEnd}`);
    res.end();

    // For bots (e.g. search engines), the content will not be streamed but render all at once.
    // For users, content should be streamed to the user as they are ready.
    //const callbackName = isbot(req.headers['user-agent'])
    //  ? 'onAllReady'
    //  : 'onShellReady';

    //const stream = ReactDOMServer.renderToPipeableStream(<ServerRoot />, {
    //  [callbackName]() {
    //    res.statusCode = didError ? 500 : 200;
    //    res.setHeader('Content-type', 'text/html; charset=utf-8');
    //    res.write(`${htmlStart}<div id="root">`);
    //    stream.pipe(res);
    //    res.write(`</div>${htmlEnd}`);
    //  },
    //  onShellError(error) {
    //    console.error(error);
    //    res.statusCode = 500;
    //    res.send('<!doctype html><h1>Server Error</h1>');
    //  },
    //  onError(error) {
    //    didError = true;
    //    console.error(error);
    //  },
    //});
  };
}
