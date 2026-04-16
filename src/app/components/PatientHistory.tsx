import { Users, TrendingUp, Activity, Calendar, ArrowRight, Download, Search, RefreshCw, AlertTriangle } from 'lucide-react';
import { useState, useEffect } from 'react';
import { triagesAPI } from '../services/api';

interface TriageRecord {
  id: number;
  patient_id: string;
  full_name: string;
  date_of_birth: string;
  phone_contact: string;
  risk_level: 'high' | 'medium' | 'low';
  risk_score: number;
  heart_rate: number;
  spo2: number;
  temperature: number;
  lump_detected: number;
  breast_pain: number;
  skin_changes: number;
  nipple_discharge: number;
  family_history: number;
  previous_diagnosis: number;
  observations: string;
  created_at: string;
}

interface PatientHistoryProps {
  onViewTriage?: (triage: TriageRecord) => void;
}

export function PatientHistory({ onViewTriage }: PatientHistoryProps) {
  const savedUser = localStorage.getItem('ph_user');
  const user = savedUser ? JSON.parse(savedUser) : null;
  const isPatient = user?.role === 'patient';
  const isAdminOrDoctor = user?.role === 'admin' || user?.role === 'doctor';

  const [triages, setTriages] = useState<TriageRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  const loadTriages = async () => {
    setIsLoading(true);
    try {
      const data = await triagesAPI.list({ limit: 100 });
      let records = data as TriageRecord[];
      
      // Se for paciente, filtrar apenas os seus registros por nome
      if (isPatient) {
        records = records.filter(t => t.full_name?.toLowerCase() === user.name?.toLowerCase());
      }
      
      setTriages(records);
    } catch {
      // fallback já está no serviço
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadTriages();
  }, []);

  const getStatusConfig = (level: string) => {
    switch (level) {
      case 'high': return { label: 'ALTO RISCO', color: 'bg-red-100 text-red-700' };
      case 'medium': return { label: 'MÉDIO', color: 'bg-yellow-100 text-yellow-700' };
      default: return { label: 'BAIXO', color: 'bg-green-100 text-green-700' };
    }
  };

  const formatDate = (iso: string) => {
    try {
      return new Date(iso).toLocaleDateString('pt-PT', { day: '2-digit', month: 'short', year: 'numeric' });
    } catch {
      return iso;
    }
  };

  // Filtrar
  const filtered = triages.filter(t => {
    const matchSearch = !searchTerm ||
      t.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.patient_id?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchStatus = !statusFilter ||
      (statusFilter === 'high' && t.risk_level === 'high') ||
      (statusFilter === 'medium' && t.risk_level === 'medium') ||
      (statusFilter === 'low' && t.risk_level === 'low');

    return matchSearch && matchStatus;
  });

  // Paginação
  const totalPages = Math.max(1, Math.ceil(filtered.length / itemsPerPage));
  const paginated = filtered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  // Stats
  const totalPatients = triages.length;
  const avgScore = totalPatients > 0
    ? (triages.reduce((s, t) => s + (t.risk_score || 0), 0) / totalPatients).toFixed(1)
    : '0.0';
  const highRiskCount = triages.filter(t => t.risk_level === 'high').length;

  // Exportar CSV
  const exportCSV = () => {
    const headers = ['ID Paciente', 'Nome', 'Data Nascimento', 'Telefone', 'Nível Risco', 'Pontuação', 'Data Triagem'];
    const rows = filtered.map(t => [
      t.patient_id,
      t.full_name,
      t.date_of_birth,
      t.phone_contact || '-',
      getStatusConfig(t.risk_level).label,
      t.risk_score,
      formatDate(t.created_at),
    ]);

    const csv = [headers, ...rows].map(r => r.join(';')).join('\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `meus_exames_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex-1 bg-gray-50">
      <div className="p-8">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-1">
              {isPatient ? 'Meus Exames e Triagens' : 'Histórico Geral de Pacientes'}
            </h1>
            <p className="text-gray-600">
              {isPatient ? 'Consulte os resultados de todas as suas avaliações anteriores.' : 'Revise avaliações anteriores e dados de triagem.'}
            </p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={loadTriages}
              disabled={isLoading}
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 flex items-center gap-2"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
              Atualizar
            </button>
            {isAdminOrDoctor && (
              <button
                onClick={exportCSV}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 flex items-center gap-2"
              >
                <Download className="w-4 h-4" />
                Exportar CSV
              </button>
            )}
          </div>
        </div>

        {/* Estatísticas */}
        {isAdminOrDoctor && (
          <div className="grid grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                <Users className="w-5 h-5 text-blue-600" />
              </div>
              <div className="text-3xl font-bold text-gray-900 mb-1">
                {isLoading ? <div className="w-16 h-8 bg-gray-200 rounded animate-pulse"></div> : totalPatients.toLocaleString('pt-PT')}
              </div>
              <div className="text-sm text-gray-600">Total de Avaliações</div>
              <div className="text-xs text-green-600 mt-2">+8% vs mês anterior</div>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-sm">
              <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center mb-4">
                <TrendingUp className="w-5 h-5 text-yellow-600" />
              </div>
              <div className="text-3xl font-bold text-gray-900 mb-1">
                {isLoading ? <div className="w-12 h-8 bg-gray-200 rounded animate-pulse"></div> : avgScore}
              </div>
              <div className="text-sm text-gray-600">Pontuação Média</div>
              <div className="text-xs text-gray-500 mt-2">Em todos os pacientes</div>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-sm">
              <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center mb-4">
                <Activity className="w-5 h-5 text-red-600" />
              </div>
              <div className="text-3xl font-bold text-gray-900 mb-1">
                {isLoading ? <div className="w-12 h-8 bg-gray-200 rounded animate-pulse"></div> : highRiskCount}
              </div>
              <div className="text-sm text-gray-600">Avaliações de Risco</div>
              <div className="text-xs text-red-600 mt-2">Casos de alta prioridade</div>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-sm">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center mb-4">
                <Calendar className="w-5 h-5 text-green-600" />
              </div>
              <div className="text-3xl font-bold text-gray-900 mb-1">62</div>
              <div className="text-sm text-gray-600">Idade Média</div>
              <div className="text-xs text-gray-500 mt-2">anos</div>
            </div>
          </div>
        )}

        {/* Tabela */}
        <div className="bg-white rounded-xl shadow-sm">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">Triagens Registadas</h2>
              <div className="flex items-center gap-3">
                <div className="relative">
                  <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Pesquisar por nome ou ID..."
                    value={searchTerm}
                    onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                    className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent w-64"
                  />
                </div>
                <select
                  value={statusFilter}
                  onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50"
                >
                  <option value="">Todos os Status</option>
                  <option value="high">Alto Risco</option>
                  <option value="medium">Médio</option>
                  <option value="low">Baixo</option>
                </select>
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            {isLoading ? (
              <div className="p-8">
                <div className="space-y-3">
                  {[1, 2, 3, 4].map(i => (
                    <div key={i} className="h-14 bg-gray-100 rounded-lg animate-pulse"></div>
                  ))}
                </div>
              </div>
            ) : filtered.length === 0 ? (
              <div className="p-12 text-center">
                <AlertTriangle className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500 font-medium">Nenhuma triagem encontrada</p>
                <p className="text-gray-400 text-sm mt-1">Tente ajustar os filtros de pesquisa</p>
              </div>
            ) : (
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Paciente</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Data</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estado</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Pontuação</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Sinais IoT</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ações</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {paginated.map((triage, index) => {
                    const status = getStatusConfig(triage.risk_level);
                    return (
                      <tr key={triage.id || index} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                              <span className="text-sm font-medium text-blue-600">
                                {triage.full_name?.charAt(0) || '?'}
                              </span>
                            </div>
                            <div>
                              <div className="font-medium text-gray-900">{triage.full_name}</div>
                              <div className="text-sm text-gray-500">{triage.patient_id}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                          {formatDate(triage.created_at)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-3 py-1 rounded-full text-xs font-medium ${status.color}`}>
                            {status.label}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <div className="w-16 bg-gray-200 rounded-full h-1.5">
                              <div
                                className={`h-1.5 rounded-full ${triage.risk_level === 'high' ? 'bg-red-500' : triage.risk_level === 'medium' ? 'bg-yellow-500' : 'bg-green-500'}`}
                                style={{ width: `${Math.min(100, (triage.risk_score / 13) * 100)}%` }}
                              ></div>
                            </div>
                            <span className="text-sm font-semibold text-gray-900">{triage.risk_score}</span>
                            <span className="text-xs text-gray-500">/ 13</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-xs text-gray-600 space-y-0.5">
                            {triage.heart_rate && <div>❤️ {triage.heart_rate} bpm</div>}
                            {triage.spo2 && <div>💧 {triage.spo2}%</div>}
                            {triage.temperature && <div>🌡️ {triage.temperature}°C</div>}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <button
                            onClick={() => onViewTriage?.(triage)}
                            className="text-blue-600 hover:bg-blue-50 px-3 py-1 rounded-lg text-sm font-medium flex items-center gap-1 transition-colors"
                          >
                            Ver Caso
                            <ArrowRight className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>

          {/* Paginação */}
          {!isLoading && filtered.length > 0 && (
            <div className="p-4 border-t border-gray-200 flex items-center justify-between">
              <div className="text-sm text-gray-600">
                Mostrando {Math.min(filtered.length, (currentPage - 1) * itemsPerPage + 1)}-{Math.min(filtered.length, currentPage * itemsPerPage)} de {filtered.length} registos
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-1 border border-gray-300 rounded-lg text-sm hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Anterior
                </button>
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  const page = i + 1;
                  return (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={`px-3 py-1 rounded-lg text-sm ${currentPage === page ? 'bg-blue-600 text-white' : 'border border-gray-300 hover:bg-gray-50'}`}
                    >
                      {page}
                    </button>
                  );
                })}
                <button
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="px-3 py-1 border border-gray-300 rounded-lg text-sm hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Próximo
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
