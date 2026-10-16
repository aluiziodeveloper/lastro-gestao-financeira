import type { CatalogoDeAtivos } from './ativo.js';
import type { RegimesTributarios } from './regime/regimes-tributarios.js';

// #region dados-de-referencia
// O que a apuração consulta e não muda com as operações do mês: o
// catálogo dos ativos e os regimes da lei. Os dois viajam juntos, e
// por isso são um só parâmetro.
export interface DadosDeReferencia {
  readonly catalogo: CatalogoDeAtivos;
  readonly regimes: RegimesTributarios;
}
// #endregion
