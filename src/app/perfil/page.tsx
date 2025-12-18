"use client";

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { Header, Footer, ProtectedRoute, EnderecoModal, PerfilModal } from '@/components';
import { useAuth } from '@/contexts/AuthContext';
import { clienteApi } from '@/services';
import { freteApi } from '@/services/freteApiService';

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

export default function PerfilPage() {
  const { user, logout } = useAuth();
  
  // Estados para endereço
  const [endereco, setEndereco] = useState<EnderecoData | null>(null);
  const [carregandoEndereco, setCarregandoEndereco] = useState(true);
  const [modalEnderecoAberto, setModalEnderecoAberto] = useState(false);

  // Estados para perfil
  const [modalPerfilAberto, setModalPerfilAberto] = useState(false);
  const [fotoPerfil, setFotoPerfil] = useState<string | undefined>(user?.foto_de_perfil);
  const [dadosPerfil, setDadosPerfil] = useState({
    nome: user?.nome || '',
    email: user?.email || '',
    telefone: user?.telefone || '',
    cpf: user?.CPF || '',
    genero: user?.genero || 'NI',
    dataNascimento: user?.dt_nasc || ''
  });

  // Atualizar dados quando user mudar
  useEffect(() => {
    if (user) {
      setFotoPerfil(user.foto_de_perfil);
      setDadosPerfil({
        nome: user.nome || '',
        email: user.email || '',
        telefone: user.telefone || '',
        cpf: user.CPF || '',
        genero: user.genero || 'NI',
        dataNascimento: user.dt_nasc || ''
      });
    }
  }, [user]);

  // Carregar endereço do perfil
  useEffect(() => {
    const carregarEndereco = async () => {
      try {
        setCarregandoEndereco(true);
        const perfil = await clienteApi.getPerfil();
        if (perfil.endereco) {
          setEndereco(perfil.endereco);
        }
      } catch (err) {
        console.error('Erro ao carregar endereço:', err);
      } finally {
        setCarregandoEndereco(false);
      }
    };

    carregarEndereco();
  }, []);

  // Salvar endereço
  const handleSalvarEndereco = async (novoEndereco: EnderecoData) => {
    try {
      await clienteApi.updatePerfil({
        endereco: novoEndereco
      });
      setEndereco(novoEndereco);
    } catch (err) {
      console.error('Erro ao salvar endereço:', err);
      throw err;
    }
  };

  // Salvar perfil
  const handleSalvarPerfil = async ({ nome, genero, foto, email, telefone, cpf, dataNascimento }: { 
    nome: string; 
    genero: string; 
    foto?: File | null;
    email?: string;
    telefone?: string;
    cpf?: string;
    dataNascimento?: string;
  }) => {
    const formData = new FormData();
    formData.append('user.nome', nome);
    formData.append('user.genero', genero);
    if (email) formData.append('user.email', email);
    if (telefone) formData.append('user.telefone', telefone);
    if (cpf) formData.append('user.CPF', cpf);
    if (dataNascimento) formData.append('user.dt_nasc', dataNascimento);
    if (foto) formData.append('foto_de_perfil', foto);
    
    const updated = await clienteApi.updatePerfil(formData as any);
    setFotoPerfil(updated.foto_de_perfil ?? undefined);
    setDadosPerfil({
      nome: updated.nome || nome,
      email: updated.email || email || '',
      telefone: updated.telefone || telefone || '',
      cpf: updated.cpf || cpf || '',
      genero: updated.genero || genero,
      dataNascimento: updated.data_nascimento || dataNascimento || ''
    });
  };

  const handleLogout = async () => {
    try {
      await logout();
      window.location.href = '/';
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'Não informado';
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-[#FFFFF5] font-['Poppins'] text-[#1C1607] flex flex-col">
        <Header />
        
        <main>
          <form className="bg-[#EBEBE1] mx-16 my-16 px-16 py-16 rounded-sm flex flex-col gap-16">
            {/* Primeira seção */}
            <div className="flex gap-16">
              <figure className="w-[18%] m-0 flex flex-col items-center gap-2">
                <Image 
                  src={fotoPerfil || user?.foto_de_perfil || "/usuario.png"} 
                  alt="Profile Picture"
                  width={200}
                  height={200}
                  className="w-full aspect-square rounded-full object-cover"
                />
              </figure>

              <div className="flex flex-col gap-5 flex-1">
                <div className="flex flex-col">
                  <label htmlFor="username" className="font-light mb-1 text-black/50 text-lg w-full">Nome de Usuário</label>
                  <input 
                    id="username" 
                    type="text" 
                    value={user?.username || ''} 
                    disabled
                    className="bg-[#EBEBE1] outline-1 outline-[#EBEBE1] border border-[#EBEBE1] text-[#3B362B] text-lg font-light p-2"
                  />
                </div>
                <div className="flex flex-col">
                  <label htmlFor="email" className="font-light mb-1 text-black/50 text-lg w-full">E-mail</label>
                  <input 
                    id="email" 
                    type="email" 
                    value={user?.email || ''} 
                    disabled
                    className="bg-[#EBEBE1] outline-1 outline-[#EBEBE1] border border-[#EBEBE1] text-[#3B362B] text-lg font-light p-2"
                  />
                </div>
                <div className="flex flex-col">
                  <label htmlFor="fone" className="font-light mb-1 text-black/50 text-lg w-full">Telefone</label>
                  <input 
                    id="fone" 
                    type="tel" 
                    value={user?.telefone || ''} 
                    disabled
                    className="bg-[#EBEBE1] outline-1 outline-[#EBEBE1] border border-[#EBEBE1] text-[#3B362B] text-lg font-light p-2"
                  />
                </div>
              </div>

              <div className="flex flex-col w-[25%]">
                <label htmlFor="genero" className="font-light mb-1 text-black/50 text-lg">Identidade de gênero</label>
                <select 
                  id="genero" 
                  disabled
                  className="bg-[#EBEBE1] outline-1 outline-[#EBEBE1] border border-[#EBEBE1] text-[#3B362B] text-lg font-light p-2"
                >
                  <option>{user?.genero || 'Colocar Gênero'}</option>
                </select>
              </div>

              <div className="flex flex-col justify-between w-[25%] gap-4">
                <a 
                  id="visualizar-pedidos" 
                  href="/pedidos"
                  className="w-full bg-[#D9D9D9] text-center py-2 rounded-sm text-[#3B362B] text-lg font-light no-underline"
                >
                  Visualizar pedidos
                </a>
                <button
                  type="button"
                  id="editar-perfil"
                  className="w-full bg-[#D9D9D9] text-center py-2 rounded-sm text-[#3B362B] text-lg font-light no-underline"
                  onClick={() => setModalPerfilAberto(true)}
                >
                  Editar perfil de usuário
                </button>
              </div>
            </div>

            {/* Segunda seção */}
            <div className="flex gap-16">
              <div className="w-[25%] flex flex-col justify-between">
                <div className="flex flex-col">
                  <h3 className="text-[#3B362B] mb-5 font-normal">Senha e autenticação</h3>
                  <a 
                    id="alterar-senha" 
                    href="/alterar-senha"
                    className="inline-block w-fit px-7 py-3 bg-[#FFD147] text-center text-[#3B362B] text-lg font-light no-underline whitespace-nowrap"
                  >
                    Alterar senha
                  </a>
                </div>
                <hr className="border-gray-400 my-4" />
                <div>
                  <button
                    onClick={handleLogout}
                    className="px-6 py-3 border border-[#FF4E4E] text-[#3B362B] text-lg font-light bg-transparent hover:bg-red-50 transition-colors whitespace-nowrap"
                    id="excluir-conta"
                  >
                    Excluir conta
                  </button>
                </div>
              </div>

              <div className="w-px bg-[#6C6C6C80]"></div>

              <div className="flex flex-col flex-1">
                <h3 className="text-[#3B362B] mb-5 font-normal">Outras informações</h3>
                <div className="flex flex-col mb-4">
                  <h4 className="font-light mb-1 text-black/50 text-lg">Data de nascimento</h4>
                  <p className="text-[#3B362B] text-lg font-light">{formatDate(user?.dt_nasc || '')}</p>
                </div>
                <div className="flex flex-col mb-4">
                  <h4 className="font-light mb-1 text-black/50 text-lg">Endereço</h4>
                  {carregandoEndereco ? (
                    <p className="text-[#3B362B] text-lg font-light">Carregando...</p>
                  ) : endereco ? (
                    <div className="flex items-center gap-3">
                      <p className="text-[#3B362B] text-lg font-light">
                        {endereco.rua}, {endereco.numero}
                        {endereco.complemento && ` - ${endereco.complemento}`}, {endereco.bairro}, {endereco.cidade}/{endereco.uf} - CEP: {freteApi.formatarCep(endereco.cep)}
                      </p>
                      <button 
                        type="button"
                        onClick={() => setModalEnderecoAberto(true)}
                        className="text-[#5391AB] hover:underline text-sm"
                      >
                        Editar
                      </button>
                    </div>
                  ) : (
                    <button 
                      type="button"
                      onClick={() => setModalEnderecoAberto(true)}
                      className="text-[#5391AB] hover:underline text-lg font-light text-left"
                    >
                      Cadastrar endereço
                    </button>
                  )}
                </div>
                <div className="flex flex-col">
                  <h4 className="font-light mb-1 text-black/50 text-lg">CPF</h4>
                  <p className="text-[#3B362B] text-lg font-light">{user?.CPF || 'Não informado'}</p>
                </div>
              </div>
            </div>
          </form>
        </main>

        <Footer />

        {/* Modal de Endereço */}
        <EnderecoModal
          isOpen={modalEnderecoAberto}
          onClose={() => setModalEnderecoAberto(false)}
          onSave={handleSalvarEndereco}
          enderecoAtual={endereco}
          title={endereco ? "Editar Endereço" : "Cadastrar Endereço"}
        />

        {/* Modal de Perfil */}
        <PerfilModal
          isOpen={modalPerfilAberto}
          onClose={() => setModalPerfilAberto(false)}
          onSave={handleSalvarPerfil}
          nomeAtual={dadosPerfil.nome}
          generoAtual={dadosPerfil.genero}
          fotoAtual={fotoPerfil || user?.foto_de_perfil || ''}
          emailAtual={dadosPerfil.email}
          telefoneAtual={dadosPerfil.telefone}
          cpfAtual={dadosPerfil.cpf}
          dataNascimentoAtual={dadosPerfil.dataNascimento}
        />
      </div>
    </ProtectedRoute>
  );
}
