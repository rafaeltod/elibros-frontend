"use client";

import { useState, useEffect } from 'react';
import { Header, Footer, ProtectedRoute, LoadingSpinner } from '@/components';
import { pedidoApi } from '@/services';
import { Pedido } from '@/services/pedidoApiService';
import Image from 'next/image';
import Link from 'next/link';

export default function PedidosPage() {
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [abaAtiva, setAbaAtiva] = useState<'andamento' | 'finalizados'>('andamento');
  const [modalConfirmacao, setModalConfirmacao] = useState<number | null>(null);
  const [detalhesVisiveis, setDetalhesVisiveis] = useState<Record<number, boolean>>({});

  useEffect(() => {
    carregarPedidos();
  }, []);

  const carregarPedidos = async () => {
    try {
      setCarregando(true);
      setErro(null);
      const response = await pedidoApi.list({
        ordering: '-data_pedido'
      });
      setPedidos(response.results);
    } catch (err) {
      console.error('Erro ao carregar pedidos:', err);
      setErro('Erro ao carregar pedidos. Tente novamente.');
    } finally {
      setCarregando(false);
    }
  };

  const pedidosEmAndamento = pedidos.filter(p => 
    ['PRO', 'CON', 'ENV', 'pendente', 'confirmado', 'enviado'].includes(p.status)
  );

  const pedidosFinalizados = pedidos.filter(p => 
    ['ENT', 'CAN', 'entregue', 'cancelado'].includes(p.status)
  );

  const pedidosExibidos = abaAtiva === 'andamento' ? pedidosEmAndamento : pedidosFinalizados;

  const formatarData = (data: string) => {
    return new Date(data).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const formatarValor = (valor: number) => {
    return valor.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    });
  };

  const confirmarRecebimento = async (pedidoId: number) => {
    try {
      await pedidoApi.update(pedidoId, { status: 'ENT' });
      setModalConfirmacao(null);
      carregarPedidos();
    } catch (err) {
      console.error('Erro ao confirmar recebimento:', err);
      alert('Erro ao confirmar recebimento. Tente novamente.');
    }
  };

  const toggleDetalhes = (pedidoId: number) => {
    setDetalhesVisiveis(prev => ({
      ...prev,
      [pedidoId]: !prev[pedidoId]
    }));
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-[#FFFFF5] font-['Poppins'] text-[#1C1607] flex flex-col">
        <Header />
        
        <main className="flex-1 mx-16 my-8">
          <h1 className="text-3xl font-normal mb-6 text-[#3B362B]">Meus pedidos</h1>

          {/* Abas */}
          <div className="flex gap-8 border-b border-[#3B362B]/20 mb-8">
            <button
              onClick={() => setAbaAtiva('andamento')}
              className={`pb-2 px-1 font-light ${
                abaAtiva === 'andamento'
                  ? 'border-b-2 border-[#3B362B] text-[#3B362B]'
                  : 'text-[#3B362B]/60'
              }`}
            >
              Em andamento
            </button>
            <button
              onClick={() => setAbaAtiva('finalizados')}
              className={`pb-2 px-1 font-light ${
                abaAtiva === 'finalizados'
                  ? 'border-b-2 border-[#3B362B] text-[#3B362B]'
                  : 'text-[#3B362B]/60'
              }`}
            >
              Finalizados
            </button>
          </div>

          {/* Lista de Pedidos */}
          {carregando ? (
            <div className="flex justify-center items-center py-20">
              <LoadingSpinner />
            </div>
          ) : erro ? (
            <div className="bg-red-50 border border-red-200 text-red-800 px-6 py-4 rounded-sm">
              {erro}
            </div>
          ) : pedidosExibidos.length === 0 ? (
            <div className="bg-[#EBEBE1] px-6 py-12 rounded-sm text-center">
              <p className="text-[#3B362B] text-lg mb-4">
                Nenhum pedido {abaAtiva === 'andamento' ? 'em andamento' : 'finalizado'}.
              </p>
              <Link
                href="/acervo"
                className="inline-block bg-[#FFCD35] text-[#3B362B] px-6 py-2 rounded-sm hover:bg-[#E5BC3F] transition-colors font-light"
              >
                Ir para Acervo
              </Link>
            </div>
          ) : (
            <div className="space-y-6">
              {pedidosExibidos.map((pedido) => (
                <div
                  key={pedido.id}
                  className="bg-white border border-[#D9D9D9] rounded-sm p-6"
                >
                  <div className="flex gap-6">
                    {/* Imagens dos livros */}
                    <div className="flex gap-3">
                      {pedido.itens?.slice(0, 2).map((item) => (
                        <div key={item.id} className="w-20 h-28 flex-shrink-0 bg-gray-200 rounded">
                          {item.livro.imagem_capa ? (
                            <Image
                              src={item.livro.imagem_capa}
                              alt={item.livro.titulo}
                              width={80}
                              height={112}
                              className="w-full h-full object-cover rounded"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-gray-400">
                              <span className="text-4xl">📚</span>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>

                    {/* Informações do pedido */}
                    <div className="flex-1">
                      <h3 className="font-medium text-[#3B362B] mb-1">
                        PEDIDO Nº{pedido.numero_pedido}
                      </h3>
                      <p className="text-2xl font-semibold text-[#3B362B] mb-2">
                        R$ {formatarValor(pedido.valor_total).replace('R$', '').trim()}
                      </p>
                      <button
                        onClick={() => toggleDetalhes(pedido.id)}
                        className="text-[#3B362B] underline text-sm font-light"
                      >
                        {detalhesVisiveis[pedido.id] ? 'Ocultar detalhes' : 'Ver detalhes do pedido'}
                      </button>

                      {detalhesVisiveis[pedido.id] && (
                        <div className="mt-4 pt-4 border-t border-gray-200">
                          <div className="space-y-2">
                            {pedido.itens?.map((item) => (
                              <div key={item.id} className="text-sm text-[#3B362B]/70">
                                <p>{item.livro.titulo} - {item.quantidade}x {formatarValor(item.preco_unitario)}</p>
                              </div>
                            ))}
                            {pedido.valor_frete > 0 && (
                              <p className="text-sm text-[#3B362B]/70">
                                Frete: {formatarValor(pedido.valor_frete)}
                              </p>
                            )}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Informações de entrega e ações */}
                    <div className="text-right flex flex-col justify-between min-w-[300px]">
                      {abaAtiva === 'andamento' ? (
                        <>
                          <div>
                            <p className="text-sm font-semibold text-[#3B362B] mb-1">
                              Entrega estimada para sexta-feira
                            </p>
                            <p className="text-xs text-[#3B362B]/60">
                              Até o final do dia de 20/12/2024
                            </p>
                          </div>
                          <div className="space-y-2 mt-4">
                            <button className="w-full bg-[#FFCD35] text-[#3B362B] py-2 px-4 rounded-sm font-light hover:bg-[#E5BC3F] transition-colors">
                              Rastrear pedido
                            </button>
                            <button className="w-full bg-white border border-[#3B362B]/20 text-[#3B362B] py-2 px-4 rounded-sm font-light hover:bg-gray-50 transition-colors">
                              Cancelar pedido
                            </button>
                            <button 
                              onClick={() => setModalConfirmacao(pedido.id)}
                              className="w-full bg-[#D9D9D9] text-[#3B362B] py-2 px-4 rounded-sm font-light hover:bg-[#C9C9C9] transition-colors"
                            >
                              Confirmar recebimento
                            </button>
                          </div>
                        </>
                      ) : (
                        <>
                          <div>
                            <p className="text-sm font-semibold text-[#3B362B] mb-1">
                              {pedido.status === 'ENT' || pedido.status === 'entregue' 
                                ? `Entrega efetuada dia ${formatarData(pedido.data_pedido)}`
                                : 'Pedido cancelado'}
                            </p>
                            <p className="text-xs text-[#3B362B]/60">
                              Pedido {pedido.status === 'ENT' || pedido.status === 'entregue' ? 'finalizado' : 'cancelado'}
                            </p>
                          </div>
                          <p className="text-xs text-[#3B362B]/60 mt-4">
                            Pedido realizado dia {formatarData(pedido.data_pedido)}
                          </p>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </main>

        <Footer />

        {/* Modal de Confirmação */}
        {modalConfirmacao && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-8 max-w-md w-full mx-4">
              <h3 className="text-xl font-semibold text-[#3B362B] mb-4">
                Confirmar recebimento
              </h3>
              <p className="text-[#3B362B]/70 mb-6">
                Você confirma que recebeu este pedido?
              </p>
              <div className="flex gap-4">
                <button
                  onClick={() => setModalConfirmacao(null)}
                  className="flex-1 bg-white border border-[#FFCD35] text-[#3B362B] py-2 px-4 rounded-sm font-light hover:bg-gray-50 transition-colors"
                >
                  Não, cancelar
                </button>
                <button
                  onClick={() => confirmarRecebimento(modalConfirmacao)}
                  className="flex-1 bg-[#FFCD35] text-[#3B362B] py-2 px-4 rounded-sm font-light hover:bg-[#E5BC3F] transition-colors"
                >
                  Sim, foi entregue
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </ProtectedRoute>
  );
}
