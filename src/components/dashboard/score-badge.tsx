import { Badge } from "@/components/ui/badge";

/** Color a numeric compliance score using the brand semantics. */
export function ScoreBadge({ score }: { score: number | null }) {
  if (score === null) return <Badge variant="muted">Pending</Badge>;
  if (score >= 90) return <Badge variant="success">{score} · Strong</Badge>;
  if (score >= 70) return <Badge variant="default">{score} · Fair</Badge>;
  if (score >= 40) return <Badge variant="warning">{score} · At risk</Badge>;
  return <Badge variant="danger">{score} · Critical</Badge>;
}
