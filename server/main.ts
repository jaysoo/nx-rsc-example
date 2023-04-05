import Fastify from 'fastify';
import * as fs from 'fs';
import * as path from 'path';
import { Readable } from 'stream';
// @ts-ignore
import * as ReactServerDom from 'react-server-dom-webpack/server.browser';
import * as React from 'react';


const host = process.env.HOST ?? 'localhost';
const port = process.env.PORT ? Number(process.env.PORT) : 3000;

// Instantiate Fastify with some config
const server = Fastify({
  logger: true,
});

// Register your application as a normal plugin.
server.get('/rsc', async function(request, reply) {
  const ServerRoot = await import(new URL('../app/page.mjs', import.meta.url).href);
  // @ts-ignore
  const Page = React.createElement(ServerRoot.default, {});
  const clientComponentMap = {};
  const webStream = ReactServerDom.renderToReadableStream(Page, clientComponentMap);
  const nodeStream = Readable.fromWeb(webStream);
  reply.type('text/x-component');
  await reply.send(nodeStream);
});

server.get('/', async (request, reply) => {
  const html = await fs.promises.readFile(
    new URL('../../client/index.html', import.meta.url),
    'utf-8'
  );
  reply.type('text/html');
  await reply.send(html);
});

server.get('/assets/:file(.+).js', async (request, reply) => {
  const contents = await fs.promises.readFile(new URL('../../client/' + request.url, import.meta.url), 'utf-8');
  reply.type('application/javascript');
  await reply.send(contents);
});

// Start listening.
server.listen({ port, host }, (err) => {
  if (err) {
    server.log.error(err);
    process.exit(1);
  } else {
    console.log(`[ ready ] http://${host}:${port}`);
  }
});
