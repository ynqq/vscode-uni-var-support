export default class {
  private _value: string[] = [];
  get value() {
    return this._value;
  }
  set value(val: string[]) {
    this._value = val;
  }
}
