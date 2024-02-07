import { readFileSync, writeFileSync } from "node:fs";
import { JSDOM } from "jsdom";

if (process.argv.length !== 3) throw new Error("Expected path to file to change");

const path = process.argv[2];
const html = readFileSync(path);
const dom = new JSDOM(html);
writeFileSync(path, dom.window.document.querySelector("body > div").outerHTML);
