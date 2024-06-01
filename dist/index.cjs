var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// src/index.ts
var import_fs = require("fs");
var import_unzipper = __toESM(require("unzipper"), 1);
var import_csv_parser = __toESM(require("csv-parser"), 1);
async function extractAndProcessZip(zipFilePath) {
  const results = [];
  const zipStream = (0, import_fs.createReadStream)(zipFilePath).pipe(import_unzipper.default.Parse({ forceStream: true }));
  for await (const entry of zipStream) {
    const fileName = entry.path;
    const type = entry.type;
    if (type === "File" && fileName.endsWith(".csv")) {
      console.log(fileName);
      const csvResults = await processCsv(entry);
      results.push(...csvResults);
    } else {
      entry.autodrain();
    }
  }
  return results;
}
function processCsv(csvStream) {
  return new Promise((resolve, reject) => {
    const csvResults = [];
    csvStream.pipe((0, import_csv_parser.default)()).on("data", (data) => csvResults.push(data)).on("end", () => resolve(csvResults)).on("error", (error) => reject(error));
  });
}
async function main() {
  const zipFilePath = "data/20240512.export.CSV.zip";
  const results = await extractAndProcessZip(zipFilePath);
  console.log(results);
}
main();
//# sourceMappingURL=index.cjs.map