export default class FileType {
  _value: string[] = ["scss", "css", "vue"];
  get value() {
    return this._value;
  }
  set value(val: string[]) {
    this._value = val;
  }
}
