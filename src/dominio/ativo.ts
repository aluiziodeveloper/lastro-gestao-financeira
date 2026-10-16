import type { DataDoCalendario } from './data-do-calendario.js';
import type { Emissor } from './emissor.js';
import { err, ok, type Result } from './resultado.js';
import {
  incluirEmOrdem,
  type SituacaoDoFundo,
  situacaoEm,
} from './situacao-do-fundo.js';
import type { Ticker } from './ticker.js';

// #region catalogo-de-ativos
// A classe do ativo é dado de catálogo, e não dedução pelo ticker: o
// sufixo 11 serve a FIIs, a ETFs e a units, que são ações.
export type ClasseDeAtivo = 'acao' | 'fii' | 'etf';

export type ErroDeCatalogo =
  | { readonly tipo: 'ativo-fora-do-catalogo'; readonly ticker: Ticker }
  | { readonly tipo: 'emissor-desconhecido'; readonly ticker: Ticker }
  | {
      readonly tipo: 'situacao-do-fundo-desconhecida';
      readonly ticker: Ticker;
      readonly data: DataDoCalendario;
    };
// #endregion

// Tudo o que o catálogo sabe de um ativo; as situações, em ordem.
interface FichaDoAtivo {
  readonly classe: ClasseDeAtivo;
  readonly situacoes: readonly SituacaoDoFundo[];
  readonly emissor?: Emissor;
}

// Coleção de primeira classe: quem usa o catálogo pergunta a classe
// de um ativo, sem ver o mapa. Cada inclusão devolve um catálogo novo.
export class CatalogoDeAtivos {
  readonly #fichas: ReadonlyMap<string, FichaDoAtivo>;

  private constructor(fichas: ReadonlyMap<string, FichaDoAtivo>) {
    this.#fichas = fichas;
  }

  static vazio(): CatalogoDeAtivos {
    return new CatalogoDeAtivos(new Map());
  }

  com(ticker: Ticker, classe: ClasseDeAtivo): CatalogoDeAtivos {
    return this.#comFicha(ticker, { classe, situacoes: [] });
  }

  comSituacaoDoFundo(
    ticker: Ticker,
    situacao: SituacaoDoFundo,
  ): Result<CatalogoDeAtivos, ErroDeCatalogo> {
    return this.#alterarFicha(ticker, (ficha) => ({
      ...ficha,
      situacoes: incluirEmOrdem(ficha.situacoes, situacao),
    }));
  }

  comEmissor(
    ticker: Ticker,
    emissor: Emissor,
  ): Result<CatalogoDeAtivos, ErroDeCatalogo> {
    return this.#alterarFicha(ticker, (ficha) => ({
      ...ficha,
      emissor,
    }));
  }

  emissorDe(ticker: Ticker): Result<Emissor, ErroDeCatalogo> {
    const ficha = this.#fichaDe(ticker);
    if (!ficha.ok) {
      return ficha;
    }
    return ficha.valor.emissor === undefined
      ? err({ tipo: 'emissor-desconhecido', ticker })
      : ok(ficha.valor.emissor);
  }

  classeDe(ticker: Ticker): Result<ClasseDeAtivo, ErroDeCatalogo> {
    const ficha = this.#fichaDe(ticker);
    return ficha.ok ? ok(ficha.valor.classe) : ficha;
  }

  situacaoDoFundoEm(
    ticker: Ticker,
    data: DataDoCalendario,
  ): Result<SituacaoDoFundo, ErroDeCatalogo> {
    const ficha = this.#fichaDe(ticker);
    if (!ficha.ok) {
      return ficha;
    }
    const situacao = situacaoEm(ficha.valor.situacoes, data);
    return situacao === undefined
      ? err({ tipo: 'situacao-do-fundo-desconhecida', ticker, data })
      : ok(situacao);
  }

  #fichaDe(ticker: Ticker): Result<FichaDoAtivo, ErroDeCatalogo> {
    const ficha = this.#fichas.get(ticker.paraTexto());
    if (ficha === undefined) {
      return err({ tipo: 'ativo-fora-do-catalogo', ticker });
    }
    return ok(ficha);
  }

  #alterarFicha(
    ticker: Ticker,
    alteracao: (ficha: FichaDoAtivo) => FichaDoAtivo,
  ): Result<CatalogoDeAtivos, ErroDeCatalogo> {
    const ficha = this.#fichaDe(ticker);
    return ficha.ok
      ? ok(this.#comFicha(ticker, alteracao(ficha.valor)))
      : ficha;
  }

  #comFicha(ticker: Ticker, ficha: FichaDoAtivo): CatalogoDeAtivos {
    const fichas = new Map(this.#fichas);
    fichas.set(ticker.paraTexto(), ficha);
    return new CatalogoDeAtivos(fichas);
  }
}
