export const FIX = 0;
export const FIX10 = Math.pow(10, FIX);
export const FIXSTEP = 1 / FIX10;

export function fixedCoord(it: number) {
  const val = it * FIX10;
  return Math.floor(val) / FIX10;
}
