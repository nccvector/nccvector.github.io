#!/usr/bin/env node

import { copyFile, cp, mkdir, rm, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const root = resolve(".");
const build = resolve(".site-dist");

await Promise.all([
  rm(resolve(root, "assets"), { recursive: true, force: true }),
  rm(resolve(root, "images"), { recursive: true, force: true }),
  rm(resolve(root, "index.html"), { force: true }),
]);

await mkdir(resolve(root, "assets"), { recursive: true });
await cp(resolve(build, "assets"), resolve(root, "assets"), { recursive: true });
await cp(resolve(build, "images"), resolve(root, "images"), { recursive: true });
await copyFile(resolve(build, "index.html"), resolve(root, "index.html"));
await writeFile(resolve(root, ".nojekyll"), "");

console.log("Published static build to the repository root");
