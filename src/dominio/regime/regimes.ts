import { Aliquota } from '../aliquota.js';
import { Dinheiro } from '../dinheiro.js';
import type {
  DefinicaoDeRegime,
  RegrasDeApuracao,
} from './regime-tributario.js';

const quinzePorCento = Aliquota.de(15n, 100n);
const vintePorCento = Aliquota.de(20n, 100n);

// #region regimes-vigentes
// Ganhos em bolsa pela Lei 11.033/2004 (art. 2º e art. 3º, I) e pela
// IN RFB 1.585/2015 (arts. 37, 57, 59 e 65).
const apuracaoDaLei11033: RegrasDeApuracao = {
  'acoes-comum': {
    aliquota: quinzePorCento,
    isencaoAte: Dinheiro.deCentavos(20_000_00n),
  },
  'day-trade': { aliquota: vintePorCento },
  fii: { aliquota: vintePorCento },
  etf: { aliquota: quinzePorCento },
};

// JCP retido na fonte: 15% até 2025 (Lei 9.249/1995, art. 9º, § 2º)
// e 17,5% desde 1º/1/2026 (LC 224/2025, art. 8º, e art. 14, III).
const proventosAte2025 = { jcp: quinzePorCento };
const proventosDesde2026 = { jcp: Aliquota.de(175n, 1000n) };

// O Lastro começa em 2024, quando a Lei 14.754/2023 passou a produzir
// efeitos (art. 47, II). Uma data anterior não tem regime.
export const definicoesDoLastro: readonly DefinicaoDeRegime[] = [
  {
    nome: '2024-2025',
    inicio: '2024-01-01',
    fim: '2026-01-01',
    apuracao: apuracaoDaLei11033,
    proventos: proventosAte2025,
  },
  {
    nome: '2026',
    inicio: '2026-01-01',
    apuracao: apuracaoDaLei11033,
    proventos: proventosDesde2026,
  },
];
// #endregion
