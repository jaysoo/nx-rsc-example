import Fastify from 'fastify';
import * as fs from 'fs';
import { pathToFileURL } from 'url';
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
  console.log('import.meta.url', import.meta.url);
  const url = new URL('../app/page.mjs', import.meta.url);
  const ServerRoot = await import(url.href);
  // @ts-ignore
  const Page = React.createElement(ServerRoot.default, {});
  const clientComponentMapContent = await fs.promises.readFile(
    new URL('./clientComponentMap.json', import.meta.url),
    'utf-8'
  );
  const clientComponentMap = JSON.parse(clientComponentMapContent);
  const webStream = ReactServerDom.renderToReadableStream(
    Page,
    clientComponentMap
  );
  const nodeStream = Readable.fromWeb(webStream);
  //reply.type('text/x-component');
  await reply.send(nodeStream);
});

server.get('/', async (request, reply) => {
  const html = await fs.promises.readFile(
    new URL('./index.html', import.meta.url),
    'utf-8'
  );
  reply.type('text/html');
  await reply.send(html);
});

server.get('/client/:file(.+).mjs', async (request, reply) => {
  const contents = await fs.promises.readFile(
    new URL('../' + request.url, import.meta.url),
    'utf-8'
  );
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
