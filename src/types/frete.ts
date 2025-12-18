// Tipos relacionados ao cálculo de frete

export interface OpcaoFrete {
  tipo: string;
  nome: string;
  preco: number | string;
  preco_formatado: string;
  prazo_dias: number;
  prazo_texto: string;
  gratis: boolean;
}

export interface ResultadoFrete {
  cep_destino: string;
  regiao: string;
  peso_total_kg: number;
  quantidade_livros: number;
  valor_total_livros?: number;
  opcoes: OpcaoFrete[];
}

export interface CalcularFreteGenericoRequest {
  cep: string;
  quantidade_livros: number;
  valor_total?: number;
}

export interface CalcularFreteLivroRequest {
  cep: string;
  quantidade?: number;
}

export interface CalcularFreteCarrinhoRequest {
  cep: string;
}
