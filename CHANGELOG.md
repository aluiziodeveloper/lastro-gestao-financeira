# Changelog

Todas as mudanças do Lastro, geradas dos commits semânticos.

## 1.0.0 (17/10/2026)

### Novidades

- **operacao:** calcula valor bruto da operação
- **dinheiro:** cria objeto de valor Dinheiro em centavos com bigint
- **dinheiro:** adiciona soma e subtração sem perda de precisão
- **quantidade:** cria objeto de valor Quantidade inteira e positiva
- **dinheiro:** multiplica valor por quantidade de forma exata
- **dinheiro:** mostra o valor ao inspecionar no Node
- **dinheiro:** divide com modo de arredondamento explícito
- **ticker:** cria Ticker com normalização e formato da B3
- **resultado:** cria tipo Result com ok e err
- **operacao:** modela Operacao como união discriminada
- **operacao:** adiciona tipos marcados para identificador e data
- **operacao:** cria construtores inteligentes de compra e venda
- **operacao:** garante tratamento exaustivo dos tipos de operação
- **preco-medio:** calcula o preço médio da primeira compra
- **preco-medio:** pondera o preço médio em compras sucessivas
- **preco-medio:** inclui custos operacionais no preço médio
- **preco-medio:** baixa o custo proporcional na venda
- **preco-medio:** zera o preço médio ao encerrar a posição
- **carteira:** cria agregado Carteira com registro de compra
- **carteira:** impede venda a descoberto
- **carteira:** rejeita operação anterior à última registrada
- **eventos:** aplica desdobramento e grupamento à posição
- **ativo:** cria catálogo de ativos com classe
- **apuracao:** apura lucro mensal de ações em operação comum
- **apuracao:** aplica isenção de vendas até R$ 20 mil no mês
- **apuracao:** classifica operações de day trade por data
- **apuracao:** tributa day trade a 20% sem isenção
- **apuracao:** tributa venda de cotas de FII a 20%
- **apuracao:** apura ganho na venda de ETF
- **regime:** cria vigência como intervalo semiaberto de datas
- **regime:** cria RegimeTributario com data de vigência
- **proventos:** modela Provento como união discriminada
- **proventos:** retém JCP na fonte pela alíquota da data
- **proventos:** isenta rendimentos de FII que cumprem requisitos
- **proventos:** retém 10% do total de dividendos acima do limite
- **prejuizo:** acumula prejuízo por grupo de compensação
- **prejuizo:** compensa prejuízo só dentro do mesmo grupo
- **irrf:** deduz o imposto retido informado pela nota
- **calendario:** define dias úteis com feriados como dado
- **darf:** calcula valor e vencimento do DARF
- **darf:** leva ao mês seguinte o valor abaixo do mínimo
- **relatorio:** gera relatório mensal de imposto a pagar
- **relogio:** introduz a porta Relogio e o relógio fixo
- **calendario:** lê a data civil de São Paulo num instante
- **proventos:** registra a quantidade de cada provento
- **projecao:** projeta a renda dos próximos doze meses
- **projecao:** calcula o dividend yield da carteira
- **aplicacao:** projeta a renda a partir do relógio
- **carteira:** lista os ativos em carteira
- **alocacao:** define alocação-alvo com bandas de tolerância
- **alocacao:** emite alerta de desenquadramento por classe
- **rebalanceamento:** sugere aportes para reenquadrar a carteira
- **rebalanceamento:** limita vendas de ações à faixa isenta
- **rebalanceamento:** sugere quantidades inteiras
- **persistencia:** adiciona repositório em memória
- **persistencia:** adiciona repositório SQLite
- **persistencia:** adiciona suporte opcional a Postgres
- **importacao:** adiciona importador de operações em CSV
- **api:** expõe casos de uso em API HTTP com Fastify
- **cli:** adiciona CLI lastro com importar e relatorio

### Correções

- **eventos:** trata frações de ação nos eventos
- **rebalanceamento:** leva adiante a sobra das compras inteiras

### Refatorações

- **operacao:** substitui primitivos por objetos de valor
- **dominio:** troca exceções por Result em Ticker e Quantidade
- **preco-medio:** extrai o custo de aquisição da compra
- **carteira:** introduz coleção de primeira classe Posicoes
- **carteira:** troca getters por consultas de domínio
- **carteira:** extrai a ordem cronológica e a venda de registrar
- **eventos:** substitui else por cláusulas de guarda
- **carteira:** reduz registrar a um nível de indentação
- **eventos:** aplica polimorfismo por tipo de evento
- **eventos:** aplica um ponto por linha com a proporção
- **carteira:** extrai a ordem cronológica
- **operacao:** move o custo de aquisição para a compra
- **arredondamento:** remove a condição redundante
- **apuracao:** substitui switch por categorias compostas
- **apuracao:** resolve alíquotas pelo regime do mês
- **apuracao:** apura o mês a partir do estado anterior
- **arredondamento:** nomeia as políticas de arredondamento
- **mercado:** reúne cotações, valor de mercado e pontos-base
- **rebalanceamento:** decompõe regras em políticas
- **aplicacao:** extrai os demais casos de uso e a porta de repositório

### Documentação

- **exemplos:** adiciona o serviço anêmico da cena do capítulo 1
- adiciona README com aviso de material didático e licença MIT
- **exemplos:** adiciona as armadilhas do bigint do capítulo 2
- **exemplos:** adiciona as armadilhas de datas e do default do capítulo 3
- **exemplos:** adiciona os testes frágeis do capítulo 4
- **exemplos:** adiciona os vazamentos de encapsulamento do capítulo 5
- **exemplos:** adiciona os exemplos de refatoração do capítulo 6
- **exemplos:** adiciona os exemplos de propriedades do capítulo 7
- **exemplos:** adiciona os exemplos de mutação do capítulo 8
- **exemplos:** adiciona os exemplos de apuração do capítulo 9
- **exemplos:** adiciona os exemplos de vigência do capítulo 10
- **exemplos:** adiciona os exemplos de prejuízo e arredondamento
- **day-trade:** corrige a fonte do rateio no comentário
- **exemplos:** adiciona os exemplos do relógio
- **exemplos:** adiciona os exemplos do rebalanceamento
- **exemplos:** adiciona os exemplos da infraestrutura
- adiciona guia de uso e referência da API

### Testes

- **especificacao:** registra as doze regras como testes pendentes
- **operacao:** registra o erro de valorBrutoDaOperacao com centavos
- **operacao:** adiciona testes de tipos com expectTypeOf
- **preco-medio:** reescreve descrições como especificação
- **propriedades:** cria geradores de operações válidas
- **propriedades:** verifica que a posição nunca fica negativa
- **propriedades:** verifica conservação nos eventos
- **propriedades:** fixa os contraexemplos como casos obrigatórios
- **arredondamento:** elimina mutantes sobreviventes acima da metade
- **dominio:** elimina mutantes de fronteira em datas e proporções
- **eventos:** fixa o arredondamento do custo das ações inteiras
- **apuracao:** verifica o contrato e as propriedades das categorias
- **apuracao:** encurta nomes de testes para a largura das listagens
- **regime:** fixa datas antes e depois da Lei 15.270/2025
- **apuracao:** verifica casos de um ano e a conservação do prejuízo
- **projecao:** cobre viradas de mês e de ano
- **contrato:** cria suíte de contrato do repositório
- **api:** adiciona testes de integração da API

### Build

- **ts:** configura tsconfig strict com checagens adicionais
- **test:** configura Vitest com relatório de cobertura
- **lint:** configura ESLint estrito e Prettier com 72 colunas
- **lint:** proíbe identificadores abreviados
- **lint:** limita comentários a 72 colunas
- **lint:** limita tamanho de arquivos e funções
- **lint:** ativa max-depth 1 e no-else-return
- **test:** adiciona fast-check
- **mutacao:** adiciona e configura Stryker para o domínio
- **lint:** proíbe ler o relógio fora do adaptador
- **lint:** protege as fronteiras e limita a mutação ao núcleo
- **npm:** prepara pacote do domínio para publicação
- **docker:** adiciona imagem com API e banco de dados

### Integração contínua

- adiciona workflow com verificação de tipos, lint e testes
- **mutacao:** exige escore mínimo de 85% de mutação no domínio
- **release:** automatiza release e geração de changelog

### Manutenção

- inicia projeto Node com TypeScript e .gitignore

