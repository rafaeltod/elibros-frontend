"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Header, Footer, ProtectedRoute, LoadingSpinner } from '@/components';
import { useCart } from '@/contexts/CartContext';
import { useAuth } from '@/contexts/AuthContext';
import { freteApi, clienteApi, pedidoApi, cupomApi } from '@/services';
import { ResultadoFrete, OpcaoFrete } from '@/types/frete';
import { Cupom } from '@/types/cupom';
import { getImageProps } from '@/utils/imageUtils';

interface EnderecoData {
  id?: number;
  cep: string;
  rua: string;
  numero: string;
  complemento?: string;
  bairro: string;
  cidade: string;
  uf: string;
}

type MetodoPagamento = 'pix' | 'cartao_credito' | 'cartao_debito' | 'boleto';

export default function ConfirmarCompra() {
  const router = useRouter();
  const { user } = useAuth();
  const { items: cartItems, isLoading: loadingCart, clearCart } = useCart();

  // Estados de endereço
  const [tipoEndereco, setTipoEndereco] = useState<'meu' | 'outro'>('meu');
  const [enderecoCliente, setEnderecoCliente] = useState<EnderecoData | null>(null);
  const [outroEndereco, setOutroEndereco] = useState<EnderecoData>({
    cep: '', rua: '', numero: '', complemento: '', bairro: '', cidade: '', uf: ''
  });
  const [carregandoEndereco, setCarregandoEndereco] = useState(true);

  // Estados de frete
  const [resultadoFrete, setResultadoFrete] = useState<ResultadoFrete | null>(null);
  const [freteEscolhido, setFreteEscolhido] = useState<OpcaoFrete | null>(null);
  const [calculandoFrete, setCalculandoFrete] = useState(false);
  const [erroFrete, setErroFrete] = useState<string | null>(null);

  // Estados de pagamento
  const [metodoPagamento, setMetodoPagamento] = useState<MetodoPagamento | ''>('');
  const [showQR, setShowQR] = useState(false);
  const [dadosCartao, setDadosCartao] = useState({
    numero: '', nome: '', validade: '', cvv: ''
  });

  // Estados de cupom
  const [codigoCupom, setCodigoCupom] = useState('');
  const [cupomAplicado, setCupomAplicado] = useState<Cupom | null>(null);
  const [erroCupom, setErroCupom] = useState<string | null>(null);
  const [validandoCupom, setValidandoCupom] = useState(false);

  // Estados gerais
  const [finalizando, setFinalizando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  // Carregar endereço do cliente
  useEffect(() => {
    const carregarEndereco = async () => {
      try {
        setCarregandoEndereco(true);
        const perfil = await clienteApi.getPerfil();
        if (perfil.endereco) {
          setEnderecoCliente(perfil.endereco);
        }
      } catch (err) {
        console.error('Erro ao carregar endereço:', err);
      } finally {
        setCarregandoEndereco(false);
      }
    };
    carregarEndereco();
  }, []);

  // Calcular frete quando endereço mudar
  useEffect(() => {
    const cep = tipoEndereco === 'meu' 
      ? enderecoCliente?.cep 
      : outroEndereco.cep;
    
    if (cep && freteApi.validarCep(cep)) {
      calcularFrete(cep);
    }
  }, [tipoEndereco, enderecoCliente?.cep, outroEndereco.cep]);

  const calcularFrete = async (cep: string) => {
    try {
      setCalculandoFrete(true);
      setErroFrete(null);
      const resultado = await freteApi.calcularFreteCarrinho({ cep: freteApi.limparCep(cep) });
      setResultadoFrete(resultado);
      // Selecionar frete padrão automaticamente
      const fretePadrao = resultado.opcoes.find(o => o.tipo === 'padrao') || resultado.opcoes[0];
      if (fretePadrao) setFreteEscolhido(fretePadrao);
    } catch (err) {
      console.error('Erro ao calcular frete:', err);
      setErroFrete('Erro ao calcular frete. Verifique o CEP.');
    } finally {
      setCalculandoFrete(false);
    }
  };

  // Cálculos de preços
  const getSubtotal = () => {
    return cartItems.reduce((total, item) => {
      const preco = parseFloat(item.livro.preco.replace(',', '.'));
      return total + (preco * item.quantidade);
    }, 0);
  };

  const getValorFrete = () => {
    if (!freteEscolhido || freteEscolhido.gratis) return 0;
    return typeof freteEscolhido.preco === 'string' 
      ? parseFloat(freteEscolhido.preco) 
      : freteEscolhido.preco;
  };

  const getDesconto = () => {
    if (!cupomAplicado) return 0;
    const subtotal = getSubtotal();
    if (cupomAplicado.tipo_valor === '1') {
      // Porcentagem
      return subtotal * (cupomAplicado.valor / 100);
    }
    // Valor fixo
    return Math.min(cupomAplicado.valor, subtotal);
  };

  const getTotal = () => {
    return getSubtotal() + getValorFrete() - getDesconto();
  };

  const formatarPreco = (valor: number) => {
    return valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };

  // Aplicar cupom
  const handleAplicarCupom = async () => {
    if (!codigoCupom.trim()) return;
    
    setValidandoCupom(true);
    setErroCupom(null);
    
    try {
      const response = await cupomApi.list({ search: codigoCupom.trim().toUpperCase() });
      const cupom = response.results.find(c => 
        c.codigo.toUpperCase() === codigoCupom.trim().toUpperCase()
      );
      
      if (!cupom) {
        setErroCupom('Cupom não encontrado');
        return;
      }
      
      if (!cupomApi.isActive(cupom)) {
        setErroCupom('Cupom expirado ou inativo');
        return;
      }
      
      setCupomAplicado(cupom);
      setCodigoCupom('');
    } catch (err) {
      setErroCupom('Erro ao validar cupom');
    } finally {
      setValidandoCupom(false);
    }
  };

  // Finalizar pedido
  const handleFinalizarPedido = async () => {
    if (!metodoPagamento) {
      setErro('Selecione um método de pagamento');
      return;
    }

    const enderecoAtual = tipoEndereco === 'meu' ? enderecoCliente : outroEndereco;
    if (!enderecoAtual || !enderecoAtual.cep) {
      setErro('Informe um endereço de entrega');
      return;
    }

    if (!freteEscolhido) {
      setErro('Selecione uma opção de frete');
      return;
    }

    setFinalizando(true);
    setErro(null);

    try {
      // Mapear tipo de frete para o formato da API
      const tipoFreteApi = freteEscolhido.tipo === 'expresso' ? 'SEDEX' : 'PAC';
      const prazoEntrega = freteEscolhido.tipo === 'expresso' ? 3 : freteEscolhido.tipo === 'padrao' ? 7 : 10;

      // Obter endereço atual
      const enderecoAtual = tipoEndereco === 'meu' ? enderecoCliente : outroEndereco;
      
      // Montar dados do pedido usando o formato PedidoCreateRequest da API
      const pedidoData: Record<string, unknown> = {
        usar_carrinho: true,  // Usar carrinho existente do usuário
        tipo_frete: tipoFreteApi,
        valor_frete: (typeof freteEscolhido.preco === 'string' ? parseFloat(freteEscolhido.preco) : freteEscolhido.preco).toFixed(2),
        prazo_entrega: prazoEntrega
      };

      // Adicionar endereço - usar ID existente ou criar novo
      if (tipoEndereco === 'meu' && enderecoCliente?.id) {
        pedidoData.endereco_id = enderecoCliente.id;
      } else if (enderecoAtual) {
        // numero deve ser inteiro na API
        const numeroEndereco = parseInt(String(enderecoAtual.numero).replace(/\D/g, '')) || 0;
        pedidoData.endereco_novo = {
          cep: enderecoAtual.cep?.replace(/\D/g, '') || '',
          rua: enderecoAtual.rua || '',
          numero: numeroEndereco,
          complemento: enderecoAtual.complemento || null,
          bairro: enderecoAtual.bairro || '',
          cidade: enderecoAtual.cidade || '',
          uf: enderecoAtual.uf || ''
        };
      }

      // Adicionar código do cupom se houver
      if (cupomAplicado && cupomAplicado.codigo) {
        pedidoData.codigo_cupom = cupomAplicado.codigo;
      }

      console.log('📦 Enviando pedido:', pedidoData);

      // Criar pedido na API
      await pedidoApi.create(pedidoData as any);
      console.log('✅ Pedido criado com sucesso!');
      
      // Limpar carrinho e redirecionar
      await clearCart();
      alert('🎉 Pedido realizado com sucesso!\n\nVocê será redirecionado para acompanhar seus pedidos.');
      router.push('/pedidos');
      
    } catch (err) {
      console.error('Erro ao finalizar pedido:', err);
      setErro('Erro ao finalizar pedido. Tente novamente.');
    } finally {
      setFinalizando(false);
    }
  };

  // Formatação CEP
  const handleCepChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/\D/g, '');
    if (value.length > 8) value = value.slice(0, 8);
    if (value.length > 5) {
      value = value.slice(0, 5) + '-' + value.slice(5);
    }
    setOutroEndereco(prev => ({ ...prev, cep: value }));
  };

  if (loadingCart) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen bg-[#FFFFF5] font-['Poppins'] text-[#1C1607] flex flex-col">
          <Header />
          <main className="flex-1 flex justify-center items-center">
            <LoadingSpinner size="lg" />
          </main>
          <Footer />
        </div>
      </ProtectedRoute>
    );
  }

  if (cartItems.length === 0) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen bg-[#FFFFF5] font-['Poppins'] text-[#1C1607] flex flex-col">
          <Header />
          <main className="flex-1 flex flex-col justify-center items-center gap-4">
            <p className="text-xl text-gray-600">Seu carrinho está vazio</p>
            <button
              onClick={() => router.push('/acervo')}
              className="bg-[#FFD147] text-[#3B362B] px-6 py-3 rounded-lg hover:bg-[#E5BC3F] transition-colors"
            >
              Ir para o Acervo
            </button>
          </main>
          <Footer />
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-[#FFFFF5] font-['Poppins'] text-[#1C1607] flex flex-col">
        <Header />
        
        <main className="flex-1 max-w-5xl mx-auto w-full px-4 py-8">
          <h1 className="text-3xl font-medium text-[#3B362B] mb-8">Finalizar compra</h1>

          {erro && (
            <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg mb-6">
              {erro}
            </div>
          )}

          {/* Seção 1: Endereço de entrega */}
          <section className="bg-white rounded-lg border border-[#D9D9D9] p-6 mb-6">
            <div className="flex items-center gap-4 mb-6">
              <span className="w-8 h-8 bg-[#FFD147] rounded-full flex items-center justify-center text-lg font-medium">1</span>
              <h2 className="text-xl font-medium text-[#3B362B]">Endereço de entrega</h2>
            </div>

            <div className="flex gap-8">
              {/* Opções de endereço */}
              <div className="flex flex-col gap-4">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="radio"
                    name="tipoEndereco"
                    checked={tipoEndereco === 'meu'}
                    onChange={() => setTipoEndereco('meu')}
                    className="w-5 h-5 accent-[#FFD147]"
                  />
                  <span className="text-[#3B362B]">Meu endereço</span>
                </label>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="radio"
                    name="tipoEndereco"
                    checked={tipoEndereco === 'outro'}
                    onChange={() => setTipoEndereco('outro')}
                    className="w-5 h-5 accent-[#FFD147]"
                  />
                  <span className="text-[#3B362B]">Outro endereço</span>
                </label>
              </div>

              {/* Detalhes do endereço */}
              <div className="flex-1">
                {tipoEndereco === 'meu' ? (
                  carregandoEndereco ? (
                    <div className="flex items-center gap-2 text-gray-500">
                      <LoadingSpinner size="sm" />
                      <span>Carregando...</span>
                    </div>
                  ) : enderecoCliente ? (
                    <div className="bg-[#F5F5F0] p-4 rounded-lg">
                      <p className="text-[#3B362B]">
                        {enderecoCliente.rua}, {enderecoCliente.numero}
                        {enderecoCliente.complemento && ` - ${enderecoCliente.complemento}`}
                      </p>
                      <p className="text-[#3B362B]">
                        {enderecoCliente.bairro}, {enderecoCliente.cidade}/{enderecoCliente.uf}
                      </p>
                      <p className="text-[#3B362B]">CEP: {freteApi.formatarCep(enderecoCliente.cep)}</p>
                    </div>
                  ) : (
                    <p className="text-gray-500">
                      Você não tem um endereço cadastrado. 
                      <a href="/perfil" className="text-[#5391AB] hover:underline ml-1">Cadastre aqui</a>
                    </p>
                  )
                ) : (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm text-gray-600 mb-1">CEP</label>
                      <input
                        type="text"
                        value={outroEndereco.cep}
                        onChange={handleCepChange}
                        placeholder="00000-000"
                        maxLength={9}
                        className="w-full border border-[#D9D9D9] rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#FFD147]"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-gray-600 mb-1">Número</label>
                      <input
                        type="text"
                        value={outroEndereco.numero}
                        onChange={(e) => setOutroEndereco(prev => ({ ...prev, numero: e.target.value }))}
                        className="w-full border border-[#D9D9D9] rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#FFD147]"
                      />
                    </div>
                    <div className="col-span-2">
                      <label className="block text-sm text-gray-600 mb-1">Rua</label>
                      <input
                        type="text"
                        value={outroEndereco.rua}
                        onChange={(e) => setOutroEndereco(prev => ({ ...prev, rua: e.target.value }))}
                        className="w-full border border-[#D9D9D9] rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#FFD147]"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-gray-600 mb-1">Bairro</label>
                      <input
                        type="text"
                        value={outroEndereco.bairro}
                        onChange={(e) => setOutroEndereco(prev => ({ ...prev, bairro: e.target.value }))}
                        className="w-full border border-[#D9D9D9] rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#FFD147]"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-gray-600 mb-1">Complemento</label>
                      <input
                        type="text"
                        value={outroEndereco.complemento}
                        onChange={(e) => setOutroEndereco(prev => ({ ...prev, complemento: e.target.value }))}
                        className="w-full border border-[#D9D9D9] rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#FFD147]"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-gray-600 mb-1">Cidade</label>
                      <input
                        type="text"
                        value={outroEndereco.cidade}
                        onChange={(e) => setOutroEndereco(prev => ({ ...prev, cidade: e.target.value }))}
                        className="w-full border border-[#D9D9D9] rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#FFD147]"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-gray-600 mb-1">Estado</label>
                      <select
                        value={outroEndereco.uf}
                        onChange={(e) => setOutroEndereco(prev => ({ ...prev, uf: e.target.value }))}
                        className="w-full border border-[#D9D9D9] rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#FFD147]"
                      >
                        <option value="">Selecione</option>
                        <option value="AC">AC</option>
                        <option value="AL">AL</option>
                        <option value="AP">AP</option>
                        <option value="AM">AM</option>
                        <option value="BA">BA</option>
                        <option value="CE">CE</option>
                        <option value="DF">DF</option>
                        <option value="ES">ES</option>
                        <option value="GO">GO</option>
                        <option value="MA">MA</option>
                        <option value="MT">MT</option>
                        <option value="MS">MS</option>
                        <option value="MG">MG</option>
                        <option value="PA">PA</option>
                        <option value="PB">PB</option>
                        <option value="PR">PR</option>
                        <option value="PE">PE</option>
                        <option value="PI">PI</option>
                        <option value="RJ">RJ</option>
                        <option value="RN">RN</option>
                        <option value="RS">RS</option>
                        <option value="RO">RO</option>
                        <option value="RR">RR</option>
                        <option value="SC">SC</option>
                        <option value="SP">SP</option>
                        <option value="SE">SE</option>
                        <option value="TO">TO</option>
                      </select>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </section>

          {/* Seção 2: Método de pagamento */}
          <section className="bg-white rounded-lg border border-[#D9D9D9] p-6 mb-6">
            <div className="flex items-center gap-4 mb-6">
              <span className="w-8 h-8 bg-[#FFD147] rounded-full flex items-center justify-center text-lg font-medium">2</span>
              <h2 className="text-xl font-medium text-[#3B362B]">Método de pagamento</h2>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              {/* PIX */}
              <button
                type="button"
                onClick={() => { setMetodoPagamento('pix'); setShowQR(true); }}
                className={`p-4 border-2 rounded-lg flex flex-col items-center gap-2 transition-all ${
                  metodoPagamento === 'pix' 
                    ? 'border-[#FFD147] bg-[#FFF9E5]' 
                    : 'border-[#D9D9D9] hover:border-[#FFD147]'
                }`}
              >
                <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor" className="text-[#32BCAD]">
                  <path d="M17.61 4.39a6.87 6.87 0 0 0-4.86-2h-.5a6.87 6.87 0 0 0-4.86 2L2 9.78a.5.5 0 0 0 0 .71l4.39 4.39a6.87 6.87 0 0 0 4.86 2h.5a6.87 6.87 0 0 0 4.86-2L22 9.49a.5.5 0 0 0 0-.71l-4.39-4.39z"/>
                </svg>
                <span className="text-sm font-medium">PIX</span>
              </button>

              {/* Cartão de Crédito */}
              <button
                type="button"
                onClick={() => { setMetodoPagamento('cartao_credito'); setShowQR(false); }}
                className={`p-4 border-2 rounded-lg flex flex-col items-center gap-2 transition-all ${
                  metodoPagamento === 'cartao_credito' 
                    ? 'border-[#FFD147] bg-[#FFF9E5]' 
                    : 'border-[#D9D9D9] hover:border-[#FFD147]'
                }`}
              >
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-[#5391AB]">
                  <rect x="1" y="4" width="22" height="16" rx="2" ry="2"/>
                  <line x1="1" y1="10" x2="23" y2="10"/>
                </svg>
                <span className="text-sm font-medium">Crédito</span>
              </button>

              {/* Cartão de Débito */}
              <button
                type="button"
                onClick={() => { setMetodoPagamento('cartao_debito'); setShowQR(false); }}
                className={`p-4 border-2 rounded-lg flex flex-col items-center gap-2 transition-all ${
                  metodoPagamento === 'cartao_debito' 
                    ? 'border-[#FFD147] bg-[#FFF9E5]' 
                    : 'border-[#D9D9D9] hover:border-[#FFD147]'
                }`}
              >
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-[#7B68EE]">
                  <rect x="1" y="4" width="22" height="16" rx="2" ry="2"/>
                  <line x1="1" y1="10" x2="23" y2="10"/>
                </svg>
                <span className="text-sm font-medium">Débito</span>
              </button>

              {/* Boleto */}
              <button
                type="button"
                onClick={() => { setMetodoPagamento('boleto'); setShowQR(false); }}
                className={`p-4 border-2 rounded-lg flex flex-col items-center gap-2 transition-all ${
                  metodoPagamento === 'boleto' 
                    ? 'border-[#FFD147] bg-[#FFF9E5]' 
                    : 'border-[#D9D9D9] hover:border-[#FFD147]'
                }`}
              >
                <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor" className="text-[#3B362B]">
                  <path d="M2 4h2v16H2V4zm4 0h1v16H6V4zm3 0h2v16H9V4zm4 0h1v16h-1V4zm3 0h2v16h-2V4zm4 0h2v16h-2V4z"/>
                </svg>
                <span className="text-sm font-medium">Boleto</span>
              </button>
            </div>

            {/* QR Code PIX */}
            {metodoPagamento === 'pix' && showQR && (
              <div className="flex flex-col items-center py-6 bg-[#F5F5F0] rounded-lg">
                <h4 className="text-lg font-medium mb-4">QR Code para Pagamento PIX</h4>
                <img 
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=Pagamento%20Pix%20${formatarPreco(getTotal()).replace('R$', '').trim()}`}
                  alt="QR Code Pix" 
                  className="border border-[#D9D9D9] rounded-lg"
                  width={200}
                  height={200}
                />
                <p className="mt-4 text-gray-600 text-center">
                  Escaneie o QR Code com seu aplicativo de banco para realizar o pagamento.
                </p>
                <p className="mt-2 text-lg font-medium text-[#3B362B]">
                  Valor: {formatarPreco(getTotal())}
                </p>
              </div>
            )}

            {/* Formulário Cartão */}
            {(metodoPagamento === 'cartao_credito' || metodoPagamento === 'cartao_debito') && (
              <div className="grid grid-cols-2 gap-4 bg-[#F5F5F0] p-6 rounded-lg">
                <div className="col-span-2">
                  <label className="block text-sm text-gray-600 mb-1">Número do Cartão</label>
                  <input
                    type="text"
                    value={dadosCartao.numero}
                    onChange={(e) => setDadosCartao(prev => ({ ...prev, numero: e.target.value }))}
                    placeholder="0000 0000 0000 0000"
                    maxLength={19}
                    className="w-full border border-[#D9D9D9] rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#FFD147]"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm text-gray-600 mb-1">Nome no Cartão</label>
                  <input
                    type="text"
                    value={dadosCartao.nome}
                    onChange={(e) => setDadosCartao(prev => ({ ...prev, nome: e.target.value }))}
                    placeholder="Nome como está no cartão"
                    className="w-full border border-[#D9D9D9] rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#FFD147]"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Validade</label>
                  <input
                    type="text"
                    value={dadosCartao.validade}
                    onChange={(e) => setDadosCartao(prev => ({ ...prev, validade: e.target.value }))}
                    placeholder="MM/AA"
                    maxLength={5}
                    className="w-full border border-[#D9D9D9] rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#FFD147]"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-1">CVV</label>
                  <input
                    type="text"
                    value={dadosCartao.cvv}
                    onChange={(e) => setDadosCartao(prev => ({ ...prev, cvv: e.target.value }))}
                    placeholder="123"
                    maxLength={4}
                    className="w-full border border-[#D9D9D9] rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#FFD147]"
                  />
                </div>
              </div>
            )}

            {/* Boleto */}
            {metodoPagamento === 'boleto' && (
              <div className="bg-[#F5F5F0] p-6 rounded-lg text-center">
                <p className="text-gray-600">
                  O boleto será gerado após a confirmação do pedido.
                </p>
                <p className="text-sm text-gray-500 mt-2">
                  Prazo de vencimento: 3 dias úteis
                </p>
              </div>
            )}
          </section>

          {/* Seção 3: Cupom de desconto */}
          <section className="bg-white rounded-lg border border-[#D9D9D9] p-6 mb-6">
            <div className="flex items-center gap-4 mb-6">
              <span className="w-8 h-8 bg-[#FFD147] rounded-full flex items-center justify-center text-lg font-medium">3</span>
              <h2 className="text-xl font-medium text-[#3B362B]">Cupom de desconto</h2>
            </div>

            {cupomAplicado ? (
              <div className="flex items-center justify-between bg-green-50 border border-green-200 p-4 rounded-lg">
                <div>
                  <span className="text-green-700 font-medium">{cupomAplicado.codigo}</span>
                  <span className="text-green-600 ml-2">
                    ({cupomAplicado.tipo_valor === '1' ? `${cupomAplicado.valor}%` : formatarPreco(cupomAplicado.valor)} de desconto)
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setCupomAplicado(null)}
                  className="text-red-500 hover:text-red-700"
                >
                  Remover
                </button>
              </div>
            ) : (
              <div className="flex gap-4">
                <input
                  type="text"
                  value={codigoCupom}
                  onChange={(e) => setCodigoCupom(e.target.value.toUpperCase())}
                  placeholder="Digite o código do cupom"
                  className="flex-1 border border-[#D9D9D9] rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#FFD147]"
                />
                <button
                  type="button"
                  onClick={handleAplicarCupom}
                  disabled={validandoCupom || !codigoCupom.trim()}
                  className="px-6 py-2 bg-[#3B362B] text-white rounded-lg hover:bg-[#2a241f] disabled:bg-gray-400 transition-colors"
                >
                  {validandoCupom ? 'Validando...' : 'Aplicar'}
                </button>
              </div>
            )}
            {erroCupom && <p className="text-red-500 text-sm mt-2">{erroCupom}</p>}
          </section>

          {/* Seção 4: Itens e envio */}
          <section className="bg-white rounded-lg border border-[#D9D9D9] p-6 mb-6">
            <div className="flex items-center gap-4 mb-6">
              <span className="w-8 h-8 bg-[#FFD147] rounded-full flex items-center justify-center text-lg font-medium">4</span>
              <h2 className="text-xl font-medium text-[#3B362B]">Itens e envio</h2>
            </div>

            {/* Lista de itens */}
            <div className="space-y-4 mb-6">
              {cartItems.map((item) => (
                <div key={item.id} className="flex gap-4 p-4 bg-[#F5F5F0] rounded-lg">
                  <Image
                    {...getImageProps(item.livro.capa_url, item.livro.titulo)}
                    width={60}
                    height={90}
                    className="w-15 h-auto rounded"
                  />
                  <div className="flex-1">
                    <h4 className="font-medium text-[#3B362B]">{item.livro.titulo}</h4>
                    <p className="text-sm text-gray-600">
                      {Array.isArray(item.livro.autores) ? item.livro.autores.join(', ') : item.livro.autores}
                    </p>
                    <p className="text-sm text-gray-500">Qtd: {item.quantidade}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-[#3B362B]">
                      R$ {(parseFloat(item.livro.preco.replace(',', '.')) * item.quantidade).toFixed(2).replace('.', ',')}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* Opções de frete */}
            {calculandoFrete ? (
              <div className="flex items-center gap-2 text-gray-500">
                <LoadingSpinner size="sm" />
                <span>Calculando frete...</span>
              </div>
            ) : erroFrete ? (
              <p className="text-red-500">{erroFrete}</p>
            ) : resultadoFrete ? (
              <div className="border-t border-[#D9D9D9] pt-4">
                <h4 className="font-medium mb-3">Opções de entrega para {freteApi.formatarCep(resultadoFrete.cep_destino)}</h4>
                <div className="space-y-2">
                  {resultadoFrete.opcoes.map((opcao) => (
                    <label
                      key={opcao.tipo}
                      className={`flex items-center justify-between p-3 border-2 rounded-lg cursor-pointer transition-all ${
                        freteEscolhido?.tipo === opcao.tipo 
                          ? 'border-[#FFD147] bg-[#FFF9E5]' 
                          : 'border-[#D9D9D9] hover:border-[#FFD147]'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <input
                          type="radio"
                          name="frete"
                          checked={freteEscolhido?.tipo === opcao.tipo}
                          onChange={() => setFreteEscolhido(opcao)}
                          className="w-4 h-4 accent-[#FFD147]"
                        />
                        <div>
                          <p className="font-medium">{opcao.nome}</p>
                          <p className="text-sm text-gray-600">{opcao.prazo_texto}</p>
                        </div>
                      </div>
                      <span className="font-medium">
                        {opcao.gratis ? (
                          <span className="text-green-600">Grátis</span>
                        ) : (
                          formatarPreco(typeof opcao.preco === 'string' ? parseFloat(opcao.preco) : opcao.preco)
                        )}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            ) : (
              <p className="text-gray-500">Informe o CEP para calcular o frete</p>
            )}
          </section>

          {/* Resumo do pedido */}
          <section className="bg-white rounded-lg border border-[#D9D9D9] p-6 mb-6">
            <h3 className="text-xl font-medium text-[#3B362B] mb-4">Resumo do pedido</h3>
            
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Subtotal ({cartItems.reduce((t, i) => t + i.quantidade, 0)} itens)</span>
                <span className="font-medium">{formatarPreco(getSubtotal())}</span>
              </div>
              
              {cupomAplicado && (
                <div className="flex justify-between text-green-600">
                  <span>Desconto ({cupomAplicado.codigo})</span>
                  <span>-{formatarPreco(getDesconto())}</span>
                </div>
              )}
              
              <div className="flex justify-between">
                <span className="text-gray-600">Frete</span>
                <span className="font-medium">
                  {freteEscolhido ? (
                    getValorFrete() === 0 ? (
                      <span className="text-green-600">Grátis</span>
                    ) : (
                      formatarPreco(getValorFrete())
                    )
                  ) : (
                    '---'
                  )}
                </span>
              </div>
              
              <div className="flex justify-between pt-3 border-t border-[#D9D9D9]">
                <span className="text-xl font-medium text-[#3B362B]">Total</span>
                <span className="text-xl font-bold text-[#3B362B]">{formatarPreco(getTotal())}</span>
              </div>
            </div>
          </section>

          {/* Botão finalizar */}
          <div className="flex justify-end">
            <button
              type="button"
              onClick={handleFinalizarPedido}
              disabled={finalizando || !metodoPagamento || !freteEscolhido}
              className="px-8 py-4 bg-[#FFD147] text-[#3B362B] text-lg font-medium rounded-lg hover:bg-[#E5BC3F] disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
            >
              {finalizando ? (
                <>
                  <LoadingSpinner size="sm" color="#3B362B" />
                  Finalizando...
                </>
              ) : (
                'Finalizar pedido'
              )}
            </button>
          </div>
        </main>

        <Footer />
      </div>
    </ProtectedRoute>
  );
}
