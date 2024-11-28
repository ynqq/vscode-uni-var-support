import * as vscode from "vscode";
import Entry from "./dto/Entry";
import * as fs from "fs";
import {
  getScssVariables,
  setColorVar,
  setNativeColorVar,
  setNativeSizeVar,
  setSizeVar,
} from "../scssParser";
import {
  COLOR_VAR_REG,
  NATIVE_COLOR_VAR_REG,
  NATIVE_SIZE_VAR_REG,
  SIZE_VAR_REG,
} from "./const";
import { IConfigValue } from "../types";
import Tinycolor from "tinycolor2";
import Common from "./dto/Common";

/**配置文件列表 */
export const entryDto = new Entry();
/**需要支持的文件类型 */
export const fileTypeDto = new Common(["scss", "css", "vue", "html"]);
/**css需要提示的颜色属性 */
export const colorDto = new Common<string[]>([]);
/**css需要提示的尺寸属性 */
export const sizeDto = new Common<string[]>([]);
/**是否显示颜色的值 */
export const showColorVar = new Common(true);
/**是否启用 :root 定义的变量 */
export const enableNativeCssVar = new Common(true);

/**
 * 颜色转vscode color对象
 * @param hex 颜色
 * @returns
 */
export function hexToColor(hex: string): vscode.Color {
  const { r, g, b, a } = Tinycolor(hex).toRgb();
  return new vscode.Color(r!, g!, b!, a!);
}

/**
 * 颜色转16进制
 * @param color color对象
 * @returns
 */
export function colorToHex(color: vscode.Color): string {
  return Tinycolor({
    r: color.red,
    g: color.green,
    b: color.blue,
    a: color.alpha,
  }).toHexString();
}

export const getSettingData = () => {
  // 获取setting.json
  const settingData = vscode.workspace.getConfiguration("var-css-support");
  const result: IConfigValue = {} as IConfigValue;
  const keys: (keyof IConfigValue)[] = [
    "entry",
    "fileType",
    "colors",
    "size",
    "colorValShow",
    "enableNativeVar",
  ];
  keys.forEach((key) => {
    if (settingData.get(key) !== undefined) {
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
  const { entry, fileType, colors, size, colorValShow, enableNativeVar } =
    getSettingData();
  if (colorValShow !== undefined) {
    showColorVar.value = colorValShow;
  }
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

  if (enableNativeVar !== undefined) {
    enableNativeCssVar.value = enableNativeVar;
  }

  getModuleVars(entryDto.value);
};

/**
 * 获取文件中的颜色、尺寸变量
 * @param p 文件地址列表
 */
export const getModuleVars = (p: string[]) => {
  const regs = [COLOR_VAR_REG, SIZE_VAR_REG];
  // 是否要获取--变量
  if (enableNativeCssVar.value) {
    regs.push(...[NATIVE_COLOR_VAR_REG, NATIVE_SIZE_VAR_REG]);
  }
  const [colorVars, sizeVars, nativeColorVars, nativeSizeVars] =
    getScssVariables(p, regs);
  setColorVar(colorVars);
  setSizeVar(sizeVars);
  if (Object.keys(nativeColorVars || {}).length) {
    setNativeColorVar(nativeColorVars);
  }
  if (Object.keys(nativeSizeVars || {}).length) {
    setNativeSizeVar(nativeSizeVars);
  }
};

export const watchFile = () => {
  entryDto.value.forEach((p) => {
    fs.watchFile(p, async () => {
      setColorVar({}, true);
      setSizeVar({}, true);
      if (enableNativeCssVar.value) {
        setNativeColorVar({}, true);
        setNativeSizeVar({}, true);
      }
      getModuleVars(entryDto.value);
    });
  });
};

export const unWatchFile = () => {
  entryDto.value.forEach((p) => {
    fs.unwatchFile(p);
  });
};
