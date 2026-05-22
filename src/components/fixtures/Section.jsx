import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ROUNDS } from "@/constants/rounds";

export default function Section({ title, children, count, rounds, selectedRound, onRoundChange }) {
  if (!count && !rounds) return null;
  return (
    <div className="mb-6">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <h2 className="text-sm font-semibold">{title}</h2>
          {count > 0 && (
            <span className="text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded-full">{count}</span>
          )}
        </div>
        {rounds && (
          <Select value={selectedRound ?? ""} onValueChange={onRoundChange}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Selecione a rodada" />
            </SelectTrigger>
            <SelectContent position="popper" side="bottom">
              {rounds.map((r) => (
                <SelectItem key={r} value={r}>{ROUNDS[r] ?? r}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>
      {children && <div className="space-y-3">{children}</div>}
    </div>
  );
}
