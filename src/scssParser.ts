import * as fs from "fs";
import * as vscode from "vscode";
import ColorVar from "./config/dto/ColorVar";
import SizeVar from "./config/dto/SizeVar";
import { ScssVariable, VarType } from "./types";

let allVar: VarType = {};
const allVarObserve = () => {
  allVar = { ...colorVar.value, ...sizeVar.value };
};
export const getAllVar = () => allVar;

const colorVar = new ColorVar<VarType>({}, allVarObserve);
const sizeVar = new SizeVar<VarType>({}, allVarObserve);

export const getColorVar = () => colorVar.value;
export const setColorVar = (val: VarType, reset?: boolean) => {
  if (reset) {
    colorVar.value = val;
  } else {
    colorVar.value = Object.assign(colorVar.value, val);
  }
};
export const getSizeVar = () => sizeVar.value;
export const setSizeVar = (val: VarType, reset?: boolean) => {
  if (reset) {
    sizeVar.value = val;
  } else {
    sizeVar.value = Object.assign(sizeVar.value, val);
  }
};

export function getScssVariables(
  filePathes: string[],
  reg: RegExp
): Record<string, ScssVariable> {
  const variables: Record<string, ScssVariable> = {};
  filePathes.forEach((p) => {
    const filePath = p;
    const scssContent = fs.readFileSync(filePath, "utf-8");
    let match;
    while ((match = reg.exec(scssContent))) {
      const name = "$" + match[1];
      const variable: ScssVariable = {
        name: name,
        value: match[2],
        location: new vscode.Location(
          vscode.Uri.file(filePath),
          new vscode.Position(
            scssContent.substring(0, match.index).split("\n").length - 1,
            match.index - scssContent.lastIndexOf("\n", match.index) - 1
          )
        ),
      };
      variables[name] = variable;
    }
  });

  return variables;
}

export const getVariableMap = (
  filePathes: string[],
  reg: RegExp
): Record<string, ScssVariable> => {
  return getScssVariables(filePathes, reg);
};
