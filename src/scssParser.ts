import * as fs from "fs";
import * as vscode from "vscode";
import { ScssVariable, VarType } from "./types";
import Tinycolor from "tinycolor2";
import CommonVar from "./config/dto/CommonVar";

/**存储所有scss的变量 */
let allVar: VarType = {};
const allVarObserve = () => {
  allVar = { ...colorVar.value, ...sizeVar.value };
};
export const getAllVar = () => allVar;
/**存储颜色变量 */
const colorVar = new CommonVar<VarType>({}, allVarObserve);
/**存储尺寸变量 */
const sizeVar = new CommonVar<VarType>({}, allVarObserve);

const checkColorVar = (val: VarType): VarType => {
  for (const key in val) {
    const item = val[key];
    const { value } = val[key];
    if (/[a-zA-Z]+/.test(value)) {
      let color = Tinycolor(value);
      let match = value.match(
        /rgba?\(\$color:\s*(.*),\s*\$alpha:\s*(\d\.?\d*)/
      );
      if (match) {
        color = Tinycolor(match[1]).setAlpha(+match[2]);
      }
      if (color.isValid()) {
        item.hexValue = color.toHex8String();
      } else {
        delete val[key];
      }
    } else {
      item.hexValue = item.value;
    }
  }
  return val;
};

export const getColorVar = () => colorVar.value;
export const setColorVar = (val: VarType, reset?: boolean) => {
  val = checkColorVar(val);
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

let allNativeVar: VarType = {};
export const getAllNativeVar = () => allNativeVar;
const allNativeObserve = () => {
  allNativeVar = { ...nativeColorVar.value, ...nativeSizeVar.value };
};

export const nativeColorVar = new CommonVar<VarType>({}, allNativeObserve);
export const nativeSizeVar = new CommonVar<VarType>({}, allNativeObserve);
export const getNativeColorVar = () => nativeColorVar.value;
export const setNativeColorVar = (val: VarType, reset?: boolean) => {
  val = checkColorVar(val);
  if (reset) {
    nativeColorVar.value = val;
  } else {
    nativeColorVar.value = Object.assign(nativeColorVar.value, val);
  }
};
export const getNativeSizeVar = () => nativeSizeVar.value;
export const setNativeSizeVar = (val: VarType, reset?: boolean) => {
  if (reset) {
    nativeSizeVar.value = val;
  } else {
    nativeSizeVar.value = Object.assign(nativeSizeVar.value, val);
  }
};

export function getScssVariables(
  filePathes: string[],
  regs: RegExp[]
): Record<string, ScssVariable>[] {
  const result: Record<string, ScssVariable>[] = [
    ...new Array(regs.length),
  ].map(() => ({}));
  filePathes.forEach((p) => {
    const filePath = p;
    const scssContent = fs.readFileSync(filePath, "utf-8");
    regs.forEach((reg, index) => {
      const variables: Record<string, ScssVariable> = {};
      let match;
      while ((match = reg.exec(scssContent))) {
        const allStr = match[0];
        const name = allStr.slice(0, allStr.indexOf(match[1])) + match[1];
        const linePos = new vscode.Position(
          scssContent.substring(0, match.index).split("\n").length - 1,
          match.index - scssContent.lastIndexOf("\n", match.index) - 1
        );
        const lineStr = scssContent.substring(
          scssContent.substring(0, match.index).lastIndexOf("\n"),
          match.index + scssContent.substring(match.index).indexOf("\n")
        );
        if (!lineStr.includes("//")) {
          const variable: ScssVariable = {
            name: name,
            value: match[2],
            location: new vscode.Location(vscode.Uri.file(filePath), linePos),
          };
          variables[name] = variable;
        }
      }
      result[index] = variables;
    });
  });

  return result;
}
