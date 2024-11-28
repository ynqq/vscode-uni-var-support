export default class CommonVar<T extends Record<string, unknown>> {
  private _value: T;
  private observe: () => void;
  constructor(val: T, observe: () => void) {
    this._value = val;
    this.observe = observe;
  }
  get value() {
    return this._value;
  }
  set value(newVal: T) {
    this._value = newVal;
    this.observe();
  }
}
