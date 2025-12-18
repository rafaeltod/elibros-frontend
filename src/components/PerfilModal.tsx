"use client";
import { useState, useEffect } from "react";

interface PerfilModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: PerfilFormData) => Promise<void>;
  nomeAtual: string;
  generoAtual: string;
  fotoAtual?: string;
  emailAtual?: string;
  telefoneAtual?: string;
  cpfAtual?: string;
  dataNascimentoAtual?: string;
}

interface PerfilFormData {
  nome: string;
  genero: string;
  foto?: File | null;
  email?: string;
  telefone?: string;
  cpf?: string;
  dataNascimento?: string;
}

const generos = [
  { value: "M", label: "Masculino" },
  { value: "F", label: "Feminino" },
  { value: "NB", label: "Não-binário" },
  { value: "PND", label: "Prefere não dizer" },
  { value: "NI", label: "Não informado" },
];

export default function PerfilModal({ 
  isOpen, 
  onClose, 
  onSave, 
  nomeAtual, 
  generoAtual, 
  fotoAtual,
  emailAtual,
  telefoneAtual,
  cpfAtual,
  dataNascimentoAtual
}: PerfilModalProps) {
  const [nome, setNome] = useState(nomeAtual || "");
  const [genero, setGenero] = useState(generoAtual || "NI");
  const [foto, setFoto] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | undefined>(fotoAtual);
  const [email, setEmail] = useState(emailAtual || "");
  const [telefone, setTelefone] = useState(telefoneAtual || "");
  const [cpf, setCpf] = useState(cpfAtual || "");
  const [dataNascimento, setDataNascimento] = useState(dataNascimentoAtual || "");
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  // Atualizar estados quando props mudarem
  useEffect(() => {
    setNome(nomeAtual || "");
    setGenero(generoAtual || "NI");
    setPreview(fotoAtual);
    setEmail(emailAtual || "");
    setTelefone(telefoneAtual || "");
    setCpf(cpfAtual || "");
    setDataNascimento(dataNascimentoAtual || "");
  }, [nomeAtual, generoAtual, fotoAtual, emailAtual, telefoneAtual, cpfAtual, dataNascimentoAtual]);

  if (!isOpen) return null;

  const handleFotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setFoto(file);
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => setPreview(ev.target?.result as string);
      reader.readAsDataURL(file);
    } else {
      setPreview(fotoAtual);
    }
  };

  // Formatação de telefone
  const handleTelefoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/\D/g, '');
    if (value.length > 11) value = value.slice(0, 11);
    
    if (value.length > 2) {
      value = `(${value.slice(0, 2)}) ${value.slice(2)}`;
    }
    if (value.length > 10) {
      value = value.slice(0, 10) + '-' + value.slice(10);
    }
    setTelefone(value);
  };

  // Formatação de CPF
  const handleCpfChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/\D/g, '');
    if (value.length > 11) value = value.slice(0, 11);
    
    if (value.length > 3) {
      value = value.slice(0, 3) + '.' + value.slice(3);
    }
    if (value.length > 7) {
      value = value.slice(0, 7) + '.' + value.slice(7);
    }
    if (value.length > 11) {
      value = value.slice(0, 11) + '-' + value.slice(11);
    }
    setCpf(value);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErro(null);
    
    if (!nome.trim()) {
      setErro("Nome é obrigatório");
      return;
    }
    
    setSalvando(true);
    try {
      await onSave({ 
        nome, 
        genero, 
        foto,
        email,
        telefone: telefone.replace(/\D/g, ''),
        cpf: cpf.replace(/\D/g, ''),
        dataNascimento
      });
      onClose();
    } catch (err) {
      setErro("Erro ao salvar perfil");
    } finally {
      setSalvando(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <form
        className="relative bg-[#FFFFF5] rounded-lg shadow-xl w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto p-8 flex flex-col gap-5"
        onSubmit={handleSubmit}
      >
        <h2 className="text-2xl font-medium text-[#3B362B] mb-2">Editar Perfil</h2>
        
        {erro && (
          <div className="bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-2 rounded-lg">
            {erro}
          </div>
        )}
        
        {/* Foto de perfil */}
        <div className="flex flex-col items-center gap-2">
          <label htmlFor="foto" className="cursor-pointer group">
            <div className="relative">
              <img
                src={preview || "/usuario.png"}
                alt="Foto de perfil"
                className="w-24 h-24 rounded-full object-cover border-2 border-[#D9D9D9] group-hover:border-[#FFD147] transition-colors"
              />
              <div className="absolute inset-0 rounded-full bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                  <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
                  <circle cx="12" cy="13" r="4"/>
                </svg>
              </div>
            </div>
            <input
              id="foto"
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFotoChange}
            />
          </label>
          <span className="text-xs text-gray-500">Clique na foto para alterar</span>
        </div>

        {/* Nome */}
        <div>
          <label className="block text-sm font-medium text-[#3B362B] mb-1">
            Nome completo <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={nome}
            onChange={e => setNome(e.target.value)}
            className="w-full border border-[#D9D9D9] rounded-lg px-4 py-2.5 text-[#1C1607] bg-white focus:outline-none focus:ring-2 focus:ring-[#FFD147] focus:border-transparent"
            placeholder="Seu nome completo"
          />
        </div>

        {/* Email */}
        <div>
          <label className="block text-sm font-medium text-[#3B362B] mb-1">E-mail</label>
          <input
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            className="w-full border border-[#D9D9D9] rounded-lg px-4 py-2.5 text-[#1C1607] bg-white focus:outline-none focus:ring-2 focus:ring-[#FFD147] focus:border-transparent"
            placeholder="seu@email.com"
          />
        </div>

        {/* Telefone e CPF */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-[#3B362B] mb-1">Telefone</label>
            <input
              type="text"
              value={telefone}
              onChange={handleTelefoneChange}
              className="w-full border border-[#D9D9D9] rounded-lg px-4 py-2.5 text-[#1C1607] bg-white focus:outline-none focus:ring-2 focus:ring-[#FFD147] focus:border-transparent"
              placeholder="(00) 00000-0000"
              maxLength={15}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[#3B362B] mb-1">CPF</label>
            <input
              type="text"
              value={cpf}
              onChange={handleCpfChange}
              className="w-full border border-[#D9D9D9] rounded-lg px-4 py-2.5 text-[#1C1607] bg-white focus:outline-none focus:ring-2 focus:ring-[#FFD147] focus:border-transparent"
              placeholder="000.000.000-00"
              maxLength={14}
            />
          </div>
        </div>

        {/* Data de nascimento e Gênero */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-[#3B362B] mb-1">Data de nascimento</label>
            <input
              type="date"
              value={dataNascimento}
              onChange={e => setDataNascimento(e.target.value)}
              className="w-full border border-[#D9D9D9] rounded-lg px-4 py-2.5 text-[#1C1607] bg-white focus:outline-none focus:ring-2 focus:ring-[#FFD147] focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[#3B362B] mb-1">Gênero</label>
            <select
              value={genero}
              onChange={e => setGenero(e.target.value)}
              className="w-full border border-[#D9D9D9] rounded-lg px-4 py-2.5 text-[#1C1607] bg-white focus:outline-none focus:ring-2 focus:ring-[#FFD147] focus:border-transparent"
            >
              {generos.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Botões */}
        <div className="flex gap-3 justify-end mt-4 pt-4 border-t border-[#D9D9D9]">
          <button 
            type="button" 
            onClick={onClose} 
            className="px-5 py-2.5 rounded-lg bg-[#EBEBE1] text-[#3B362B] hover:bg-[#D9D9D9] transition-colors"
          >
            Cancelar
          </button>
          <button 
            type="submit" 
            disabled={salvando} 
            className="px-5 py-2.5 rounded-lg bg-[#FFD147] text-[#3B362B] font-medium hover:bg-[#E5BC3F] disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
          >
            {salvando ? (
              <>
                <div className="w-4 h-4 border-2 border-[#3B362B] border-t-transparent rounded-full animate-spin"></div>
                Salvando...
              </>
            ) : (
              'Salvar alterações'
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
