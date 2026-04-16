import { useState } from 'react';
import { Activity, Lock, Mail, Eye, EyeOff, Wifi, WifiOff } from 'lucide-react';

interface LoginProps {
  onLogin: (user: any, token: string) => void;
  onRegister: () => void;
  authAPI: {
    login: (email: string, password: string) => Promise<{ token: string; user: any }>;
  };
  backendOnline: boolean | null;
}

export function Login({ onLogin, onRegister, authAPI, backendOnline }: LoginProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [rememberMe, setRememberMe] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;

    setIsLoading(true);
    setError('');

    try {
      const { token, user } = await authAPI.login(email, password);
      if (rememberMe) {
        localStorage.setItem('ph_remember_email', email);
      } else {
        localStorage.removeItem('ph_remember_email');
      }
      onLogin(user, token);
    } catch (err: any) {
      setError(err.message || 'Erro ao iniciar sessão. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 to-blue-800 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-2xl p-8">
          {/* Logo */}
          <div className="flex flex-col items-center mb-8">
            <div className="w-16 h-16 bg-blue-600 rounded-xl flex items-center justify-center mb-4">
              <Activity className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900">BIOMA</h1>
            <p className="text-gray-600 text-sm mt-1">Sistema de Triagem Clínica</p>

            {/* Estado do Backend */}
            <div className={`mt-3 flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium ${
              backendOnline === true
                ? 'bg-green-100 text-green-700'
                : backendOnline === false
                ? 'bg-yellow-100 text-yellow-700'
                : 'bg-gray-100 text-gray-500'
            }`}>
              {backendOnline === true ? (
                <><Wifi className="w-3 h-3" /> Backend Conectado</>
              ) : backendOnline === false ? (
                <><WifiOff className="w-3 h-3" /> Modo Demo (sem backend)</>
              ) : (
                <><div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse"></div> A verificar conexão...</>
              )}
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700 flex items-center gap-2">
              <span>⚠️</span> {error}
            </div>
          )}

          {/* Formulário */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email
              </label>
              <div className="relative">
                <Mail className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); setError(''); }}
                  placeholder="seu.email@hospital.pt"
                  className="w-full pl-11 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                  autoComplete="email"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Senha
              </label>
              <div className="relative">
                <Lock className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); setError(''); }}
                  placeholder="••••••••"
                  className="w-full pl-11 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between text-sm">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 text-blue-600 rounded"
                />
                <span className="text-gray-600">Lembrar-me</span>
              </label>
              <button type="button" className="text-blue-600 hover:underline">
                Esqueceu a senha?
              </button>
            </div>

            <button
              type="submit"
              disabled={isLoading || !email || !password}
              className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  A entrar...
                </>
              ) : (
                'Entrar'
              )}
            </button>
          </form>

          {/* Demo hint */}
          {backendOnline === false && (
            <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg text-xs text-blue-700">
              <p className="font-medium mb-1">💡 Modo Demo ativo</p>
              <p>Pode usar qualquer email e senha para aceder. O sistema funciona com dados simulados.</p>
            </div>
          )}

          <div className="mt-6 pt-6 border-t border-gray-200 text-center">
            <p className="text-sm text-gray-600">
              Não tem uma conta?{' '}
              <button
                onClick={onRegister}
                className="text-blue-600 hover:underline font-medium"
              >
                Registar-se
              </button>
            </p>
          </div>
        </div>

        <div className="mt-8 text-center text-white text-sm">
          <p className="opacity-90">© 2026 BIOMA - Clinical Pulse Unit A</p>
          <p className="opacity-75 mt-1">Sistema de Triagem Inteligente com IoT</p>
        </div>
      </div>
    </div>
  );
}
