import * as vscode from "vscode";
import { ScssVariable, getScssVariables } from "./scssParser";
import * as path from "path";
import { COLOR_DICT, FILE_TYPE, entry } from "./config";

export function activate(context: vscode.ExtensionContext) {
  const scssVariables = getScssVariables(entry);

  const variableMap = scssVariables.reduce((acc, variable) => {
    acc[`$${variable.name}`] = variable;
    return acc;
  }, {} as { [key: string]: ScssVariable });

  const colorProvider = vscode.languages.registerColorProvider(FILE_TYPE, {
    provideDocumentColors(
      document: vscode.TextDocument
    ): vscode.ProviderResult<vscode.ColorInformation[]> {
      const text = document.getText();
      const colorInformations: vscode.ColorInformation[] = [];

      for (const variable of scssVariables) {
        const regex = new RegExp(`\\$${variable.name}(;|\n|\})`, "g");

        let match;
        while ((match = regex.exec(text))) {
          const startPos = document.positionAt(match.index);
          const endPos = document.positionAt(match.index + match[0].length);
          const range = new vscode.Range(startPos, endPos);
          const color = hexToColor(variable.value);
          colorInformations.push(new vscode.ColorInformation(range, color));
        }
      }

      return colorInformations;
    },
    provideColorPresentations(
      color: vscode.Color,
      context: { document: vscode.TextDocument; range: vscode.Range }
    ): vscode.ProviderResult<vscode.ColorPresentation[]> {
      const hex = colorToHex(color);
      const presentation = new vscode.ColorPresentation(hex);
      return [presentation];
    },
  });

  /**
   * 点击跳转到源代码位置
   */
  const definitionProvider = vscode.languages.registerDefinitionProvider(
    FILE_TYPE,
    {
      provideDefinition(
        document: vscode.TextDocument,
        position: vscode.Position
      ): vscode.ProviderResult<vscode.Definition> {
        const wordRange = document.getWordRangeAtPosition(position, /\$[\w-]+/);
        if (wordRange) {
          const variableName = document.getText(wordRange);
          const variable = variableMap[variableName];
          if (variable) {
            return variable.location;
          }
        }
        return null;
      },
    }
  );

  /**
   * 校验输入color..时出现提示
   */
  const completionProvider = vscode.languages.registerCompletionItemProvider(
    FILE_TYPE,
    {
      provideCompletionItems(
        document: vscode.TextDocument,
        position: vscode.Position
      ): vscode.CompletionItem[] {
        const linePrefix = document
          .lineAt(position)
          .text.substr(0, position.character);
        if (!COLOR_DICT.some((v) => linePrefix.includes(v))) {
          return [];
        }

        return Object.keys(variableMap).map((varName) => {
          const variable = variableMap[varName];
          const completionItem = new vscode.CompletionItem(
            varName,
            vscode.CompletionItemKind.Color
          );
          completionItem.insertText = varName;
          completionItem.detail = variable.value;
          completionItem.documentation = new vscode.MarkdownString(
            `![color](https://dummyimage.com/10x10/${variable.value.substring(
              1
            )}/${variable.value.substring(1)}.png) ${variable.value}`
          );

          return completionItem;
        });
      },
    },
    "$" // Trigger completion when '$' is typed
  );

  const openScssDefinition = vscode.commands.registerCommand(
    "extension.openScssDefinition",
    (location: vscode.Location) => {
      vscode.window.showTextDocument(location.uri, {
        selection: location.range,
      });
    }
  );

  context.subscriptions.push(
    colorProvider,
    definitionProvider,
    completionProvider,
    openScssDefinition
  );
}

function hexToColor(hex: string): vscode.Color {
  let r,
    g,
    b,
    a = 1;
  if (hex.startsWith("#")) {
    if (hex.length === 4) {
      r = parseInt(hex[1] + hex[1], 16) / 255;
      g = parseInt(hex[2] + hex[2], 16) / 255;
      b = parseInt(hex[3] + hex[3], 16) / 255;
    } else if (hex.length === 7) {
      r = parseInt(hex[1] + hex[2], 16) / 255;
      g = parseInt(hex[3] + hex[4], 16) / 255;
      b = parseInt(hex[5] + hex[6], 16) / 255;
    }
  }
  return new vscode.Color(r!, g!, b!, a!);
}

function colorToHex(color: vscode.Color): string {
  const r = Math.round(color.red * 255)
    .toString(16)
    .padStart(2, "0");
  const g = Math.round(color.green * 255)
    .toString(16)
    .padStart(2, "0");
  const b = Math.round(color.blue * 255)
    .toString(16)
    .padStart(2, "0");
  return `#${r}${g}${b}`;
}

export function deactivate() {}
