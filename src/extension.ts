import * as vscode from "vscode";
import { getScssVariables, getVariableMap } from "./scssParser";
import {
  COLOR_DICT,
  fileTypeDto,
  colorToHex,
  entryDto,
  hexToColor,
  init,
  watchFile,
  unWatchFile,
} from "./config";

export function activate(context: vscode.ExtensionContext) {
  init();
  watchFile();

  // 在css值前面增加颜色块
  const colorProvider = vscode.languages.registerColorProvider(
    fileTypeDto.value,
    {
      provideDocumentColors(
        document: vscode.TextDocument
      ): vscode.ProviderResult<vscode.ColorInformation[]> {
        const scssVariables = getScssVariables(entryDto.value);
        const text = document.getText();
        const colorInformations: vscode.ColorInformation[] = [];

        for (const variable of scssVariables) {
          const regex = new RegExp(`\\${variable.name}( *(!important)?.*)`, "g");

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
    }
  );

  /**
   * 点击跳转到源代码位置
   */
  const definitionProvider = vscode.languages.registerDefinitionProvider(
    fileTypeDto.value,
    {
      provideDefinition(
        document: vscode.TextDocument,
        position: vscode.Position
      ): vscode.ProviderResult<vscode.Definition> {
        const wordRange = document.getWordRangeAtPosition(position, /\$[\w-]+/);
        if (wordRange) {
          const variableName = document.getText(wordRange);
          const variable = getVariableMap(entryDto.value)[variableName];

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
    fileTypeDto.value,
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
        const variableMap = getVariableMap(entryDto.value);
        return Object.keys(variableMap).map((varName) => {
          const variable = variableMap[varName];
          const completionItem = new vscode.CompletionItem(
            varName,
            vscode.CompletionItemKind.Color
          );

          completionItem.insertText = linePrefix.includes("$")
            ? varName.replace("$", "")
            : varName;
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

  // const openScssDefinition = vscode.commands.registerCommand(
  //   "extension.openScssDefinition",
  //   (location: vscode.Location) => {
  //     vscode.window.showTextDocument(location.uri, {
  //       selection: location.range,
  //     });
  //   }
  // );

  context.subscriptions.push(
    colorProvider,
    definitionProvider,
    completionProvider
    // openScssDefinition
  );
}

export function deactivate() {
  unWatchFile();
}
