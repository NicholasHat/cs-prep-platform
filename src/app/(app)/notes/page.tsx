import { ComingSoon } from "@/components/shell/coming-soon";

export const metadata = { title: "Notes" };

export default function NotesPage() {
  return (
    <ComingSoon
      title="Notes"
      phase="Phase 5"
      description="Markdown notes tied to problems and topics, with an AI assistant to summarize, quiz, and clarify."
    />
  );
}
