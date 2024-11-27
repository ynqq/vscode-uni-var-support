import * as vscode from "vscode";
import Entry from "./dto/Entry";
import FileType from "./dto/FileType";
import * as fs from "fs";
import { getScssVariables, setColorVar, setSizeVar } from "../scssParser";
import { COLOR_VAR_REG, SIZE_VAR_REG } from "./const";
import ColorType from "./dto/ColorType";
import SizeType from "./dto/SizeType";
import { IConfigValue } from "../types";

export const entryDto = new Entry();
export const fileTypeDto = new FileType();
export const colorDto = new ColorType();
export const sizeDto = new SizeType();

export function hexToColor(hex: string): vscode.Color {
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
  } else if (hex.includes("rgb")) {
    const res = hex.replace(
      /rgba\((\d*),\s*(\d*),\s*(\d*)(,\s*)?(\d*.?\d*)?.*\)/,
      "$1,$2,$3,$5"
    );
    if (res) {
      const [_r, _g, _b, _a] = res.split(",");
      r = +_r;
      g = +_g;
      b = +_b;
      if (_a !== undefined) {
        a = +_a;
      }
    }
  }
  return new vscode.Color(r!, g!, b!, a!);
}

export function colorToHex(color: vscode.Color): string {
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

export const getSettingData = () => {
  // 获取setting.json
  const settingData = vscode.workspace.getConfiguration("var-css-support");
  const result: IConfigValue = {} as IConfigValue;
  const keys: (keyof IConfigValue)[] = ["entry", "fileType", "colors", "size"];
  keys.forEach((key) => {
    if (settingData.get(key)) {
      result[key] = settingData.get(key)!;
    }
  });
  const allSetting = vscode.workspace.getConfiguration("");
  if (allSetting) {
    result.colors = allSetting.get("var-css-colors") || [];
  }
  if (allSetting) {
    result.size = allSetting.get("var-css-size") || [];
  }
  return result;
};

export const init = () => {
  const { entry, fileType, colors, size } = getSettingData();
  if (entry !== undefined) {
    entryDto.value = entry;
  }
  if (fileType !== undefined) {
    fileTypeDto.value = fileType;
  }
  if (colors !== undefined) {
    colorDto.value = colors;
  }
  if (size !== undefined) {
    sizeDto.value = size;
  }

  getModuleVars(entryDto.value);
};

export const getModuleVars = (p: string[]) => {
  const colorVars = getScssVariables(p, COLOR_VAR_REG);
  setColorVar(colorVars);
  const sizeVars = getScssVariables(p, SIZE_VAR_REG);
  setSizeVar(sizeVars);
};

export const watchFile = () => {
  entryDto.value.forEach((p) => {
    fs.watchFile(p, async () => {
      setColorVar({}, true);
      setSizeVar({}, true);
      getModuleVars(entryDto.value);
    });
  });
};

export const unWatchFile = () => {
  entryDto.value.forEach((p) => {
    fs.unwatchFile(p);
  });
};
