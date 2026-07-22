import { randomArray, randomSortedArray } from "./engine";
import { subsets, createSubsetsInput } from "./algorithms/backtracking";
import { createUniquePathsInput, uniquePaths } from "./algorithms/dp";
import {
  bfsGrid,
  createMaze,
  createWeightedGrid,
  dfsGrid,
  dijkstraGrid,
} from "./algorithms/graphs";
import {
  binarySearch,
  slidingWindowMaxSum,
  twoSumSorted,
} from "./algorithms/pointers";
import {
  bubbleSort,
  insertionSort,
  mergeSort,
  quickSort,
} from "./algorithms/sorting";
import type { AlgorithmDef } from "./types";

/* eslint-disable @typescript-eslint/no-explicit-any */
export const ALGORITHMS: AlgorithmDef<any>[] = [
  {
    id: "bubble-sort",
    name: "Bubble Sort",
    category: "Sorting",
    description:
      "Adjacent comparisons bubble the largest value to the end of each pass.",
    complexity: "O(n²) time · O(1) space",
    renderer: "array",
    createInput: () => randomArray(14),
    run: bubbleSort,
  },
  {
    id: "insertion-sort",
    name: "Insertion Sort",
    category: "Sorting",
    description:
      "Grow a sorted prefix by inserting each new element into place.",
    complexity: "O(n²) time · O(1) space",
    renderer: "array",
    createInput: () => randomArray(14),
    run: insertionSort,
  },
  {
    id: "merge-sort",
    name: "Merge Sort",
    category: "Sorting",
    description: "Divide in half, sort each side, merge the sorted halves.",
    complexity: "O(n log n) time · O(n) space",
    renderer: "array",
    createInput: () => randomArray(16),
    run: mergeSort,
  },
  {
    id: "quick-sort",
    name: "Quick Sort",
    category: "Sorting",
    description:
      "Partition around a pivot so it lands in final position; recurse on both sides.",
    complexity: "O(n log n) average · O(log n) space",
    renderer: "array",
    createInput: () => randomArray(14),
    run: quickSort,
  },
  {
    id: "binary-search",
    name: "Binary Search",
    category: "Searching",
    description: "Halve the search space by comparing against the midpoint.",
    complexity: "O(log n) time · O(1) space",
    renderer: "array",
    createInput: () => {
      const array = randomSortedArray(15);
      const target = array[Math.floor(Math.random() * array.length)];
      return { array, target };
    },
    run: binarySearch,
    relatedProblems: ["binary-search"],
  },
  {
    id: "two-pointers",
    name: "Two Pointers (Two Sum II)",
    category: "Two Pointers",
    description:
      "Pointers close in from both ends of a sorted array, steering by the sum.",
    complexity: "O(n) time · O(1) space",
    renderer: "array",
    createInput: () => {
      const array = randomSortedArray(12, 30);
      const i = Math.floor(Math.random() * (array.length / 2));
      const j =
        array.length - 1 - Math.floor(Math.random() * (array.length / 3));
      return { array, target: array[i] + array[Math.max(j, i + 1)] };
    },
    run: twoSumSorted,
    relatedProblems: ["two-sum-ii-input-array-is-sorted"],
  },
  {
    id: "sliding-window",
    name: "Sliding Window (Max Sum)",
    category: "Sliding Window",
    description:
      "Slide a fixed window, updating the sum in O(1) instead of recomputing.",
    complexity: "O(n) time · O(1) space",
    renderer: "array",
    createInput: () => ({ array: randomArray(16, 20), k: 4 }),
    run: slidingWindowMaxSum,
    relatedProblems: ["best-time-to-buy-and-sell-stock"],
  },
  {
    id: "bfs",
    name: "Breadth-First Search",
    category: "Graphs",
    description:
      "Explore level by level with a queue — first arrival is the shortest path.",
    complexity: "O(V + E) time · O(V) space",
    renderer: "grid",
    createInput: createMaze,
    run: bfsGrid,
    relatedProblems: ["number-of-islands", "rotting-oranges"],
  },
  {
    id: "dfs",
    name: "Depth-First Search",
    category: "Graphs",
    description: "Dive deep with a stack, backtracking at dead ends.",
    complexity: "O(V + E) time · O(V) space",
    renderer: "grid",
    createInput: createMaze,
    run: dfsGrid,
    relatedProblems: ["number-of-islands", "max-area-of-island"],
  },
  {
    id: "dijkstra",
    name: "Dijkstra's Algorithm",
    category: "Graphs",
    description:
      "Always settle the cheapest unsettled cell; relax its neighbors.",
    complexity: "O(E log V) time · O(V) space",
    renderer: "grid",
    createInput: createWeightedGrid,
    run: dijkstraGrid,
    relatedProblems: ["network-delay-time", "swim-in-rising-water"],
  },
  {
    id: "unique-paths",
    name: "DP Grid (Unique Paths)",
    category: "Dynamic Programming",
    description:
      "Each cell counts paths as the sum of the cell above and the cell to the left.",
    complexity: "O(m·n) time · O(m·n) space",
    renderer: "grid",
    createInput: createUniquePathsInput,
    run: uniquePaths,
    relatedProblems: ["unique-paths"],
  },
  {
    id: "subsets",
    name: "Backtracking (Subsets)",
    category: "Backtracking",
    description:
      "Include/exclude each element, recursing and un-choosing on the way back.",
    complexity: "O(2ⁿ) time · O(n) stack",
    renderer: "stack",
    createInput: createSubsetsInput,
    run: subsets,
    relatedProblems: ["subsets"],
  },
];
/* eslint-enable @typescript-eslint/no-explicit-any */

export function getAlgorithm(id: string) {
  return ALGORITHMS.find((a) => a.id === id) ?? null;
}

export const ALGORITHM_CATEGORIES = [
  ...new Set(ALGORITHMS.map((a) => a.category)),
];
