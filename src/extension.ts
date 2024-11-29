import * as vscode from "vscode";
import {
  getAllNativeVar,
  getAllVar,
  getColorVar,
  getNativeColorVar,
  getNativeSizeVar,
  getSizeVar,
} from "./scssParser";
import {
  fileTypeDto,
  colorToHex,
  hexToColor,
  init,
  watchFile,
  unWatchFile,
  colorDto,
  sizeDto,
  showColorVar,
  enableNativeCssVar,
} from "./config";
import tinycolor from "tinycolor2";

export function activate(context: vscode.ExtensionContext) {
  init();
  watchFile();

  // 在css值前面增加颜色块
  const colorProvide = vscode.languages.registerColorProvider(
    fileTypeDto.value,
    {
      provideDocumentColors(
        document: vscode.TextDocument
      ): vscode.ProviderResult<vscode.ColorInformation[]> {
        const scssVariables = getColorVar();
        if (enableNativeCssVar.value) {
          Object.assign(scssVariables, getNativeColorVar());
        }

        const text = document.getText();
        const colorInformations: vscode.ColorInformation[] = [];

        for (const key in scssVariables) {
          const variable = scssVariables[key];
          const regex = new RegExp(
            `\\${variable.name}(?![a-zA-Z0-9-_])( *(!important)?.*)`,
            "g"
          );
          let match;
          while ((match = regex.exec(text))) {
            const beforeText = text.slice(match.index - 4, match.index);

            const isVar = beforeText === "var(";
            let startPos = document.positionAt(match.index);
            const endPos = document.positionAt(match.index + match[0].length);
            if (isVar) {
              startPos = startPos.translate(0, -4);
            }
            const range = new vscode.Range(startPos, endPos);
            const color = hexToColor(variable.hexValue || variable.value);

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

  // css值前面增加 尺寸/颜色 值
  const sizeProvide = vscode.languages.registerCodeLensProvider(
    fileTypeDto.value,
    {
      provideCodeLenses(
        document: vscode.TextDocument
      ): vscode.ProviderResult<vscode.CodeLens[]> {
        const scssVariables = showColorVar.value ? getAllVar() : getSizeVar();
        
        if (enableNativeCssVar.value) {
          if (showColorVar.value) {
            Object.assign(scssVariables, getAllNativeVar());
          } else {
            Object.assign(scssVariables, getNativeSizeVar());
          }
        }
        const codeLenses: vscode.CodeLens[] = [];
        const text = document.getText();
        for (const key in scssVariables) {
          const variable = scssVariables[key];
          const regex = new RegExp(
            `\\${variable.name}(?![a-zA-Z0-9-_])( *(!important)?.*)`,
            "g"
          );

          let match: RegExpExecArray | null;
          while ((match = regex.exec(text))) {
            const startPos = document.positionAt(match.index);
            const endPos = document.positionAt(match.index + match[0].length);
            const range = new vscode.Range(startPos, endPos);

            const variableValue = variable.value;

            // 添加 CodeLens
            codeLenses.push(
              new vscode.CodeLens(range, {
                title: `${variable.name}: ${variableValue}`,
                command: "",
              })
            );
          }
        }

        return codeLenses;
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
        const wordRange = document.getWordRangeAtPosition(
          position,
          /(((\$)|(\-\-))[\w-]+)/
        );
        if (wordRange) {
          const variableName = document.getText(wordRange);
          const vals = getAllVar();
          if (enableNativeCssVar.value) {
            Object.assign(vals, getAllNativeVar());
          }
          const variable = vals[variableName];

          if (variable) {
            return variable.location;
          }
        }
        return null;
      },
    }
  );
  /**
   * 尺寸 提示
   */
  const completionSizeProvider =
    vscode.languages.registerCompletionItemProvider(
      fileTypeDto.value,
      {
        provideCompletionItems(
          document: vscode.TextDocument,
          position: vscode.Position
        ): vscode.CompletionItem[] {
          const linePrefix = document
            .lineAt(position)
            .text.substr(0, position.character);
          if (sizeDto.value.every((v) => !linePrefix.includes(v))) {
            return [];
          }
          let variableMap = getSizeVar();
          if (enableNativeCssVar.value) {
            if (linePrefix.includes("var(")) {
              variableMap = Object.assign(getNativeSizeVar(), variableMap);
            } else {
              Object.assign(variableMap, getNativeSizeVar());
            }
          }

          return Object.keys(variableMap).map((varName) => {
            const variable = variableMap[varName];
            const completionItem = new vscode.CompletionItem(
              varName,
              vscode.CompletionItemKind.Value
            );
            completionItem.insertText = linePrefix.includes("$")
              ? varName.replace("$", "")
              : varName;
            completionItem.detail = variable.value;
            completionItem.documentation = new vscode.MarkdownString(
              `${variable.value}`
            );
            return completionItem;
          });
        },
      },
      "var",
      "$"
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

        if (!colorDto.value.some((v) => linePrefix.includes(v))) {
          return [];
        }
        let variableMap = getColorVar();
        if (enableNativeCssVar.value) {
          if (linePrefix.includes("var(")) {
            variableMap = Object.assign(getNativeColorVar(), variableMap);
          } else {
            Object.assign(variableMap, getNativeColorVar());
          }
        }

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
          const tipColor = variable.hexValue || variable.value;

          completionItem.documentation = new vscode.MarkdownString(
            `![color](https://dummyimage.com/10x10/${tipColor.substring(
              1
            )}/${tipColor.substring(1)}.png) ${tinycolor(
              tipColor
            ).toRgbString()}`
          );

          return completionItem;
        });
      },
    },
    "$",
    "var"
  );

  context.subscriptions.push(
    ...[
      colorProvide,
      sizeProvide,
      definitionProvider,
      completionSizeProvider,
      completionProvider,
    ]
  );
}

export function deactivate() {
  unWatchFile();
}
