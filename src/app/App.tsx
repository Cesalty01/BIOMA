import { useState, useEffect } from 'react';
import { Login } from './components/Login';
import { Register } from './components/Register';
import { Sidebar } from './components/Sidebar';
import { Dashboard } from './components/Dashboard';
import { NewTriage } from './components/NewTriage';
import { TriageResult } from './components/TriageResult';
import { PatientHistory } from './components/PatientHistory';
import { Forum } from './components/Forum';
import { Bell, Settings, User, LogOut, Wifi, WifiOff } from 'lucide-react';
import { authAPI, setAuthToken, clearAuthToken, loadSavedToken, checkBackendAvailability, isBackendAvailable } from './services/api';

type Page = 'dashboard' | 'new-triage' | 'result' | 'history' | 'forum';
type AuthPage = 'login' | 'register';

interface UserInfo {
  id: number;
  email: string;
  name: string;
  role: string;
}

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [authPage, setAuthPage] = useState<AuthPage>('login');
  const [currentPage, setCurrentPage] = useState<Page>('dashboard');
  const [triageData, setTriageData] = useState<any>(null);
  const [user, setUser] = useState<UserInfo | null>(null);
  const [backendOnline, setBackendOnline] = useState<boolean | null>(null);
  const [showUserMenu, setShowUserMenu] = useState(false);

  // Verificar backend e token salvo ao iniciar
  useEffect(() => {
    const init = async () => {
      // Verificar disponibilidade do backend
      const online = await checkBackendAvailability();
      setBackendOnline(online);

      // Verificar se há token salvo
      const savedToken = loadSavedToken();
      const savedUser = localStorage.getItem('ph_user');

      if (savedToken && savedUser) {
        try {
          const parsedUser = JSON.parse(savedUser);
          setUser(parsedUser);
          setIsLoggedIn(true);
        } catch {
          clearAuthToken();
        }
      }
    };

    init();
  }, []);

  const handleLogin = (userData: UserInfo, token: string) => {
    setAuthToken(token);
    setUser(userData);
    localStorage.setItem('ph_user', JSON.stringify(userData));
    setIsLoggedIn(true);
    setCurrentPage('dashboard');
  };

  const handleRegister = (userData: UserInfo, token: string) => {
    setAuthToken(token);
    setUser(userData);
    localStorage.setItem('ph_user', JSON.stringify(userData));
    setIsLoggedIn(true);
    setCurrentPage('dashboard');
  };

  const handleLogout = () => {
    clearAuthToken();
    localStorage.removeItem('ph_user');
    setUser(null);
    setIsLoggedIn(false);
    setAuthPage('login');
    setCurrentPage('dashboard');
    setTriageData(null);
    setShowUserMenu(false);
  };

  const handleTriageSubmit = (data: any) => {
    setTriageData(data);
    setCurrentPage('result');
  };

  const handleBackFromResult = () => {
    setCurrentPage('new-triage');
    setTriageData(null);
  };

  const handleNewTriage = () => {
    setTriageData(null);
    setCurrentPage('new-triage');
  };

  const handleViewTriageFromHistory = (triage: any) => {
    // Converter formato do backend para frontend
    setTriageData({
      fullName: triage.full_name,
      dateOfBirth: triage.date_of_birth,
      patientId: triage.patient_id,
      phoneContact: triage.phone_contact,
      lumpDetected: !!triage.lump_detected,
      breastPain: !!triage.breast_pain,
      skinChanges: !!triage.skin_changes,
      nippleDischarge: !!triage.nipple_discharge,
      familyHistory: !!triage.family_history,
      previousDiagnosis: !!triage.previous_diagnosis,
      observations: triage.observations,
      riskScore: triage.risk_score,
      riskLevel: triage.risk_level,
      heartRate: triage.heart_rate,
      spo2: triage.spo2,
      temperature: triage.temperature,
      timestamp: triage.created_at,
    });
    setCurrentPage('result');
  };

  const renderPage = () => {
    const isAdminOrDoctor = user?.role === 'admin' || user?.role === 'doctor';

    switch (currentPage) {
      case 'dashboard':
        return <Dashboard onNavigate={setCurrentPage} />;
      case 'new-triage':
        if (!isAdminOrDoctor) {
          // Pacientes não podem fazer triagem
          return <Dashboard onNavigate={setCurrentPage} />;
        }
        return <NewTriage onSubmit={handleTriageSubmit} />;
      case 'result':
        return triageData
          ? <TriageResult patientData={triageData} onBack={handleBackFromResult} onNewTriage={handleNewTriage} />
          : <Dashboard onNavigate={setCurrentPage} />;
      case 'history':
        return <PatientHistory onViewTriage={handleViewTriageFromHistory} />;
      case 'forum':
        return <Forum />;
      default:
        return <Dashboard onNavigate={setCurrentPage} />;
    }
  };

  // Telas de autenticação
  if (!isLoggedIn) {
    if (authPage === 'register') {
      return (
        <Register
          authAPI={authAPI}
          onRegister={handleRegister}
          onBackToLogin={() => setAuthPage('login')}
        />
      );
    }

    return (
      <Login
        authAPI={authAPI}
        onLogin={handleLogin}
        onRegister={() => setAuthPage('register')}
        backendOnline={backendOnline}
      />
    );
  }

  // App principal
  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar currentPage={currentPage} onNavigate={(page) => setCurrentPage(page as Page)} />

      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className="bg-white border-b border-gray-200 px-8 py-4 flex items-center justify-between flex-shrink-0">
          {/* Pesquisa */}
          <div className="relative flex-1 max-w-md">
            <input
              type="text"
              placeholder="Pesquisar pacientes ou documentação..."
              className="w-full px-4 py-2 pl-10 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <svg className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>

          <div className="flex items-center gap-4">
            {/* Estado do Backend */}
            <div className={`hidden md:flex items-center gap-1.5 px-2 py-1 rounded text-xs ${
              isBackendAvailable() ? 'text-green-600' : 'text-yellow-600'
            }`}>
              {isBackendAvailable()
                ? <><Wifi className="w-3 h-3" /> API Online</>
                : <><WifiOff className="w-3 h-3" /> Demo</>
              }
            </div>

            {/* Notificações */}
            <button className="relative p-2 hover:bg-gray-100 rounded-lg">
              <Bell className="w-5 h-5 text-gray-600" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
            </button>

            {/* Definições */}
            <button className="p-2 hover:bg-gray-100 rounded-lg">
              <Settings className="w-5 h-5 text-gray-600" />
            </button>

            {/* Utilizador */}
            <div className="relative pl-4 border-l border-gray-200">
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center gap-3 hover:bg-gray-50 rounded-lg p-2 -m-2 transition-colors"
              >
                <div className="text-right hidden sm:block">
                  <div className="text-sm font-medium text-gray-900">{user?.name || 'Utilizador'}</div>
                  <div className="text-xs text-gray-500 capitalize">{user?.role === 'admin' ? 'Administrador' : user?.role || 'Médico'}</div>
                </div>
                <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
                  <User className="w-5 h-5 text-white" />
                </div>
              </button>

              {/* Menu do utilizador */}
              {showUserMenu && (
                <div className="absolute right-0 top-full mt-2 w-52 bg-white rounded-xl shadow-lg border border-gray-200 py-2 z-50">
                  <div className="px-4 py-2 border-b border-gray-100">
                    <div className="text-sm font-medium text-gray-900">{user?.name}</div>
                    <div className="text-xs text-gray-500">{user?.email}</div>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-3 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                    Terminar Sessão
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Conteúdo principal */}
        <main className="flex-1 overflow-y-auto">
          {renderPage()}
        </main>
      </div>

      {/* Overlay para fechar menu */}
      {showUserMenu && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setShowUserMenu(false)}
        />
      )}
    </div>
  );
}
