import { err, ok, type Result } from './resultado.js';
import type { Ticker } from './ticker.js';

// #region catalogo-de-ativos
// A classe do ativo é dado de catálogo, e não dedução pelo ticker: o
// sufixo 11 serve a FIIs, a ETFs e a units, que são ações.
export type ClasseDeAtivo = 'acao' | 'fii' | 'etf';

export interface ErroDeCatalogo {
  readonly tipo: 'ativo-fora-do-catalogo';
  readonly ticker: Ticker;
}

// Coleção de primeira classe: quem usa o catálogo pergunta a classe
// de um ativo, sem ver o mapa. Cada inclusão devolve um catálogo novo.
export class CatalogoDeAtivos {
  readonly #classes: ReadonlyMap<string, ClasseDeAtivo>;

  private constructor(classes: ReadonlyMap<string, ClasseDeAtivo>) {
    this.#classes = classes;
  }

  static vazio(): CatalogoDeAtivos {
    return new CatalogoDeAtivos(new Map());
  }

  com(ticker: Ticker, classe: ClasseDeAtivo): CatalogoDeAtivos {
    const classes = new Map(this.#classes);
    classes.set(ticker.paraTexto(), classe);
    return new CatalogoDeAtivos(classes);
  }

  classeDe(ticker: Ticker): Result<ClasseDeAtivo, ErroDeCatalogo> {
    const classe = this.#classes.get(ticker.paraTexto());
    if (classe === undefined) {
      return err({ tipo: 'ativo-fora-do-catalogo', ticker });
    }
    return ok(classe);
  }
}
// #endregion
