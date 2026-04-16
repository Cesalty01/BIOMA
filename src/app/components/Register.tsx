import { useState } from 'react';
import { Activity, Lock, Mail, User, Stethoscope, Eye, EyeOff, ArrowLeft, CheckCircle } from 'lucide-react';

interface RegisterProps {
  onRegister: (user: any, token: string) => void;
  onBackToLogin: () => void;
  authAPI: {
    register: (name: string, email: string, password: string, specialty?: string) => Promise<{ token: string; user: any }>;
  };
}

const specialties = [
  'Oncologia',
  'Radiologia',
  'Cirurgia Geral',
  'Ginecologia',
  'Medicina Interna',
  'Enfermagem',
  'Técnico de Saúde',
  'Paciente',
  'Outro',
];

export function Register({ onRegister, onBackToLogin, authAPI }: RegisterProps) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    specialty: '',
    password: '',
    confirmPassword: '',
    agreeTerms: false,
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const updateField = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setError('');
  };

  const validate = () => {
    if (!formData.name.trim()) return 'Por favor, insira o nome completo.';
    if (formData.name.trim().length < 3) return 'O nome deve ter pelo menos 3 caracteres.';
    if (!formData.email.trim()) return 'Por favor, insira o email.';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) return 'Email inválido.';
    if (!formData.specialty) return 'Por favor, selecione a especialidade.';
    if (!formData.password) return 'Por favor, insira uma senha.';
    if (formData.password.length < 6) return 'A senha deve ter pelo menos 6 caracteres.';
    if (formData.password !== formData.confirmPassword) return 'As senhas não coincidem.';
    if (!formData.agreeTerms) return 'Deve aceitar os termos de utilização.';
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const role = formData.specialty === 'Paciente' ? 'patient' : 'doctor';
      const { token, user } = await authAPI.register(
        formData.name.trim(),
        formData.email.trim().toLowerCase(),
        formData.password,
        formData.specialty,
        role
      );

      setSuccess(true);
      setTimeout(() => {
        onRegister(user, token);
      }, 1500);
    } catch (err: any) {
      setError(err.message || 'Erro ao criar conta. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  const getPasswordStrength = () => {
    const p = formData.password;
    if (!p) return null;
    if (p.length < 6) return { label: 'Fraca', color: 'bg-red-500', width: '25%' };
    if (p.length < 8) return { label: 'Razoável', color: 'bg-yellow-500', width: '50%' };
    if (p.length < 10 || !/[A-Z]/.test(p) || !/[0-9]/.test(p)) return { label: 'Boa', color: 'bg-blue-500', width: '75%' };
    return { label: 'Forte', color: 'bg-green-500', width: '100%' };
  };

  const strength = getPasswordStrength();

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-600 to-blue-800 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md text-center">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-10 h-10 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Conta Criada!</h2>
          <p className="text-gray-600">A sua conta foi criada com sucesso. A entrar no sistema...</p>
          <div className="mt-4 w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 to-blue-800 flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        <div className="bg-white rounded-2xl shadow-2xl p-8">
          {/* Header */}
          <div className="flex items-center mb-6">
            <button
              onClick={onBackToLogin}
              className="p-2 hover:bg-gray-100 rounded-lg mr-3 transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-gray-600" />
            </button>
            <div className="flex items-center gap-3 flex-1">
              <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center">
                <Activity className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Criar Conta</h1>
                <p className="text-gray-500 text-xs">BIOMA - Sistema Clínico</p>
              </div>
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700 flex items-center gap-2">
              <span className="text-red-500">⚠️</span>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Nome */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nome Completo <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => updateField('name', e.target.value)}
                  placeholder="Dr. Nome Apelido"
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  required
                />
              </div>
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email Profissional <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => updateField('email', e.target.value)}
                  placeholder="nome@hospital.pt"
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  required
                />
              </div>
            </div>

            {/* Especialidade */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Especialidade / Cargo <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Stethoscope className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <select
                  value={formData.specialty}
                  onChange={(e) => updateField('specialty', e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm appearance-none bg-white"
                  required
                >
                  <option value="">Selecionar especialidade...</option>
                  {specialties.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Senha */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Senha <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={(e) => updateField('password', e.target.value)}
                  placeholder="Mínimo 6 caracteres"
                  className="w-full pl-10 pr-10 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {/* Indicador de força da senha */}
              {strength && (
                <div className="mt-1.5">
                  <div className="w-full bg-gray-200 rounded-full h-1.5">
                    <div
                      className={`h-1.5 rounded-full transition-all duration-300 ${strength.color}`}
                      style={{ width: strength.width }}
                    ></div>
                  </div>
                  <span className="text-xs text-gray-500 mt-0.5 block">Força: {strength.label}</span>
                </div>
              )}
            </div>

            {/* Confirmar Senha */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Confirmar Senha <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={formData.confirmPassword}
                  onChange={(e) => updateField('confirmPassword', e.target.value)}
                  placeholder="Repetir a senha"
                  className={`w-full pl-10 pr-10 py-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm ${
                    formData.confirmPassword && formData.password !== formData.confirmPassword
                      ? 'border-red-300 bg-red-50'
                      : 'border-gray-300'
                  }`}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {formData.confirmPassword && formData.password !== formData.confirmPassword && (
                <p className="text-xs text-red-600 mt-1">As senhas não coincidem</p>
              )}
            </div>

            {/* Termos */}
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.agreeTerms}
                onChange={(e) => updateField('agreeTerms', e.target.checked)}
                className="w-4 h-4 text-blue-600 rounded mt-0.5"
              />
              <span className="text-sm text-gray-600">
                Aceito os{' '}
                <button type="button" className="text-blue-600 hover:underline font-medium">
                  Termos de Utilização
                </button>{' '}
                e a{' '}
                <button type="button" className="text-blue-600 hover:underline font-medium">
                  Política de Privacidade
                </button>{' '}
                do sistema clínico.
              </span>
            </label>

            {/* Submit */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  A criar conta...
                </>
              ) : (
                'Criar Conta'
              )}
            </button>
          </form>

          {/* Footer */}
          <div className="mt-5 pt-5 border-t border-gray-200 text-center">
            <p className="text-sm text-gray-600">
              Já tem conta?{' '}
              <button
                onClick={onBackToLogin}
                className="text-blue-600 hover:underline font-medium"
              >
                Iniciar Sessão
              </button>
            </p>
          </div>
        </div>

        <div className="mt-6 text-center text-white text-sm">
          <p className="opacity-90">© 2026 BIOMA - Clinical Pulse Unit A</p>
          <p className="opacity-75 mt-1">Sistema de Triagem Inteligente com IoT</p>
        </div>
      </div>
    </div>
  );
}
