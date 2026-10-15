// #region categoria-por-heranca
// O contraexemplo: as categorias como subclasses de uma classe base,
// com valores em centavos. A base garante o contrato em apurar; uma
// subclasse pode reescrever apurar e levar o contrato embora.
export interface TotaisDoMes {
  readonly totalVendido: bigint;
  readonly resultado: bigint;
}

export abstract class Categoria {
  constructor(
    readonly nome: string,
    protected readonly aliquotaPorCento: bigint,
  ) {}

  apurar(totais: TotaisDoMes): bigint {
    if (totais.resultado <= 0n || this.isenta(totais)) {
      return 0n;
    }
    return (totais.resultado * this.aliquotaPorCento) / 100n;
  }

  protected abstract isenta(totais: TotaisDoMes): boolean;
}

export class AcoesComum extends Categoria {
  constructor() {
    super('acoes-comum', 15n);
  }

  protected override isenta({ totalVendido }: TotaisDoMes): boolean {
    return totalVendido <= 20_000_00n;
  }
}

export class DayTrade extends Categoria {
  constructor() {
    super('day-trade', 20n);
  }

  // Reescreve a conta para guardar o prejuízo como crédito do mês.
  override apurar({ resultado }: TotaisDoMes): bigint {
    return (resultado * this.aliquotaPorCento) / 100n;
  }

  protected override isenta(): boolean {
    return false;
  }
}
// #endregion
