import * as fs from "fs";
import path from "node:path";
import * as vscode from "vscode";

export interface ScssVariable {
  name: string;
  value: string;
  location: vscode.Location;
}

export function getScssVariables(filePathes: string[]): ScssVariable[] {
  const variableRegex =
    /\$([\w-]+):\s*(#[0-9a-fA-F]{6}|#[0-9a-fA-F]{3}|rgba?\((\d{1,3},\s?){2,3}(\d*(\.)?\d*)\));/g;
  const variables: ScssVariable[] = [];
  filePathes.forEach((p) => {
    const filePath = p;
    const scssContent = fs.readFileSync(filePath, "utf-8");

    let match;
    while ((match = variableRegex.exec(scssContent))) {
      const variable: ScssVariable = {
        name: '$' + match[1],
        value: match[2],
        location: new vscode.Location(
          vscode.Uri.file(filePath),
          new vscode.Position(
            scssContent.substring(0, match.index).split("\n").length - 1,
            match.index - scssContent.lastIndexOf("\n", match.index) - 1
          )
        ),
      };
      variables.push(variable);
    }
  });

  return variables;
}

export const getVariableMap = (filePathes: string[]) => {
  return getScssVariables(filePathes).reduce((acc, variable) => {
    acc[`${variable.name}`] = variable;
    return acc;
  }, {} as { [key: string]: ScssVariable });
};
