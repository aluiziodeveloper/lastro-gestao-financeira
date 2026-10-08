// Armadilhas de datas (Capítulo 3). O Node 24 executa este arquivo
// removendo os tipos: node exemplos/cap03/datas-armadilhas.ts
// Os fusos vão explícitos no Intl; a saída é igual em qualquer máquina.

function lerNoFuso(instante: Date, fuso: string): string {
  return new Intl.DateTimeFormat('pt-BR', {
    timeZone: fuso,
    weekday: 'long',
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(instante);
}

// Data sem hora: o JavaScript a lê como meia-noite em UTC.
const pregao = new Date('2026-03-16');
console.log('new Date("2026-03-16") →', pregao.toISOString());

// O mesmo instante, lido em três fusos. O getDate() faz a leitura no
// fuso da máquina: numa máquina em São Paulo, devolve 15.
for (const fuso of ['UTC', 'Asia/Tokyo', 'America/Sao_Paulo']) {
  console.log(`  ${fuso} →`, lerNoFuso(pregao, fuso));
}
