export default class<T> {
  private _value: T;
  constructor(val: T) {
    this._value = val;
  }
  get value() {
    return this._value;
  }
  set value(val: T) {
    this._value = val;
  }
}
