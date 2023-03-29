// @ts-ignore
import * as  register from 'react-server-dom-webpack/node-register';
console.log({ register })
register();

import * as React from 'react';
import * as fs from 'fs';
import * as path from 'path';
import * as express from 'express';
import * as cors from 'cors';
// @ts-ignore
import { renderToPipeableStream } from 'react-server-dom-webpack/writer.node.server';

import { App } from '../src/app/app.server';
import { handleRequest } from '../src/main.server';

const port = process.env['PORT'] || 4200;
const app = express();

const browserDist = path.join(process.cwd(), 'dist/nx-rsc/browser');
const indexPath = path.join(browserDist, 'index.html');

app.use(cors());

async function renderReactTree(res: any, props: any) {
  const manifest = fs.readFileSync(
    path.resolve(browserDist, 'react-client-manifest.json'),
    'utf8'
  );
  const moduleMap = JSON.parse(manifest);
  const { pipe } = renderToPipeableStream(
    React.createElement(App, props),
    moduleMap
  );
  pipe(res);
}

function sendResponse(req: any, res: any) {
  renderReactTree(res, {});
}

app.get('/react', function(req, res) {
  sendResponse(req, res);
});

app.get(
  '*.*',
  express.static(browserDist, {
    maxAge: '1y',
  })
);

app.use('*', handleRequest(indexPath));

const server = app.listen(port, () => {
  // Server has started
  console.log(`[ ready ] http://localhost:${port}`);
});

server.on('error', console.error);
