import confetti from "canvas-confetti";

/** Quick, non-blocking celebration burst. Fire-and-forget. */
export function celebrate() {
  confetti({
    particleCount: 90,
    spread: 70,
    startVelocity: 38,
    origin: { y: 0.75 },
    disableForReducedMotion: true,
  });
}

/** Bigger moment — streak milestones, category completion. */
export function celebrateBig() {
  const end = Date.now() + 600;
  (function frame() {
    confetti({
      particleCount: 5,
      angle: 60,
      spread: 55,
      origin: { x: 0 },
      disableForReducedMotion: true,
    });
    confetti({
      particleCount: 5,
      angle: 120,
      spread: 55,
      origin: { x: 1 },
      disableForReducedMotion: true,
    });
    if (Date.now() < end) requestAnimationFrame(frame);
  })();
}
