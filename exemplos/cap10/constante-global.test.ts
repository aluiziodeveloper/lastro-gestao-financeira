import { describe, expect, it } from 'vitest';

import { criarDataDoCalendario } from '../../src/dominio/data-do-calendario.js';
import { Dinheiro } from '../../src/dominio/dinheiro.js';
import { definicoesDoLastro } from '../../src/dominio/regime/regimes.js';
import { RegimesTributarios } from '../../src/dominio/regime/regimes-tributarios.js';
import { extrair } from '../../test/apoio/resultado.js';
import { impostoDoMes } from './constante-global.js';

const lucro = 1_200_00n;

// O imposto de ações em operação comum pelo regime do mês no Lastro.
function peloLastro(mes: string): Dinheiro {
  const regimes = extrair(RegimesTributarios.criar(definicoesDoLastro));
  const data = extrair(criarDataDoCalendario(`${mes}-01`));
  const { apuracao } = extrair(regimes.vigenteEm(data));
  return apuracao['acoes-comum'].aliquota.sobreGanho(
    Dinheiro.deCentavos(lucro),
  );
}

// #region constante-global-testes
// O mesmo mês nos dois sistemas. A falha é o objeto do exemplo:
// it.fails a mantém na suíte verde.
describe('a constante da cena', () => {
  it('ignora o mês: março de 2025 e de 2026 dão o mesmo', () => {
    expect(impostoDoMes('2025-03', lucro)).toBe(
      impostoDoMes('2026-03', lucro),
    );
  });

  it('o Lastro calcula março de 2025 a 15%: R$ 180,00', () => {
    expect(peloLastro('2025-03')).toEqual(Dinheiro.deCentavos(180_00n));
  });

  it.fails('dá a março de 2025 os R$ 180,00 do Lastro', () => {
    expect(impostoDoMes('2025-03', lucro)).toBe(180_00n);
  });
});
// #endregion
