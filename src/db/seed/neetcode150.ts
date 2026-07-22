/**
 * The NeetCode 150 problem catalog, in NeetCode's canonical category order.
 * Slugs match LeetCode URL slugs (https://leetcode.com/problems/<slug>/).
 */

export type Difficulty = "easy" | "medium" | "hard";

export interface SeedProblem {
  slug: string;
  title: string;
  category: string;
  difficulty: Difficulty;
  sortOrder: number;
  leetcodeUrl: string;
}

/** [title, difficulty, optional slug override] */
type Entry = [string, Difficulty, string?];

const CATALOG: Record<string, Entry[]> = {
  "Arrays & Hashing": [
    ["Contains Duplicate", "easy"],
    ["Valid Anagram", "easy"],
    ["Two Sum", "easy"],
    ["Group Anagrams", "medium"],
    ["Top K Frequent Elements", "medium"],
    ["Encode and Decode Strings", "medium"],
    ["Product of Array Except Self", "medium"],
    ["Valid Sudoku", "medium"],
    ["Longest Consecutive Sequence", "medium"],
  ],
  "Two Pointers": [
    ["Valid Palindrome", "easy"],
    ["Two Sum II Input Array Is Sorted", "medium", "two-sum-ii-input-array-is-sorted"],
    ["3Sum", "medium"],
    ["Container With Most Water", "medium"],
    ["Trapping Rain Water", "hard"],
  ],
  "Sliding Window": [
    ["Best Time to Buy and Sell Stock", "easy"],
    ["Longest Substring Without Repeating Characters", "medium"],
    ["Longest Repeating Character Replacement", "medium"],
    ["Permutation in String", "medium"],
    ["Minimum Window Substring", "hard"],
    ["Sliding Window Maximum", "hard"],
  ],
  Stack: [
    ["Valid Parentheses", "easy"],
    ["Min Stack", "medium"],
    ["Evaluate Reverse Polish Notation", "medium"],
    ["Generate Parentheses", "medium"],
    ["Daily Temperatures", "medium"],
    ["Car Fleet", "medium"],
    ["Largest Rectangle in Histogram", "hard"],
  ],
  "Binary Search": [
    ["Binary Search", "easy"],
    ["Search a 2D Matrix", "medium"],
    ["Koko Eating Bananas", "medium"],
    ["Find Minimum in Rotated Sorted Array", "medium"],
    ["Search in Rotated Sorted Array", "medium"],
    ["Time Based Key-Value Store", "medium", "time-based-key-value-store"],
    ["Median of Two Sorted Arrays", "hard"],
  ],
  "Linked List": [
    ["Reverse Linked List", "easy"],
    ["Merge Two Sorted Lists", "easy"],
    ["Reorder List", "medium"],
    ["Remove Nth Node From End of List", "medium"],
    ["Copy List with Random Pointer", "medium"],
    ["Add Two Numbers", "medium"],
    ["Linked List Cycle", "easy"],
    ["Find the Duplicate Number", "medium"],
    ["LRU Cache", "medium"],
    ["Merge K Sorted Lists", "hard"],
    ["Reverse Nodes in k-Group", "hard"],
  ],
  Trees: [
    ["Invert Binary Tree", "easy"],
    ["Maximum Depth of Binary Tree", "easy"],
    ["Diameter of Binary Tree", "easy"],
    ["Balanced Binary Tree", "easy"],
    ["Same Tree", "easy"],
    ["Subtree of Another Tree", "easy"],
    [
      "Lowest Common Ancestor of a Binary Search Tree",
      "medium",
    ],
    ["Binary Tree Level Order Traversal", "medium"],
    ["Binary Tree Right Side View", "medium"],
    ["Count Good Nodes in Binary Tree", "medium"],
    ["Validate Binary Search Tree", "medium"],
    ["Kth Smallest Element in a BST", "medium"],
    [
      "Construct Binary Tree from Preorder and Inorder Traversal",
      "medium",
    ],
    ["Binary Tree Maximum Path Sum", "hard"],
    ["Serialize and Deserialize Binary Tree", "hard"],
  ],
  "Heap / Priority Queue": [
    ["Kth Largest Element in a Stream", "easy"],
    ["Last Stone Weight", "easy"],
    ["K Closest Points to Origin", "medium"],
    ["Kth Largest Element in an Array", "medium"],
    ["Task Scheduler", "medium"],
    ["Design Twitter", "medium"],
    ["Find Median from Data Stream", "hard"],
  ],
  Backtracking: [
    ["Subsets", "medium"],
    ["Combination Sum", "medium"],
    ["Permutations", "medium"],
    ["Subsets II", "medium"],
    ["Combination Sum II", "medium"],
    ["Word Search", "medium"],
    ["Palindrome Partitioning", "medium"],
    ["Letter Combinations of a Phone Number", "medium"],
    ["N-Queens", "hard"],
  ],
  Tries: [
    ["Implement Trie (Prefix Tree)", "medium"],
    ["Design Add and Search Words Data Structure", "medium"],
    ["Word Search II", "hard"],
  ],
  Graphs: [
    ["Number of Islands", "medium"],
    ["Clone Graph", "medium"],
    ["Max Area of Island", "medium"],
    ["Pacific Atlantic Water Flow", "medium"],
    ["Surrounded Regions", "medium"],
    ["Rotting Oranges", "medium"],
    ["Walls and Gates", "medium"],
    ["Course Schedule", "medium"],
    ["Course Schedule II", "medium"],
    ["Redundant Connection", "medium"],
    [
      "Number of Connected Components in an Undirected Graph",
      "medium",
    ],
    ["Graph Valid Tree", "medium"],
    ["Word Ladder", "hard"],
  ],
  "Advanced Graphs": [
    ["Reconstruct Itinerary", "hard"],
    ["Min Cost to Connect All Points", "medium"],
    ["Network Delay Time", "medium"],
    ["Swim in Rising Water", "hard"],
    ["Alien Dictionary", "hard"],
    ["Cheapest Flights Within K Stops", "medium"],
  ],
  "1-D Dynamic Programming": [
    ["Climbing Stairs", "easy"],
    ["Min Cost Climbing Stairs", "easy"],
    ["House Robber", "medium"],
    ["House Robber II", "medium"],
    ["Longest Palindromic Substring", "medium"],
    ["Palindromic Substrings", "medium"],
    ["Decode Ways", "medium"],
    ["Coin Change", "medium"],
    ["Maximum Product Subarray", "medium"],
    ["Word Break", "medium"],
    ["Longest Increasing Subsequence", "medium"],
    ["Partition Equal Subset Sum", "medium"],
  ],
  "2-D Dynamic Programming": [
    ["Unique Paths", "medium"],
    ["Longest Common Subsequence", "medium"],
    ["Best Time to Buy and Sell Stock with Cooldown", "medium"],
    ["Coin Change II", "medium"],
    ["Target Sum", "medium"],
    ["Interleaving String", "medium"],
    ["Longest Increasing Path in a Matrix", "hard"],
    ["Distinct Subsequences", "hard"],
    ["Edit Distance", "medium"],
    ["Burst Balloons", "hard"],
    ["Regular Expression Matching", "hard"],
  ],
  Greedy: [
    ["Maximum Subarray", "medium"],
    ["Jump Game", "medium"],
    ["Jump Game II", "medium"],
    ["Gas Station", "medium"],
    ["Hand of Straights", "medium"],
    ["Merge Triplets to Form Target Triplet", "medium"],
    ["Partition Labels", "medium"],
    ["Valid Parenthesis String", "medium"],
  ],
  Intervals: [
    ["Insert Interval", "medium"],
    ["Merge Intervals", "medium"],
    ["Non-overlapping Intervals", "medium", "non-overlapping-intervals"],
    ["Meeting Rooms", "easy"],
    ["Meeting Rooms II", "medium"],
    ["Minimum Interval to Include Each Query", "hard"],
  ],
  "Math & Geometry": [
    ["Rotate Image", "medium"],
    ["Spiral Matrix", "medium"],
    ["Set Matrix Zeroes", "medium"],
    ["Happy Number", "easy"],
    ["Plus One", "easy"],
    ["Pow(x, n)", "medium", "powx-n"],
    ["Multiply Strings", "medium"],
    ["Detect Squares", "medium"],
  ],
  "Bit Manipulation": [
    ["Single Number", "easy"],
    ["Number of 1 Bits", "easy"],
    ["Counting Bits", "easy"],
    ["Reverse Bits", "easy"],
    ["Missing Number", "easy"],
    ["Sum of Two Integers", "medium"],
    ["Reverse Integer", "medium"],
  ],
};

export const CATEGORIES = Object.keys(CATALOG);

function slugify(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-");
}

export const NEETCODE_150: SeedProblem[] = Object.entries(CATALOG).flatMap(
  ([category, entries], categoryIndex) =>
    entries.map(([title, difficulty, slugOverride], i) => {
      const slug = slugOverride ?? slugify(title);
      return {
        slug,
        title,
        category,
        difficulty,
        sortOrder: categoryIndex * 100 + i,
        leetcodeUrl: `https://leetcode.com/problems/${slug}/`,
      };
    }),
);

if (NEETCODE_150.length !== 150) {
  throw new Error(
    `NeetCode catalog must contain exactly 150 problems, found ${NEETCODE_150.length}`,
  );
}
