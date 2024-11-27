/**scss颜色变量 */
export const COLOR_VAR_REG =
  /\$([\w-]+):\s*(#[0-9a-fA-F]{6}|#[0-9a-fA-F]{3}|rgba?\((\d{1,3},\s?){2,3}(\d*(\.)?\d*)\));/g;
/**尺寸变量 */
export const SIZE_VAR_REG = /\$([\w-]+):\s*(-?\d*.?\d*(px|em|rem));/g;
