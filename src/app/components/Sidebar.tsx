import { LayoutDashboard, FileText, History, Activity, Cpu, PhoneCall, MessageCircle } from 'lucide-react';

interface SidebarProps {
  currentPage: string;
  onNavigate: (page: string) => void;
}

export function Sidebar({ currentPage, onNavigate }: SidebarProps) {
  const savedUser = localStorage.getItem('ph_user');
  const user = savedUser ? JSON.parse(savedUser) : null;
  const isAdminOrDoctor = user?.role === 'admin' || user?.role === 'doctor';

  const menuItems = [
    { id: 'dashboard', label: isAdminOrDoctor ? 'Painel Geral' : 'Meu Espaço', icon: LayoutDashboard },
    ...(isAdminOrDoctor ? [{ id: 'new-triage', label: 'Nova Triagem', icon: FileText }] : []),
    { id: 'history', label: isAdminOrDoctor ? 'Histórico Geral' : 'Meu Histórico', icon: History },
    { id: 'forum', label: 'Comunidade', icon: MessageCircle },
  ];

  const isActive = (id: string) => currentPage === id || (id === 'result' && currentPage === 'result');

  return (
    <div className="w-60 bg-white border-r border-gray-200 h-screen flex flex-col flex-shrink-0">
      {/* Logo */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
            <Activity className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="font-semibold text-gray-900">BIOMA</h1>
            <p className="text-xs text-gray-500">Clinical Pulse Unit A</p>
          </div>
        </div>
      </div>

      {/* Navegação */}
      <nav className="flex-1 p-4 overflow-y-auto">
        <div className="mb-2">
          <p className="text-xs font-medium text-gray-400 uppercase tracking-wider px-4 mb-2">Principal</p>
          {menuItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.id);

            return (
              <button
                key={item.id}
                onClick={() => onNavigate(item.id)}
                className={`
                  w-full flex items-center gap-3 px-4 py-3 rounded-lg mb-1 transition-colors text-left
                  ${active
                    ? 'bg-blue-50 text-blue-600 font-medium'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }
                `}
              >
                <Icon className="w-5 h-5 flex-shrink-0" />
                <span className="text-sm">{item.label}</span>
              </button>
            );
          })}
        </div>

        <div className="mt-4">
          <p className="text-xs font-medium text-gray-400 uppercase tracking-wider px-4 mb-2">Sensores</p>
          <div className="px-4 py-3 rounded-lg bg-gray-50 border border-gray-100">
            <div className="flex items-center gap-2 mb-2">
              <Cpu className="w-4 h-4 text-blue-500" />
              <span className="text-xs font-medium text-gray-700">Estado dos Sensores</span>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-gray-500">
              <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></div>
              Ativos e Sincronizados
            </div>
            <div className="text-xs text-gray-400 mt-2">Conectado via Serial</div>
          </div>
        </div>
      </nav>

      {/* Rodapé */}
      <div className="p-4 border-t border-gray-200 space-y-2">
        <button
          className="w-full bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors text-sm flex items-center justify-center gap-2"
          onClick={() => alert('🚨 Protocolo de Emergência Ativado!\n\nA notificar equipa médica de urgência...')}
        >
          <PhoneCall className="w-4 h-4" />
          Protocolo de Emergência
        </button>
        <div className="text-xs text-center text-gray-400">
          v1.0.0 • © 2026 BIOMA
        </div>
      </div>
    </div>
  );
}
