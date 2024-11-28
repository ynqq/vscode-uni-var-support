import * as vscode from "vscode";
/**变量类型 */
export interface ScssVariable {
  name: string;
  value: string;
  /**十六进制色值 */
  hexValue?: string;
  location: vscode.Location;
}
/**保存的变量类型 */
export type VarType = Record<string, ScssVariable>;

/**插件设置类型 */
export interface IConfigValue {
  colorValShow: boolean;
  entry: string[];
  fileType: string[];
  colors: string[];
  size: string[];
  enableNativeVar: boolean
}
