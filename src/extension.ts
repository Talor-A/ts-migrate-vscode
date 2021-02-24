// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from "vscode";
import migrate from "./commands/migrate";
import rename from "./commands/rename";
import path from "path";

const supportedTypes = [
  "javascript",
  "jsx",
  "javascriptreact",
  "typescript",
  "typescriptreact",
];
// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
  // Use the console to output diagnostic information (console.log) and errors (console.error)
  // This line of code will only be executed once when your extension is activated
  console.log(
    'Congratulations, your extension "tsmigratevscode" is now active!'
  );

  // The command has been defined in the package.json file
  // Now provide the implementation of the command with registerCommand
  // The commandId parameter must match the command field in package.json
  let disposable = vscode.commands.registerCommand(
    "tsmigratevscode.helloWorld",
    () => {
      // The code you place here will be executed every time your command is executed
      // Display a message box to the user
      let activeEditor = vscode.window.activeTextEditor?.document;
      if (!activeEditor) {
        vscode.window.showErrorMessage("could not find an active text editor.");
        return;
      }
      const workspaceFolder = vscode.workspace.getWorkspaceFolder(
        activeEditor.uri
      );
      if (!workspaceFolder) {
        vscode.window.showErrorMessage("could not find root workspace folder.");
        return;
      }

      if (!supportedTypes.includes(activeEditor.languageId)) {
        vscode.window.showErrorMessage(
          `${activeEditor.fileName} is not a javascript or typescript file: ${activeEditor.languageId}`
        );
      }
      let fileToMigrateRelative = path.relative(
        workspaceFolder.uri.fsPath,
        activeEditor.fileName
      );

      if (
        activeEditor.languageId === "jsx" ||
        activeEditor.languageId === "javascriptreact" ||
        activeEditor.languageId === "javascript"
      ) {
        const result = rename({
          rootDir: workspaceFolder.uri.fsPath,
          sources: fileToMigrateRelative,
        });

        if (result.status === "failure") {
          vscode.window.showErrorMessage(result.message);
          return;
        }

        fileToMigrateRelative = fileToMigrateRelative
          .replace(/\.jsx$/, ".tsx")
          .replace(/\.js$/, ".ts");
      }
      migrate({
        tsConfigDir: workspaceFolder.uri.fsPath,
        rootDir: workspaceFolder.uri.fsPath,
        sources: fileToMigrateRelative,
      }).then((result) => {
        if (result.status === "failure") {
          vscode.window.showErrorMessage(result.message);
        } else {
          vscode.window.showTextDocument(
            vscode.Uri.file(
              path.join(workspaceFolder.uri.fsPath, fileToMigrateRelative)
            )
          );
        }
      });
    }
  );

  context.subscriptions.push(disposable);
}

// this method is called when your extension is deactivated
export function deactivate() {}
