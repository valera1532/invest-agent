import { resolve } from "node:path";
import Module from "node:module";

type ResolveFilename = (
  request: string,
  parent: NodeModule | null | undefined,
  isMain: boolean,
  options?: unknown,
) => string;

const moduleWithResolver = Module as typeof Module & {
  _resolveFilename: ResolveFilename;
};

const originalResolveFilename = moduleWithResolver._resolveFilename;

moduleWithResolver._resolveFilename = function patchedResolveFilename(request, parent, isMain, options) {
  if (typeof request === "string" && request.startsWith("@/")) {
    const mappedRequest = resolve(__dirname, "..", request.slice(2));
    return originalResolveFilename.call(this, mappedRequest, parent, isMain, options);
  }

  return originalResolveFilename.call(this, request, parent, isMain, options);
};
