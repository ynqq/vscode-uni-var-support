export default class FileType {
  private _value: string[] = ["scss", "css", "vue", "html"];
  get value() {
    return this._value;
  }
  set value(val: string[]) {
    this._value = val;
  }
}
