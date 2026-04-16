import { Users, TrendingUp, AlertTriangle, ArrowRight, BarChart3, RefreshCw, MessageCircle, BookOpen, Activity } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip } from 'recharts';
import { useEffect, useState } from 'react';
import { triagesAPI } from '../services/api';

const weeklyData = [
  { day: 'Seg', value: 45 },
  { day: 'Ter', value: 62 },
  { day: 'Qua', value: 58 },
  { day: 'Qui', value: 72 },
  { day: 'Sex', value: 68 },
  { day: 'Sáb', value: 85 },
  { day: 'Dom', value: 92 },
];

interface DashboardProps {
  onNavigate?: (page: string) => void;
}

export function Dashboard({ onNavigate }: DashboardProps) {
  const savedUser = localStorage.getItem('ph_user');
  const user = savedUser ? JSON.parse(savedUser) : null;
  const isPatient = user?.role === 'patient';

  const [stats, setStats] = useState({
    totalTriages: 1284,
    averageRiskScore: '6.2',
    highRiskCases: 156,
    riskDistribution: { high: 12, medium: 33, low: 55 },
  });
  const [recentTriages, setRecentTriages] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [statsData, triagesData] = await Promise.all([
        triagesAPI.stats(),
        triagesAPI.list({ limit: 5 }),
      ]);

      if (statsData) {
        // ... (resto da lógica de stats)
        const total = statsData.totalTriages || 0;
        const dist = statsData.riskDistribution || { high: 0, medium: 0, low: 0 };
        const totalDist = dist.high + dist.medium + dist.low;

        setStats({
          totalTriages: total,
          averageRiskScore: statsData.averageRiskScore || '0.0',
          highRiskCases: dist.high || 0,
          riskDistribution: {
            high: totalDist > 0 ? Math.round((dist.high / totalDist) * 100) : 0,
            medium: totalDist > 0 ? Math.round((dist.medium / totalDist) * 100) : 0,
            low: totalDist > 0 ? Math.round((dist.low / totalDist) * 100) : 0,
          },
        });
      }

      if (triagesData && triagesData.length > 0) {
        setRecentTriages(triagesData);
      } else {
        setRecentTriages([]);
      }

      setLastUpdated(new Date());
    } catch {
      // Usar dados padrão
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const getRiskLabel = (level: string) => {
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

  // Se for paciente, renderizar Painel do Paciente
  if (isPatient) {
    return (
      <div className="flex-1 bg-[#F8F9FC] overflow-auto">
        <div className="p-8">
          <div className="mb-8 flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Olá, {user?.name}! 👋</h1>
              <p className="text-gray-600">Este é o seu espaço de saúde e comunidade.</p>
            </div>
            <button
              onClick={() => onNavigate?.('forum')}
              className="bg-blue-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-200 flex items-center gap-2"
            >
              <MessageCircle className="w-5 h-5" />
              Ver Comunidade
            </button>
          </div>

          <div className="grid md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mb-4">
                <BookOpen className="w-6 h-6 text-blue-600" />
              </div>
              <h3 className="text-lg font-bold text-gray-900">Educação e Saúde</h3>
              <p className="text-sm text-gray-500 mt-2">Aprenda sobre prevenção e cuidados diários.</p>
              <button 
                onClick={() => onNavigate?.('forum')}
                className="mt-4 text-blue-600 text-sm font-bold flex items-center gap-1 hover:underline"
              >
                Começar a estudar <ArrowRight className="w-4 h-4" />
              </button>
            </div>
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <div className="w-12 h-12 bg-pink-100 rounded-xl flex items-center justify-center mb-4">
                <Users className="w-6 h-6 text-pink-600" />
              </div>
              <h3 className="text-lg font-bold text-gray-900">Comunidade</h3>
              <p className="text-sm text-gray-500 mt-2">Dê seu feedback e curta as discussões no fórum.</p>
              <button 
                onClick={() => onNavigate?.('forum')}
                className="mt-4 text-pink-600 text-sm font-bold flex items-center gap-1 hover:underline"
              >
                Ir para o fórum <ArrowRight className="w-4 h-4" />
              </button>
            </div>
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center mb-4">
                <Activity className="w-6 h-6 text-green-600" />
              </div>
              <h3 className="text-lg font-bold text-gray-900">Minha Saúde</h3>
              <p className="text-sm text-gray-500 mt-2">Visualize seu histórico de triagens clínicas.</p>
              <button 
                onClick={() => onNavigate?.('history')}
                className="mt-4 text-green-600 text-sm font-bold flex items-center gap-1 hover:underline"
              >
                Ver histórico <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="bg-gradient-to-r from-blue-600 to-blue-800 rounded-3xl p-8 text-white relative overflow-hidden shadow-xl shadow-blue-100">
            <div className="relative z-10">
              <h2 className="text-2xl font-bold mb-4">Campanha Outubro Rosa & Mais 🌸</h2>
              <p className="max-w-xl text-blue-50 opacity-90 leading-relaxed mb-6">
                Lembre-se: o autoexame e o acompanhamento regular são fundamentais. 
                Temos conteúdos exclusivos sobre o câncer de mama esperando por você na aba de educação.
              </p>
              <button 
                onClick={() => onNavigate?.('forum')}
                className="bg-white text-blue-600 px-6 py-3 rounded-xl font-bold hover:bg-blue-50 transition-colors"
              >
                Ler conteúdos educativos
              </button>
            </div>
            <div className="absolute top-0 right-0 p-8 opacity-10">
              <Activity className="w-40 h-40" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 pb-20">
      <div className="p-8">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-1">Visão Geral da Manhã</h1>
            <p className="text-gray-600">Acompanhe avaliações de pacientes, tendências e triagens prioritárias</p>
          </div>
          <button
            onClick={loadData}
            disabled={isLoading}
            className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 text-sm disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            Atualizar
          </button>
        </div>

        {/* Estatísticas */}
        <div className="grid grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-xl p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <Users className="w-5 h-5 text-blue-600" />
              </div>
              <span className="text-xs text-green-600 bg-green-50 px-2 py-1 rounded">+12%</span>
            </div>
            <div className="text-3xl font-bold text-gray-900 mb-1">
              {isLoading ? <div className="w-20 h-8 bg-gray-200 rounded animate-pulse"></div> : stats.totalTriages.toLocaleString('pt-PT')}
            </div>
            <div className="text-sm text-gray-600">Total de Pacientes</div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-yellow-600" />
              </div>
              <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">+0.3</span>
            </div>
            <div className="text-3xl font-bold text-gray-900 mb-1">
              {isLoading ? <div className="w-12 h-8 bg-gray-200 rounded animate-pulse"></div> : stats.averageRiskScore}
            </div>
            <div className="text-sm text-gray-600">Pontuação Média de Risco</div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-red-600" />
              </div>
              <span className="text-xs text-red-600 bg-red-50 px-2 py-1 rounded">+8</span>
            </div>
            <div className="text-3xl font-bold text-gray-900 mb-1">
              {isLoading ? <div className="w-16 h-8 bg-gray-200 rounded animate-pulse"></div> : stats.highRiskCases}
            </div>
            <div className="text-sm text-gray-600">Casos de Alto Risco</div>
          </div>
        </div>

        {/* Gráficos */}
        <div className="grid grid-cols-3 gap-6 mb-8">
          <div className="col-span-2 bg-white rounded-xl p-6 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Dados de Eficácia de Triagem</h2>
                <p className="text-sm text-gray-600">Últimos 7 dias: Alta precisão e confiabilidade</p>
              </div>
              <div className="flex gap-2">
                <button className="text-sm px-3 py-1 bg-blue-50 text-blue-600 border border-blue-200 rounded-lg">Últimos 7 dias</button>
                <button className="text-sm px-3 py-1 border border-gray-200 rounded-lg hover:bg-gray-50">Último Mês</button>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={weeklyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fill: '#6b7280', fontSize: 12 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#6b7280', fontSize: 12 }} />
                <Tooltip
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}
                  formatter={(v) => [`${v} triagens`, 'Total']}
                />
                <Bar dataKey="value" fill="#2563eb" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Distribuição de Risco</h2>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-gray-600">Alto Risco</span>
                  <span className="font-semibold text-red-600">{stats.riskDistribution.high}%</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-2">
                  <div className="bg-red-500 h-2 rounded-full transition-all duration-700" style={{ width: `${stats.riskDistribution.high}%` }}></div>
                </div>
              </div>
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-gray-600">Risco Intermediário</span>
                  <span className="font-semibold text-yellow-600">{stats.riskDistribution.medium}%</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-2">
                  <div className="bg-yellow-500 h-2 rounded-full transition-all duration-700" style={{ width: `${stats.riskDistribution.medium}%` }}></div>
                </div>
              </div>
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-gray-600">Baixo Risco</span>
                  <span className="font-semibold text-green-600">{stats.riskDistribution.low}%</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-2">
                  <div className="bg-green-500 h-2 rounded-full transition-all duration-700" style={{ width: `${stats.riskDistribution.low}%` }}></div>
                </div>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-gray-200">
              <div className="bg-blue-600 text-white rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <BarChart3 className="w-4 h-4" />
                  <span className="text-xs font-medium">ESTADO DO SISTEMA</span>
                </div>
                <div className="text-sm mb-3">
                  <span className="inline-block w-2 h-2 bg-green-400 rounded-full mr-1 animate-pulse"></span>
                  Sistema Ativo
                </div>
                <button
                  onClick={() => onNavigate?.('new-triage')}
                  className="w-full bg-white text-blue-600 px-3 py-2 rounded-lg text-sm font-medium hover:bg-blue-50 transition-colors"
                >
                  Nova Triagem
                </button>
              </div>
            </div>

            {lastUpdated && (
              <p className="text-xs text-gray-400 mt-3 text-center">
                Atualizado: {lastUpdated.toLocaleTimeString('pt-PT')}
              </p>
            )}
          </div>
        </div>

        {/* Revisões Recentes */}
        <div className="bg-white rounded-xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-gray-900">Revisões Clínicas Recentes</h2>
            <button
              onClick={() => onNavigate?.('history')}
              className="text-sm text-blue-600 hover:underline flex items-center gap-1"
            >
              Ver Histórico Completo
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-16 bg-gray-100 rounded-lg animate-pulse"></div>
              ))}
            </div>
          ) : (
            <div className="space-y-3">
              {recentTriages.map((triage, index) => {
                const risk = getRiskLabel(triage.risk_level);
                return (
                  <div key={triage.id || index} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                        <span className="text-sm font-medium text-gray-600">
                          {triage.full_name?.charAt(0) || '?'}
                        </span>
                      </div>
                      <div>
                        <div className="font-medium text-gray-900">{triage.full_name}</div>
                        <div className="text-sm text-gray-500">{triage.patient_id}</div>
                      </div>
                    </div>
                    <span className={`inline-block px-3 py-1 rounded text-xs font-medium ${risk.color}`}>
                      {risk.label}
                    </span>
                    <div className="text-sm text-gray-500">
                      {formatDate(triage.created_at)}
                    </div>
                    <button
                      onClick={() => onNavigate?.('history')}
                      className="text-blue-600 hover:bg-blue-50 p-2 rounded-lg"
                    >
                      <ArrowRight className="w-5 h-5" />
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
