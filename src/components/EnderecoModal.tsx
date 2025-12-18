"use client";

import { useState, useEffect } from 'react';
import { freteApi } from '../services/freteApiService';

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

interface EnderecoModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (endereco: EnderecoData) => Promise<void>;
  enderecoAtual?: EnderecoData | null;
  title?: string;
}

// Interface para resposta da API ViaCEP
interface ViaCepResponse {
  cep: string;
  logradouro: string;
  complemento: string;
  bairro: string;
  localidade: string;
  uf: string;
  erro?: boolean;
}

export default function EnderecoModal({ 
  isOpen, 
  onClose, 
  onSave, 
  enderecoAtual,
  title = "Cadastrar Endereço"
}: EnderecoModalProps) {
  const [endereco, setEndereco] = useState<EnderecoData>({
    cep: '',
    rua: '',
    numero: '',
    complemento: '',
    bairro: '',
    cidade: '',
    uf: '',
  });
  
  const [buscandoCep, setBuscandoCep] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [erroCep, setErroCep] = useState<string | null>(null);

  // Lista de estados brasileiros
  const estados = [
    'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA',
    'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN',
    'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'
  ];

  // Preencher com dados existentes se houver
  useEffect(() => {
    if (enderecoAtual) {
      setEndereco({
        id: enderecoAtual.id,
        cep: enderecoAtual.cep || '',
        rua: enderecoAtual.rua || '',
        numero: enderecoAtual.numero || '',
        complemento: enderecoAtual.complemento || '',
        bairro: enderecoAtual.bairro || '',
        cidade: enderecoAtual.cidade || '',
        uf: enderecoAtual.uf || '',
      });
    } else {
      // Resetar form
      setEndereco({
        cep: '',
        rua: '',
        numero: '',
        complemento: '',
        bairro: '',
        cidade: '',
        uf: '',
      });
    }
    setErro(null);
    setErroCep(null);
  }, [enderecoAtual, isOpen]);

  // Formata o CEP com máscara
  const handleCepChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/\D/g, '');
    if (value.length > 8) value = value.slice(0, 8);
    if (value.length > 5) {
      value = value.slice(0, 5) + '-' + value.slice(5);
    }
    setEndereco(prev => ({ ...prev, cep: value }));
    setErroCep(null);
  };

  // Buscar CEP na API ViaCEP
  const buscarCep = async () => {
    const cepLimpo = endereco.cep.replace(/\D/g, '');
    
    if (!freteApi.validarCep(cepLimpo)) {
      setErroCep('CEP inválido. Digite 8 dígitos.');
      return;
    }

    try {
      setBuscandoCep(true);
      setErroCep(null);

      const response = await fetch(`https://viacep.com.br/ws/${cepLimpo}/json/`);
      const data: ViaCepResponse = await response.json();

      if (data.erro) {
        setErroCep('CEP não encontrado');
        return;
      }

      setEndereco(prev => ({
        ...prev,
        rua: data.logradouro || prev.rua,
        bairro: data.bairro || prev.bairro,
        cidade: data.localidade || prev.cidade,
        uf: data.uf || prev.uf,
        complemento: data.complemento || prev.complemento,
      }));
    } catch (err) {
      console.error('Erro ao buscar CEP:', err);
      setErroCep('Erro ao buscar CEP. Tente novamente.');
    } finally {
      setBuscandoCep(false);
    }
  };

  // Buscar CEP ao digitar 8 dígitos
  useEffect(() => {
    const cepLimpo = endereco.cep.replace(/\D/g, '');
    if (cepLimpo.length === 8) {
      buscarCep();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [endereco.cep]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErro(null);

    // Validação
    if (!endereco.cep || endereco.cep.replace(/\D/g, '').length !== 8) {
      setErro('CEP é obrigatório');
      return;
    }
    if (!endereco.rua.trim()) {
      setErro('Rua é obrigatória');
      return;
    }
    if (!endereco.numero.trim()) {
      setErro('Número é obrigatório');
      return;
    }
    if (!endereco.bairro.trim()) {
      setErro('Bairro é obrigatório');
      return;
    }
    if (!endereco.cidade.trim()) {
      setErro('Cidade é obrigatória');
      return;
    }
    if (!endereco.uf) {
      setErro('Estado é obrigatório');
      return;
    }

    try {
      setSalvando(true);
      await onSave({
        ...endereco,
        cep: endereco.cep.replace(/\D/g, ''), // Enviar CEP sem máscara
      });
      onClose();
    } catch (err) {
      console.error('Erro ao salvar endereço:', err);
      setErro(err instanceof Error ? err.message : 'Erro ao salvar endereço');
    } finally {
      setSalvando(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Overlay */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative bg-[#FFFFF5] rounded-lg shadow-xl w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-[#D9D9D9]">
          <h2 className="text-xl font-medium text-[#1C1607] flex items-center gap-2">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="text-[#5391AB]">
              <path d="M12 2C8.13 2 5 5.13 5 9C5 14.25 12 22 12 22S19 14.25 19 9C19 5.13 15.87 2 12 2ZM12 11.5C10.62 11.5 9.5 10.38 9.5 9C9.5 7.62 10.62 6.5 12 6.5C13.38 6.5 14.5 7.62 14.5 9C14.5 10.38 13.38 11.5 12 11.5Z" fill="currentColor"/>
            </svg>
            {title}
          </h2>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            title="Fechar"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6L6 18M6 6l12 12"/>
            </svg>
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* CEP */}
          <div>
            <label htmlFor="cep" className="block text-sm font-medium text-[#3B362B] mb-1">
              CEP <span className="text-red-500">*</span>
            </label>
            <div className="flex gap-2">
              <input
                id="cep"
                type="text"
                value={endereco.cep}
                onChange={handleCepChange}
                placeholder="00000-000"
                maxLength={9}
                className="flex-1 border border-[#D9D9D9] rounded-lg px-4 py-3 text-[#1C1607] bg-white focus:outline-none focus:ring-2 focus:ring-[#FFD147] focus:border-transparent"
              />
              <button
                type="button"
                onClick={buscarCep}
                disabled={buscandoCep || endereco.cep.replace(/\D/g, '').length !== 8}
                className={`px-4 py-3 rounded-lg font-medium transition-colors ${
                  buscandoCep || endereco.cep.replace(/\D/g, '').length !== 8
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-[#3B362B] text-white hover:bg-[#2a241f]'
                }`}
              >
                {buscandoCep ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  'Buscar'
                )}
              </button>
            </div>
            {erroCep && (
              <p className="text-sm text-red-500 mt-1">{erroCep}</p>
            )}
            <p className="text-xs text-gray-500 mt-1">
              Digite o CEP para preencher automaticamente
            </p>
          </div>

          {/* Rua */}
          <div>
            <label htmlFor="rua" className="block text-sm font-medium text-[#3B362B] mb-1">
              Rua/Logradouro <span className="text-red-500">*</span>
            </label>
            <input
              id="rua"
              type="text"
              value={endereco.rua}
              onChange={(e) => setEndereco(prev => ({ ...prev, rua: e.target.value }))}
              placeholder="Ex: Rua das Flores"
              className="w-full border border-[#D9D9D9] rounded-lg px-4 py-3 text-[#1C1607] bg-white focus:outline-none focus:ring-2 focus:ring-[#FFD147] focus:border-transparent"
            />
          </div>

          {/* Número e Complemento */}
          <div className="flex gap-4">
            <div className="w-1/3">
              <label htmlFor="numero" className="block text-sm font-medium text-[#3B362B] mb-1">
                Número <span className="text-red-500">*</span>
              </label>
              <input
                id="numero"
                type="text"
                value={endereco.numero}
                onChange={(e) => setEndereco(prev => ({ ...prev, numero: e.target.value }))}
                placeholder="123"
                className="w-full border border-[#D9D9D9] rounded-lg px-4 py-3 text-[#1C1607] bg-white focus:outline-none focus:ring-2 focus:ring-[#FFD147] focus:border-transparent"
              />
            </div>
            <div className="flex-1">
              <label htmlFor="complemento" className="block text-sm font-medium text-[#3B362B] mb-1">
                Complemento
              </label>
              <input
                id="complemento"
                type="text"
                value={endereco.complemento}
                onChange={(e) => setEndereco(prev => ({ ...prev, complemento: e.target.value }))}
                placeholder="Apto, Bloco, etc."
                className="w-full border border-[#D9D9D9] rounded-lg px-4 py-3 text-[#1C1607] bg-white focus:outline-none focus:ring-2 focus:ring-[#FFD147] focus:border-transparent"
              />
            </div>
          </div>

          {/* Bairro */}
          <div>
            <label htmlFor="bairro" className="block text-sm font-medium text-[#3B362B] mb-1">
              Bairro <span className="text-red-500">*</span>
            </label>
            <input
              id="bairro"
              type="text"
              value={endereco.bairro}
              onChange={(e) => setEndereco(prev => ({ ...prev, bairro: e.target.value }))}
              placeholder="Ex: Centro"
              className="w-full border border-[#D9D9D9] rounded-lg px-4 py-3 text-[#1C1607] bg-white focus:outline-none focus:ring-2 focus:ring-[#FFD147] focus:border-transparent"
            />
          </div>

          {/* Cidade e Estado */}
          <div className="flex gap-4">
            <div className="flex-1">
              <label htmlFor="cidade" className="block text-sm font-medium text-[#3B362B] mb-1">
                Cidade <span className="text-red-500">*</span>
              </label>
              <input
                id="cidade"
                type="text"
                value={endereco.cidade}
                onChange={(e) => setEndereco(prev => ({ ...prev, cidade: e.target.value }))}
                placeholder="Ex: São Paulo"
                className="w-full border border-[#D9D9D9] rounded-lg px-4 py-3 text-[#1C1607] bg-white focus:outline-none focus:ring-2 focus:ring-[#FFD147] focus:border-transparent"
              />
            </div>
            <div className="w-1/4">
              <label htmlFor="uf" className="block text-sm font-medium text-[#3B362B] mb-1">
                Estado <span className="text-red-500">*</span>
              </label>
              <select
                id="uf"
                value={endereco.uf}
                onChange={(e) => setEndereco(prev => ({ ...prev, uf: e.target.value }))}
                className="w-full border border-[#D9D9D9] rounded-lg px-4 py-3 text-[#1C1607] bg-white focus:outline-none focus:ring-2 focus:ring-[#FFD147] focus:border-transparent"
              >
                <option value="">UF</option>
                {estados.map(uf => (
                  <option key={uf} value={uf}>{uf}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Erro geral */}
          {erro && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-600">{erro}</p>
            </div>
          )}

          {/* Botões */}
          <div className="flex gap-4 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-3 border-2 border-[#D9D9D9] text-[#3B362B] rounded-lg font-medium hover:bg-gray-100 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={salvando}
              className={`flex-1 px-6 py-3 rounded-lg font-medium transition-colors flex items-center justify-center gap-2 ${
                salvando
                  ? 'bg-gray-400 text-gray-200 cursor-not-allowed'
                  : 'bg-[#FFD147] text-[#1C1607] hover:bg-[#fac423]'
              }`}
            >
              {salvando ? (
                <>
                  <div className="w-5 h-5 border-2 border-[#1C1607] border-t-transparent rounded-full animate-spin" />
                  Salvando...
                </>
              ) : (
                'Salvar Endereço'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
