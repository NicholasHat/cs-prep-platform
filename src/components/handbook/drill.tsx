"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Eye, RotateCcw, Shuffle, ThumbsDown, ThumbsUp } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Markdown } from "@/components/ui/markdown";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

/**
 * Seeded PRNG so the shuffle is a pure function of `seed`. Calling Math.random
 * during render would make the deck order re-roll on every re-render.
 */
function mulberry32(seed: number) {
  let a = seed;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const randomSeed = () => Math.floor(Math.random() * 1e9);

export interface DrillCard {
  q: string;
  a: string;
  weak?: string;
  chapterSlug: string;
  chapterTitle: string;
  track: string;
}

/**
 * Self-graded flashcards. Cards marked "needs work" are requeued at the end of
 * the round, so a session ends only once everything has been answered
 * confidently at least once.
 */
export function Drill({
  cards,
  tracks,
}: {
  cards: DrillCard[];
  tracks: { id: string; label: string }[];
}) {
  const [track, setTrack] = useState<string | null>(null);
  const [seed, setSeed] = useState(1);
  const [index, setIndex] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [queue, setQueue] = useState<number[]>([]);
  const [confident, setConfident] = useState(0);

  const pool = useMemo(
    () => cards.filter((c) => !track || c.track === track),
    [cards, track],
  );

  // The server and the first client render must agree, so the deck starts from
  // a fixed seed and is randomized only after hydration. Seeding during render
  // (or in a lazy useState initializer) would make the server and client
  // disagree on card order and blow up hydration.
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => setSeed(randomSeed()), []);

  const order = useMemo(() => {
    const rand = mulberry32(seed);
    const idx = pool.map((_, i) => i);
    for (let i = idx.length - 1; i > 0; i--) {
      const j = Math.floor(rand() * (i + 1));
      [idx[i], idx[j]] = [idx[j], idx[i]];
    }
    return idx;
  }, [pool, seed]);

  const deck = queue.length > 0 ? queue : order;
  const card = pool[deck[index]];
  const done = index >= deck.length;

  const reset = (nextTrack: string | null) => {
    setTrack(nextTrack);
    setIndex(0);
    setRevealed(false);
    setQueue([]);
    setConfident(0);
    setSeed(randomSeed());
  };

  const grade = (knewIt: boolean) => {
    if (!knewIt) {
      setQueue((prev) => [...(prev.length ? prev : order), deck[index]]);
    } else {
      setConfident((c) => c + 1);
    }
    setRevealed(false);
    setIndex((i) => i + 1);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-1.5">
        <button onClick={() => reset(null)}>
          <Badge variant={track ? "outline" : "default"}>
            all ({cards.length})
          </Badge>
        </button>
        {tracks.map((t) => {
          const n = cards.filter((c) => c.track === t.id).length;
          if (n === 0) return null;
          return (
            <button key={t.id} onClick={() => reset(t.id)}>
              <Badge variant={track === t.id ? "default" : "outline"}>
                {t.label} ({n})
              </Badge>
            </button>
          );
        })}
        <Button
          variant="ghost"
          size="sm"
          className="ml-auto gap-1"
          onClick={() => reset(track)}
        >
          <Shuffle className="size-4" /> Reshuffle
        </Button>
      </div>

      <div className="space-y-1.5">
        <Progress
          value={deck.length ? (Math.min(index, deck.length) / deck.length) * 100 : 0}
        />
        <p className="text-xs text-muted-foreground">
          {Math.min(index, deck.length)} of {deck.length} · {confident} answered
          confidently
        </p>
      </div>

      {done ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
            <p className="text-lg font-medium">Round complete</p>
            <p className="text-sm text-muted-foreground">
              {confident} of {deck.length} answered confidently.
            </p>
            <Button onClick={() => reset(track)} className="gap-1">
              <RotateCcw className="size-4" /> Go again
            </Button>
          </CardContent>
        </Card>
      ) : card ? (
        <Card>
          <CardHeader className="pb-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <Link href={`/handbook/${card.chapterSlug}`}>
                <Badge variant="secondary" className="hover:bg-secondary/80">
                  {card.chapterTitle}
                </Badge>
              </Link>
            </div>
            <CardTitle className="pt-2 text-lg leading-snug">
              {card.q}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {revealed ? (
              <>
                <Markdown>{card.a}</Markdown>
                {card.weak && (
                  <div className="rounded-md border border-red-500/30 bg-red-500/5 p-3">
                    <p className="mb-1 text-xs font-semibold tracking-wide text-red-600 uppercase dark:text-red-400">
                      A weak answer sounds like
                    </p>
                    <Markdown className="text-muted-foreground">
                      {card.weak}
                    </Markdown>
                  </div>
                )}
                <div className="flex flex-wrap gap-2 border-t pt-3">
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-1"
                    onClick={() => grade(false)}
                  >
                    <ThumbsDown className="size-4" /> Needs work
                  </Button>
                  <Button
                    size="sm"
                    className="gap-1"
                    onClick={() => grade(true)}
                  >
                    <ThumbsUp className="size-4" /> Got it
                  </Button>
                </div>
              </>
            ) : (
              <div className={cn("flex flex-col gap-3")}>
                <p className="text-sm text-muted-foreground">
                  Answer out loud, then reveal.
                </p>
                <Button
                  variant="outline"
                  className="gap-1 self-start"
                  onClick={() => setRevealed(true)}
                >
                  <Eye className="size-4" /> Reveal answer
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      ) : (
        <p className="py-8 text-center text-sm text-muted-foreground">
          No questions in this track yet.
        </p>
      )}
    </div>
  );
}
