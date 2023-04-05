const path = require('path');
const esbuild = require('esbuild');
const fs = require('fs');

const workspaceRoot = path.join(__dirname, '.');
const dist = path.join(workspaceRoot, 'dist/demo/server');

function resolveDist(s) {
  return path.join(dist, s);
}

const clientComponentMapUrl = resolveDist('clientComponentMap.json');

async function writeClientComponentMap(bundleMap) {
  console.log({ clientComponentMapUrl, bundleMap });
  await fs.promises.writeFile(clientComponentMapUrl, JSON.stringify(bundleMap));
}

async function readClientComponentMap() {
  const bundleMap = await fs.promises.readFile(clientComponentMapUrl, 'utf-8');
  return JSON.parse(bundleMap);
}

const USE_CLIENT_ANNOTATIONS = ['"use client"', "'use client'"];
const relativeOrAbsolutePathRegex = /^\.{0,2}\//;

module.exports = {
  packages: 'external',
  plugins: [
    {
      name: 'resolve-client-imports',
      setup(build) {
        const clientComponentMap = {};
        const clientEntryPoints = new Set();
        // Intercept component imports to find client entry points
        build.onResolve(
          { filter: relativeOrAbsolutePathRegex },
          async (ctx) => {
            const absoluteSrc = path.join(ctx.resolveDir, ctx.path) + '.tsx';

            if (fs.existsSync(absoluteSrc)) {
              // Check for `"use client"` annotation. Short circuit if not found.
              const contents = await fs.promises.readFile(absoluteSrc, 'utf-8');
              if (
                !USE_CLIENT_ANNOTATIONS.some((annotation) =>
                  contents.startsWith(annotation)
                )
              )
                return;

              clientEntryPoints.add(absoluteSrc);
              const relativeSrc = path
                .relative(workspaceRoot, absoluteSrc)
                .replace(/^app\//, 'client/');
              const absoluteDist = path
                .join(workspaceRoot, 'dist/demo', relativeSrc)
                .replace(/\.tsx$/, '.mjs');

              const id = `/${relativeSrc.replace(/\.tsx$/, '.mjs')}`;

              clientComponentMap[id] = {
                id,
                chunks: [],
                name: 'default', // TODO support named exports
                async: true,
              };

              const rsc = getClientComponentModule(
                id,
                `file://${absoluteDist}`
              );
              console.log({ absoluteDist, id, rsc });
              return {
                // Encode the client component module in the import URL.
                // This is a... wacky solution to avoid import middleware.
                path: `data:text/javascript,${encodeURIComponent(rsc)}`,
                external: true,
              };
            }
          }
        );

        build.onEnd(async (result) => {
          console.log(`server build ended with ${result.errors.length} errors`);

          await esbuild.build({
            tsconfig: 'tsconfig.app.json',
            bundle: true,
            format: 'esm',
            entryPoints: [
              ...clientEntryPoints,
              path.join(workspaceRoot, 'app/router.tsx'),
            ],
            outdir: path.join(workspaceRoot, 'dist/demo/client'),
            splitting: true,
            outExtension: {
              '.js': '.mjs',
            },
          });

          console.log('client build done');

          await writeClientComponentMap(clientComponentMap);
        });
      },
    },
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
