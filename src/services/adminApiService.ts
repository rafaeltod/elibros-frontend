// Serviço para operações administrativas
import { elibrosApi } from './api';
import { authApi } from './authApiService';

export interface AdminStats {
  total_livros: number;
  total_clientes: number;
  total_pedidos: number;
  total_generos: number;
  total_categorias: number;
  total_administradores: number;
}

export interface AdminUserInfo {
  id: number;
  email: string;
  username: string;
  nome: string;
  is_staff: boolean;
  is_superuser: boolean;
  date_joined: string;
  admin_record: {
    id: number;
    rg: string;
  } | null;
}

class AdminApiService {
  
  async getStats(): Promise<AdminStats> {
    return elibrosApi.makeRequest<AdminStats>('/admin/dashboard_stats/');
  }

   async getUserInfo(): Promise<AdminUserInfo> {
    return elibrosApi.makeRequest<AdminUserInfo>('/admin/user_info/');
  }
   async isCurrentUserAdmin(): Promise<boolean> {
    // 1) Verifica primeiro localmente (rápido e não bloqueante)
    try {
      const localUser = authApi.getCurrentUser();
      if (localUser) {
        const hasStaff = typeof localUser.is_staff === 'boolean';
        const hasSuper = typeof localUser.is_superuser === 'boolean';
        // Só assumimos "não admin" quando as flags existem E são explicitamente falsas
        if ((hasStaff || hasSuper) && localUser.is_staff === false && localUser.is_superuser === false) {
          return false;
        }
        // Caso flags estejam ausentes ou alguma seja true, confirmamos via API
      }
    } catch {
      // Ignorar problemas de leitura local e prosseguir para verificação remota
    }

    // 2) Confirma com a API (necessário para admins e para casos onde flags locais não vieram)
    try {
      const userInfo = await this.getUserInfo();
      return userInfo.is_staff || userInfo.is_superuser || !!userInfo.admin_record;
    } catch (error) {
      // Evitar erro ruidoso para fluxo esperado (403 de usuários comuns)
      console.warn('isCurrentUserAdmin: sem permissão ou indisponível, assumindo false');
      return false;
    }
  }

}

export const adminApi = new AdminApiService();