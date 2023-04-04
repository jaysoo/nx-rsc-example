import Fastify from 'fastify';
import * as fs from 'fs';
import * as path from 'path';
import { Readable } from 'stream';
// @ts-ignore
import * as ReactServerDom from 'react-server-dom-webpack/server.browser';
import * as React from 'react';

import { ServerRoot } from './app/server-root';

const host = process.env.HOST ?? 'localhost';
const port = process.env.PORT ? Number(process.env.PORT) : 3000;

// Instantiate Fastify with some config
const server = Fastify({
  logger: true,
});

// Register your application as a normal plugin.
server.get('/rsc', async function(request, reply) {
  // @ts-ignore
  const Page = React.createElement(ServerRoot, {});
  console.log({ Page });
  const clientComponentMap = {};
  const webStream = ReactServerDom.renderToReadableStream(Page, clientComponentMap);
  const nodeStream = Readable.fromWeb(webStream);
  console.log('stream?', nodeStream.pipe);
  reply.type('text/x-component');
  await reply.send(nodeStream);
});

server.get('/', async (request, reply) => {
  const html = fs.readFileSync(path.join(__dirname, 'index.html'));
  reply.send(html);
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
