// Serviço de API para cálculo de frete
import { elibrosApi } from './api';
import { 
  ResultadoFrete, 
  CalcularFreteGenericoRequest, 
  CalcularFreteLivroRequest, 
  CalcularFreteCarrinhoRequest 
} from '../types/frete';

class FreteApiService {
  /**
   * Calcula frete genérico por CEP e quantidade de livros
   * Não requer autenticação
   */
  async calcularFreteGenerico(dados: CalcularFreteGenericoRequest): Promise<ResultadoFrete> {
    return elibrosApi.makeRequest<ResultadoFrete>('/frete/calcular/', {
      method: 'POST',
      body: JSON.stringify(dados),
      skipAuth: true,
    });
  }

  /**
   * Calcula frete para um livro específico
   * Não requer autenticação
   */
  async calcularFreteLivro(livroId: number, dados: CalcularFreteLivroRequest): Promise<ResultadoFrete> {
    return elibrosApi.makeRequest<ResultadoFrete>(`/frete/livro/${livroId}/`, {
      method: 'POST',
      body: JSON.stringify(dados),
      skipAuth: true,
    });
  }

  /**
   * Calcula frete do carrinho do cliente autenticado
   * Requer autenticação
   */
  async calcularFreteCarrinho(dados: CalcularFreteCarrinhoRequest): Promise<ResultadoFrete> {
    return elibrosApi.makeRequest<ResultadoFrete>('/frete/carrinho/', {
      method: 'POST',
      body: JSON.stringify(dados),
    });
  }

  /**
   * Formata CEP para exibição (00000-000)
   */
  formatarCep(cep: string): string {
    const cepLimpo = cep.replace(/\D/g, '');
    if (cepLimpo.length === 8) {
      return `${cepLimpo.slice(0, 5)}-${cepLimpo.slice(5)}`;
    }
    return cep;
  }

  /**
   * Valida se o CEP é válido (8 dígitos)
   */
  validarCep(cep: string): boolean {
    const cepLimpo = cep.replace(/\D/g, '');
    return cepLimpo.length === 8;
  }

  /**
   * Limpa CEP deixando apenas números
   */
  limparCep(cep: string): string {
    return cep.replace(/\D/g, '');
  }
}

export const freteApi = new FreteApiService();
