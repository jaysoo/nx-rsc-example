const path = require('path');
const fs = require('fs');

const src = path.join(__dirname, './server/src/app');
const dist = path.join(__dirname, './dist/server');

console.log({ src, dist })
function resolveSrc(s) {
  return path.join(src, s);
}

function resolveDist(s) {
  return path.join(dist, s);
}

function resolveClientDist(s) {
  return path.join(resolveDist('client'), s);
}

function resolveServerDist(s) {
  return path.join(resolveDist('server', s));
}

const clientComponentMapUrl = resolveDist('clientComponentMap.json');

async function writeClientComponentMap(bundleMap) {
  await fs.promises.writeFile(clientComponentMapUrl, JSON.stringify(bundleMap));
}

async function readClientComponentMap() {
  const bundleMap = await fs.promises.readFile(clientComponentMapUrl, 'utf-8');
  return JSON.parse(bundleMap);
}

const USE_CLIENT_ANNOTATIONS = ['"use client"', "'use client'"];
const relativeOrAbsolutePathRegex = /^\.{0,2}\//;

module.exports = {
  plugins: [
    {
      name: 'resolve-client-imports',
      setup(build) {
        console.log('setting up plugin')
        const clientComponentMap = {};
        const clientEntryPoints = new Set();
        // Intercept component imports to find client entry points
        build.onResolve({ filter: relativeOrAbsolutePathRegex }, async ({ path }) => {
          // Note: assumes file extension is omitted
          // i.e. import paths are './Component', not './Component.jsx'
          const absoluteSrc = resolveSrc(path) + '.tsx';

          if (fs.existsSync(absoluteSrc)) {
            console.log('writing client component', absoluteSrc);
            // Check for `"use client"` annotation. Short circuit if not found.
            const contents = await fs.promises.readFile(absoluteSrc, 'utf-8');
            if (!USE_CLIENT_ANNOTATIONS.some((annotation) => contents.startsWith(annotation)))
              return;

            clientEntryPoints.add(absoluteSrc);
            const absoluteDist = resolveClientDist(path) + '.mjs';
            console.log({ absoluteDist })

            // Path the browser will import this client-side component from.
            // This will be fulfilled by the server router.
            // @see './index.js'
            const id = `/dist/client/${path}.mjs`;

            clientComponentMap[id] = {
              id,
              chunks: [],
              name: 'default', // TODO support named exports
              async: true
            };

            return {
              // Encode the client component module in the import URL.
              // This is a... wacky solution to avoid import middleware.
              path: `data:text/javascript,${encodeURIComponent(
                getClientComponentModule(id, `file://${absoluteDist}`)
              )}`,
              external: true
            };
          }

        });
        build.onEnd((result) => {
          console.log(`build ended with ${result.errors.length} errors`);
          writeClientComponentMap(clientComponentMap);
        })
      }
    }
  ],
  outExtension: {
    '.js': '.mjs',
  },
};

function getClientComponentModule(id, localImportPath) {
  return `import DefaultExport from ${JSON.stringify(localImportPath)};
	DefaultExport.$$typeof = Symbol.for("react.client.reference");
	DefaultExport.$$id=${JSON.stringify(id)};
	export default DefaultExport;`;
}
