"use client";
import { useState } from "react";

interface PerfilModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: { nome: string; genero: string; foto?: File | null }) => Promise<void>;
  nomeAtual: string;
  generoAtual: string;
  fotoAtual?: string;
}

const generos = [
  { value: "M", label: "Masculino" },
  { value: "F", label: "Feminino" },
  { value: "NB", label: "Não-binário" },
  { value: "PND", label: "Prefere não dizer" },
  { value: "NI", label: "Não informado" },
];

export default function PerfilModal({ isOpen, onClose, onSave, nomeAtual, generoAtual, fotoAtual }: PerfilModalProps) {
  const [nome, setNome] = useState(nomeAtual || "");
  const [genero, setGenero] = useState(generoAtual || "NI");
  const [foto, setFoto] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | undefined>(fotoAtual);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErro(null);
    if (!nome.trim()) {
      setErro("Nome é obrigatório");
      return;
    }
    setSalvando(true);
    try {
      await onSave({ nome, genero, foto });
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
        className="relative bg-[#FFFFF5] rounded-lg shadow-xl w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto p-8 flex flex-col gap-6"
        onSubmit={handleSubmit}
      >
        <h2 className="text-xl font-medium text-[#1C1607] mb-2">Editar Perfil</h2>
        {erro && <div className="text-red-600 text-sm mb-2">{erro}</div>}
        <div className="flex flex-col items-center gap-2">
          <label htmlFor="foto" className="cursor-pointer">
            <img
              src={preview || "/usuario.png"}
              alt="Foto de perfil"
              className="w-24 h-24 rounded-full object-cover border border-gray-300"
            />
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
        <div>
          <label className="block text-sm font-medium mb-1">Nome</label>
          <input
            type="text"
            value={nome}
            onChange={e => setNome(e.target.value)}
            className="w-full border border-[#D9D9D9] rounded-lg px-4 py-2 text-[#1C1607] bg-white focus:outline-none focus:ring-2 focus:ring-[#FFD147] focus:border-transparent"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Gênero</label>
          <select
            value={genero}
            onChange={e => setGenero(e.target.value)}
            className="w-full border border-[#D9D9D9] rounded-lg px-4 py-2 text-[#1C1607] bg-white focus:outline-none focus:ring-2 focus:ring-[#FFD147] focus:border-transparent"
          >
            {generos.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>
        <div className="flex gap-2 justify-end mt-4">
          <button type="button" onClick={onClose} className="px-4 py-2 rounded bg-gray-200 text-[#1C1607]">Cancelar</button>
          <button type="submit" disabled={salvando} className="px-4 py-2 rounded bg-[#FFD147] text-[#1C1607] font-medium">
            {salvando ? "Salvando..." : "Salvar"}
          </button>
        </div>
      </form>
    </div>
  );
}
