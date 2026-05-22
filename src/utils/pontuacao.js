export function calcularPontos(palpite, resultadoReal) {
  const p1 = palpite.golsTime1;
  const p2 = palpite.golsTime2;
  const r1 = resultadoReal.golsTime1;
  const r2 = resultadoReal.golsTime2;

  if (p1 === r1 && p2 === r2) {
    return { pontos: 10, tipo: "exato" };
  }

  const resPalpite = Math.sign(p1 - p2);
  const resReal = Math.sign(r1 - r2);
  const acertouVencedor = resPalpite === resReal;

  if (acertouVencedor) {
    if (p1 === r1 || p2 === r2) {
      return { pontos: 7, tipo: "vencedor1" };
    }
    return { pontos: 5, tipo: "vencedor" };
  }

  return { pontos: 0, tipo: "erro" };
}
