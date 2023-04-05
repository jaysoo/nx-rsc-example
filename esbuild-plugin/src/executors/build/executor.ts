import * as path from 'path';
import { ExecutorContext } from '@nrwl/devkit';
import { esbuildExecutor } from '@nrwl/esbuild/src/executors/esbuild/esbuild.impl';

export default async function* runExecutor(options: any, context: ExecutorContext) {
  let { esbuildConfig, esbuildOptions, ...rest } = options;
  if (esbuildConfig) {
    esbuildOptions = require(path.join(context.root, esbuildConfig));
  }
  yield* esbuildExecutor({
    ...rest,
    esbuildOptions
  }, context);
}

