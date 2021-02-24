//https://github.com/airbnb/ts-migrate/blob/master/packages/ts-migrate/commands/rename.ts
/* eslint-disable no-use-before-define, @typescript-eslint/no-use-before-define */
import fs from "fs";
import path from "path";
import ts from "typescript";
import { asSuccess, asFailure, Status } from "../helpers";

interface RenameParams {
  rootDir: string;
  sources?: string | string[];
}
/**
 *  @returns status code
 */
export default function rename({ rootDir, sources }: RenameParams): Status {
  const configFile = path.resolve(rootDir, "tsconfig.json");
  if (!fs.existsSync(configFile)) {
    return asFailure(`Could not find tsconfig.json at ${configFile}`);
  }

  let jsFiles: string[];
  try {
    jsFiles = findJSFiles(rootDir, configFile, sources);
  } catch (err) {
    return asFailure(err?.message || String(err));
  }

  if (jsFiles.length === 0) {
    return asFailure("No JS/JSX files to rename.");
  }

  const toRename = jsFiles
    .map((oldFile) => {
      let newFile: string | undefined;
      if (oldFile.endsWith(".jsx")) {
        newFile = oldFile.replace(/\.jsx$/, ".tsx");
      } else if (oldFile.endsWith(".js") && jsFileContainsJsx(oldFile)) {
        newFile = oldFile.replace(/\.js$/, ".tsx");
      } else if (oldFile.endsWith(".js")) {
        newFile = oldFile.replace(/\.js$/, ".ts");
      }

      return { oldFile, newFile };
    })
    .filter(
      (result): result is { oldFile: string; newFile: string } =>
        !!result.newFile
    );

  // log.info(`Renaming ${toRename.length} JS/JSX files in ${rootDir}...`);

  toRename.forEach(({ oldFile, newFile }) => {
    fs.renameSync(oldFile, newFile);
  });

  // updateProjectJson(rootDir, log);

  return asSuccess();
}

function findJSFiles(
  rootDir: string,
  configFile: string,
  sources?: string | string[]
) {
  const configFileContents = ts.sys.readFile(configFile);
  if (!configFileContents) {
    throw new Error(`Failed to read TypeScript config file: ${configFile}`);
  }

  const { config, error } = ts.parseConfigFileTextToJson(
    configFile,
    configFileContents
  );
  if (error) {
    const errorMessage = ts.flattenDiagnosticMessageText(
      error.messageText,
      ts.sys.newLine
    );
    throw new Error(
      `Error parsing TypeScript config file text to json: ${configFile}\n${errorMessage}`
    );
  }

  let { include } = config;

  // Sources come from either `config.files` or `config.includes`.
  // If the --sources flag is set, let's ignore both of those config properties
  // and set our own `config.includes` instead.
  if (sources !== undefined) {
    include = Array.isArray(sources) ? sources : [sources];
    delete config.files;
  }

  const { fileNames, errors } = ts.parseJsonConfigFileContent(
    {
      ...config,
      compilerOptions: {
        ...config.compilerOptions,
        // Force JS/JSX files to be included
        allowJs: true,
      },
      include,
    },
    ts.sys,
    rootDir
  );

  if (errors.length > 0) {
    const errorMessage = ts.formatDiagnostics(errors, {
      getCanonicalFileName: (fileName: string) => fileName,
      getCurrentDirectory: () => rootDir,
      getNewLine: () => ts.sys.newLine,
    });
    throw new Error(
      `Errors parsing TypeScript config file content: ${configFile}\n${errorMessage}`
    );
  }

  return fileNames.filter((fileName: string) => /\.jsx?$/.test(fileName));
}

/**
 * Heuristic to determine whether a .js file contains JSX.
 */
function jsFileContainsJsx(jsFileName: string): boolean {
  const contents = fs.readFileSync(jsFileName, "utf8");
  return /from ['"]react['"]/.test(contents) && /<[A-Za-z]/.test(contents);
}

// function updateProjectJson(rootDir: string, log: any) {
//   const projectJsonFile = path.resolve(rootDir, "project.json");
//   if (!fs.existsSync(projectJsonFile)) {
//     return;
//   }

//   const projectJsonText = fs.readFileSync(projectJsonFile, "utf-8");
//   const projectJson = json5.parse(projectJsonText);

//   if (projectJson && projectJson.allowedImports) {
//     projectJson.allowedImports = projectJson.allowedImports.map(
//       (allowedImport: string) =>
//         /.jsx?$/.test(allowedImport)
//           ? allowedImport.replace(/\.js(x?)$/, ".ts$1")
//           : allowedImport
//     );
//   }

//   if (projectJson && projectJson.layout) {
//     const { layout } = projectJson;
//     projectJson.layout = /.jsx?$/.test(layout)
//       ? layout.replace(/\.js(x?)$/, ".ts$1")
//       : layout;
//   }

//   const writer = json5Writer.load(projectJsonText);
//   writer.write(projectJson);
//   fs.writeFileSync(
//     projectJsonFile,
//     writer.toSource({ quote: "double" }),
//     "utf-8"
//   );
//   log.info(`Updated allowedImports in ${projectJsonFile}`);
// }
