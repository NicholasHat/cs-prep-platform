import type { ArrayFrame, ArrayHighlights, Frame } from "../types";

const frame = (
  array: number[],
  highlights: ArrayHighlights,
  note: string,
): ArrayFrame => ({ kind: "array", array: [...array], highlights, note });

const range = (from: number, to: number): number[] =>
  Array.from({ length: to - from + 1 }, (_, i) => from + i);

// ---------------------------------------------------------------------------
// Bubble sort
// ---------------------------------------------------------------------------

export function* bubbleSort(input: number[]): Generator<Frame> {
  const a = [...input];
  const n = a.length;
  yield frame(a, {}, "Start: repeatedly bubble the largest element to the end.");

  for (let end = n - 1; end > 0; end--) {
    let swapped = false;
    for (let i = 0; i < end; i++) {
      const sorted = range(end + 1, n - 1);
      yield frame(
        a,
        { compare: [i, i + 1], sorted },
        `Compare ${a[i]} and ${a[i + 1]}.`,
      );
      if (a[i] > a[i + 1]) {
        [a[i], a[i + 1]] = [a[i + 1], a[i]];
        swapped = true;
        yield frame(
          a,
          { swap: [i, i + 1], sorted },
          `${a[i + 1]} > ${a[i]} — swap.`,
        );
      }
    }
    yield frame(
      a,
      { sorted: range(end, n - 1) },
      `Pass complete: position ${end} is fixed.`,
    );
    if (!swapped) break;
  }
  yield frame(a, { sorted: range(0, n - 1) }, "Sorted.");
}

// ---------------------------------------------------------------------------
// Insertion sort
// ---------------------------------------------------------------------------

export function* insertionSort(input: number[]): Generator<Frame> {
  const a = [...input];
  const n = a.length;
  yield frame(
    a,
    {},
    "Start: grow a sorted prefix, inserting each element into place.",
  );

  for (let i = 1; i < n; i++) {
    const value = a[i];
    yield frame(
      a,
      { pointers: { i }, range: [0, i - 1] },
      `Insert ${value} into the sorted prefix.`,
    );
    let j = i - 1;
    while (j >= 0 && a[j] > value) {
      yield frame(
        a,
        { compare: [j, j + 1], range: [0, i] },
        `${a[j]} > ${value} — shift right.`,
      );
      a[j + 1] = a[j];
      j--;
    }
    a[j + 1] = value;
    yield frame(
      a,
      { set: j + 1, range: [0, i] },
      `Place ${value} at index ${j + 1}.`,
    );
  }
  yield frame(a, { sorted: range(0, n - 1) }, "Sorted.");
}

// ---------------------------------------------------------------------------
// Merge sort
// ---------------------------------------------------------------------------

export function* mergeSort(input: number[]): Generator<Frame> {
  const a = [...input];
  const n = a.length;
  yield frame(a, {}, "Start: divide, sort halves, merge.");

  function* sort(lo: number, hi: number): Generator<Frame> {
    if (hi - lo < 1) return;
    const mid = Math.floor((lo + hi) / 2);
    yield frame(
      a,
      { range: [lo, hi], pointers: { mid } },
      `Split [${lo}, ${hi}] at ${mid}.`,
    );
    yield* sort(lo, mid);
    yield* sort(mid + 1, hi);

    // Merge a[lo..mid] and a[mid+1..hi]
    const left = a.slice(lo, mid + 1);
    const right = a.slice(mid + 1, hi + 1);
    let i = 0,
      j = 0,
      k = lo;
    while (i < left.length && j < right.length) {
      yield frame(
        a,
        { range: [lo, hi], compare: [lo + i, mid + 1 + j] },
        `Merge: compare ${left[i]} and ${right[j]}.`,
      );
      a[k] = left[i] <= right[j] ? left[i++] : right[j++];
      yield frame(
        a,
        { range: [lo, hi], set: k },
        `Write ${a[k]} to index ${k}.`,
      );
      k++;
    }
    while (i < left.length) {
      a[k] = left[i++];
      yield frame(a, { range: [lo, hi], set: k }, `Copy ${a[k]} down.`);
      k++;
    }
    while (j < right.length) {
      a[k] = right[j++];
      yield frame(a, { range: [lo, hi], set: k }, `Copy ${a[k]} down.`);
      k++;
    }
    yield frame(a, { range: [lo, hi] }, `Merged [${lo}, ${hi}].`);
  }

  yield* sort(0, n - 1);
  yield frame(a, { sorted: range(0, n - 1) }, "Sorted.");
}

// ---------------------------------------------------------------------------
// Quick sort (Lomuto partition)
// ---------------------------------------------------------------------------

export function* quickSort(input: number[]): Generator<Frame> {
  const a = [...input];
  const n = a.length;
  const settled: number[] = [];
  yield frame(a, {}, "Start: partition around a pivot, recurse on both sides.");

  function* sort(lo: number, hi: number): Generator<Frame> {
    if (lo > hi) return;
    if (lo === hi) {
      settled.push(lo);
      yield frame(a, { sorted: [...settled] }, `Index ${lo} settled.`);
      return;
    }
    const pivot = a[hi];
    yield frame(
      a,
      { range: [lo, hi], pivot: hi, sorted: [...settled] },
      `Partition [${lo}, ${hi}] around pivot ${pivot}.`,
    );
    let i = lo;
    for (let j = lo; j < hi; j++) {
      yield frame(
        a,
        {
          range: [lo, hi],
          pivot: hi,
          compare: [j],
          pointers: { i },
          sorted: [...settled],
        },
        `Is ${a[j]} < ${pivot}?`,
      );
      if (a[j] < pivot) {
        if (i !== j) {
          [a[i], a[j]] = [a[j], a[i]];
          yield frame(
            a,
            { range: [lo, hi], pivot: hi, swap: [i, j], sorted: [...settled] },
            `Yes — swap to the small side.`,
          );
        }
        i++;
      }
    }
    [a[i], a[hi]] = [a[hi], a[i]];
    settled.push(i);
    yield frame(
      a,
      { range: [lo, hi], swap: [i, hi], sorted: [...settled] },
      `Pivot ${pivot} lands at its final index ${i}.`,
    );
    yield* sort(lo, i - 1);
    yield* sort(i + 1, hi);
  }

  yield* sort(0, n - 1);
  yield frame(a, { sorted: range(0, n - 1) }, "Sorted.");
}
