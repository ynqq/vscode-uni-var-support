import * as vscode from "vscode";
import Entry from "./dto/Entry";
import FileType from "./dto/FileType";
import * as fs from "fs";
import { getScssVariables } from "../scssParser";

export const COLOR_DICT = [
  "background",
  "background-color",
  "color",
  "border",
  "border-color",
  "box-shadow",
];

export const entryDto = new Entry();
export const fileTypeDto = new FileType();

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

interface IConfigValue {
  entry: string[];
  fileType: string[];
}

export const getSettingData = () => {
  // 获取setting.json
  const settingData = vscode.workspace.getConfiguration("var-css-support");
  const result: IConfigValue = {} as IConfigValue;
  const keys: (keyof IConfigValue)[] = ["entry", "fileType"];
  keys.forEach((key) => {
    if (settingData.get(key)) {
      result[key] = settingData.get(key)!;
    }
  });
  return result;
};

export const init = () => {
  const { entry, fileType } = getSettingData();
  if (entry !== undefined) {
    entryDto.value = entry;
  }
  if (fileType !== undefined) {
    fileTypeDto.value = fileType;
  }
};

export const watchFile = () => {
  entryDto.value.forEach((p) => {
    fs.watchFile(p, async () => {
      getScssVariables(entryDto.value);
    });
  });
};

export const unWatchFile = () => {
  entryDto.value.forEach((p) => {
    fs.unwatchFile(p);
  });
};
