/**scss颜色变量 */
export const COLOR_VAR_REG =
  /\$([\w-]+):\s*(#[0-9a-fA-F]{6}|#[0-9a-fA-F]{3}|[a-zA-Z]+|rgba?\(([^)]+)\));/g;
/**尺寸变量 */
export const SIZE_VAR_REG = /\$([\w-]+):\s*(-?\d*.?\d*(px|em|rem));/g;
/**--颜色变量 */
export const NATIVE_COLOR_VAR_REG =
  /\-\-([\w-]+):\s*(#[0-9a-fA-F]{6}|#[0-9a-fA-F]{3}|[a-zA-Z]+|rgba?\(([^)]+)\));/g;
/**--尺寸 */
export const NATIVE_SIZE_VAR_REG = /\-\-([\w-]+):\s*(-?\d*.?\d*(px|em|rem));/g;
