import path from "path";
import * as vscode from "vscode";

export default class Entry {
  _value: string[] = [];
  get value() {
    return this._value;
  }
  set value(val: string[]) {
    this._value = val.map((v) =>
      path.join(vscode.workspace.workspaceFolders![0]!.uri.fsPath, v)
    );
  }
}
