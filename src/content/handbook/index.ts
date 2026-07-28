import { chapter as apiDesignDepth } from "./api-design-depth";
import { chapter as behavioralStar } from "./behavioral-star";
import { chapter as codingInterviewExecution } from "./coding-interview-execution";
import { chapter as companyLoops } from "./company-loops";
import { chapter as complexityAndDs } from "./complexity-and-ds";
import { chapter as databasesSql } from "./databases-sql";
import { chapter as gitTestingDevops } from "./git-testing-devops";
import { chapter as languageToolkit } from "./language-toolkit";
import { chapter as leetcodePatterns } from "./leetcode-patterns";
import { chapter as networkingWeb } from "./networking-web";
import { chapter as oopAndDesign } from "./oop-and-design";
import { chapter as osConcurrency } from "./os-concurrency";
import { chapter as recruiterPlaybook } from "./recruiter-playbook";
import { chapter as recruitingTimeline } from "./recruiting-timeline";
import { chapter as restApiBackend } from "./rest-api-backend";
import { chapter as systemDesignIntern } from "./system-design-intern";
import { chapterText, TRACKS, type HandbookChapter, type Track } from "./types";

/** Ordered by track (as listed in TRACKS), then by each chapter's `order`. */
export const CHAPTERS: HandbookChapter[] = [
  leetcodePatterns,
  complexityAndDs,
  codingInterviewExecution,
  restApiBackend,
  apiDesignDepth,
  databasesSql,
  systemDesignIntern,
  osConcurrency,
  networkingWeb,
  gitTestingDevops,
  languageToolkit,
  oopAndDesign,
  behavioralStar,
  recruiterPlaybook,
  recruitingTimeline,
  companyLoops,
].sort((a, b) => {
  const trackDelta =
    TRACKS.findIndex((t) => t.id === a.track) -
    TRACKS.findIndex((t) => t.id === b.track);
  return trackDelta !== 0 ? trackDelta : a.order - b.order;
});

export function getChapter(slug: string): HandbookChapter | undefined {
  return CHAPTERS.find((c) => c.slug === slug);
}

export function chaptersByTrack(): Record<Track, HandbookChapter[]> {
  const grouped = {} as Record<Track, HandbookChapter[]>;
  for (const chapter of CHAPTERS) {
    (grouped[chapter.track] ??= []).push(chapter);
  }
  return grouped;
}

/** Substring search across every chapter's prose, code, and Q&A. */
export function searchChapters(query: string): HandbookChapter[] {
  const needle = query.trim().toLowerCase();
  if (!needle) return [];
  return CHAPTERS.filter((c) => chapterText(c).includes(needle));
}

/** Previous/next in reading order, for the chapter footer. */
export function neighbors(slug: string) {
  const i = CHAPTERS.findIndex((c) => c.slug === slug);
  return {
    prev: i > 0 ? CHAPTERS[i - 1] : null,
    next: i >= 0 && i < CHAPTERS.length - 1 ? CHAPTERS[i + 1] : null,
  };
}
