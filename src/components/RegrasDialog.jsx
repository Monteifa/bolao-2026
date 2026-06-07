import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

export function RegrasDialog({ open, onClose }) {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Regras de pontuação</DialogTitle>
        </DialogHeader>

        <div className="mt-2">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-2 font-medium text-muted-foreground">O que aconteceu</th>
                <th className="text-right py-2 font-medium text-muted-foreground">Pontos</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              <tr>
                <td className="py-3 pr-4">
                  <span className="font-medium">Placar exato</span>
                  <span className="text-muted-foreground"> (palpitou 2×1, deu 2×1)</span>
                </td>
                <td className="py-3 text-right font-semibold text-green-400">10</td>
              </tr>
              <tr>
                <td className="py-3 pr-4">
                  <span className="font-medium">Acertou vencedor + gols de UM time</span>
                  <span className="text-muted-foreground"> (palpitou 2×1, deu 2×0)</span>
                </td>
                <td className="py-3 text-right font-semibold text-orange-400">7</td>
              </tr>
              <tr>
                <td className="py-3 pr-4">
                  <span className="font-medium">Só acertou o vencedor</span>
                  <span className="text-muted-foreground"> (palpitou 3×0, deu 2×1) ou empate sem placar exato</span>
                </td>
                <td className="py-3 text-right font-semibold text-blue-400">5</td>
              </tr>
              <tr>
                <td className="py-3 pr-4">
                  <span className="font-medium">Errou</span>
                </td>
                <td className="py-3 text-right font-semibold text-red-400">0</td>
              </tr>
            </tbody>
          </table>
        </div>
      </DialogContent>
    </Dialog>
  )
}
