export interface Row {
  /** Index of the row's first photo. */
  start: number;
  /** Index after the row's last photo. */
  end: number;
  height: number;
}

/**
 * Splits photos (width / height ratios) into rows that fill `width` exactly. Each row
 * takes the photo count whose height lands closest to `target`, so rows can shrink
 * as well as grow; the last row keeps `target` instead of stretching.
 */
export function justifyRows(
  ratios: number[],
  width: number,
  target: number,
  gap: number
): Row[] {
  const rows: Row[] = [];
  const heightOf = (from: number, to: number) => {
    let sum = 0;
    for (let i = from; i < to; i++) {
      sum += ratios[i];
    }
    return (width - gap * (to - from - 1)) / sum;
  };
  let start = 0;
  while (start < ratios.length) {
    let end = start + 1;
    while (end < ratios.length && heightOf(start, end) > target) {
      end++;
    }
    const tooShort = heightOf(start, end) < target;
    if (
      tooShort &&
      end - start > 1 &&
      target - heightOf(start, end) > heightOf(start, end - 1) - target
    ) {
      end--;
    }
    const last = end === ratios.length && heightOf(start, end) > target;
    rows.push({ start, end, height: last ? target : heightOf(start, end) });
    start = end;
  }
  return rows;
}
