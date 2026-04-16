import { useState, useEffect, useCallback } from 'react';
import { IoTSensors } from './IoTSensors';
import { Save, AlertCircle, Play, Thermometer, Activity, ArrowRight, CheckCircle } from 'lucide-react';
import { triagesAPI } from '../services/api';

interface NewTriageProps {
  onSubmit: (data: any) => void;
}

export function NewTriage({ onSubmit }: NewTriageProps) {
  const [formData, setFormData] = useState({
    fullName: '',
    dateOfBirth: '',
    patientId: '',
    phoneContact: '',
    lumpDetected: false,
    breastPain: false,
    skinChanges: false,
    nippleDischarge: false,
    familyHistory: false,
    previousDiagnosis: false,
    observations: ''
  });

  const [sensorSnapshot, setSensorSnapshot] = useState<{
    heartRate: number; spo2: number; temperature: number;
  } | null>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');

  // Estados para medição sequencial
  const [measuringPhase, setMeasuringPhase] = useState<'idle' | 'breast1' | 'transition' | 'breast2' | 'completed'>('idle');
  const [timer, setTimer] = useState(0);
  const [measurements, setMeasurements] = useState<{ breast1?: any, breast2?: any }>({});

  const handleSensorData = useCallback((data: { heartRate: number; spo2: number; temperature: number }) => {
    setSensorSnapshot(data);
  }, []);

  const startMeasurement = () => {
    if (!formData.fullName || !formData.patientId) {
      setSubmitError('Preencha os dados do paciente antes de iniciar o Teste.');
      return;
    }
    setMeasuringPhase('breast1');
    setTimer(10);
  };

  // Efeito para o decremento do cronômetro (mais estável)
  useEffect(() => {
    let interval: any;
    if (timer > 0 && measuringPhase !== 'idle' && measuringPhase !== 'completed') {
      interval = setInterval(() => {
        setTimer(prev => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [timer > 0, measuringPhase]); // Apenas re-roda se o timer for > 0 ou mudar a fase

  // Efeito para transições de fase quando o timer chega a zero
  useEffect(() => {
    if (timer === 0 && measuringPhase !== 'idle' && measuringPhase !== 'completed') {
      if (measuringPhase === 'breast1') {
        setMeasurements(prev => ({ ...prev, breast1: sensorSnapshot }));
        setMeasuringPhase('transition');
        setTimer(10);
      } else if (measuringPhase === 'transition') {
        setMeasuringPhase('breast2');
        setTimer(10);
      } else if (measuringPhase === 'breast2') {
        setMeasurements(prev => ({ ...prev, breast2: sensorSnapshot }));
        setMeasuringPhase('completed');
      }
    }
  }, [timer, measuringPhase, sensorSnapshot]);

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();

    if (!formData.fullName.trim()) {
      setSubmitError('Por favor, insira o nome do paciente.');
      return;
    }
    if (!formData.dateOfBirth) {
      setSubmitError('Por favor, insira a data de nascimento.');
      return;
    }
    if (!formData.patientId.trim()) {
      setSubmitError('Por favor, insira o ID do paciente.');
      return;
    }

    setIsSubmitting(true);
    setSubmitError('');

    try {
      // Preparar dados no formato do backend
      const triagePayload = {
        patient_id: formData.patientId.trim(),
        full_name: formData.fullName.trim(),
        date_of_birth: formData.dateOfBirth,
        phone_contact: formData.phoneContact.trim(),
        lump_detected: formData.lumpDetected,
        breast_pain: formData.breastPain,
        skin_changes: formData.skinChanges,
        nipple_discharge: formData.nippleDischarge,
        family_history: formData.familyHistory,
        previous_diagnosis: formData.previousDiagnosis,
        observations: formData.observations.trim(),
        // Incluir dados dos sensores IoT se disponíveis
        heart_rate: sensorSnapshot?.heartRate,
        spo2: sensorSnapshot?.spo2,
        temperature: sensorSnapshot?.temperature,
        temp_breast_1: measurements.breast1?.temperature,
        temp_breast_2: measurements.breast2?.temperature,
      };

      // Tentar submeter ao backend
      const result = await triagesAPI.create(triagePayload);

      // Converter resposta do backend para formato do frontend
      onSubmit({
        fullName: result.full_name || formData.fullName,
        dateOfBirth: result.date_of_birth || formData.dateOfBirth,
        patientId: result.patient_id || formData.patientId,
        phoneContact: result.phone_contact || formData.phoneContact,
        lumpDetected: !!result.lump_detected,
        breastPain: !!result.breast_pain,
        skinChanges: !!result.skin_changes,
        nippleDischarge: !!result.nipple_discharge,
        familyHistory: !!result.family_history,
        previousDiagnosis: !!result.previous_diagnosis,
        observations: result.observations || formData.observations,
        riskScore: result.risk_score,
        riskLevel: result.risk_level,
        heartRate: result.heart_rate || sensorSnapshot?.heartRate,
        spo2: result.spo2 || sensorSnapshot?.spo2,
        temperature: result.temperature || sensorSnapshot?.temperature,
        timestamp: result.created_at || new Date().toISOString(),
        id: result.id,
      });

    } catch (err: any) {
      setSubmitError(err.message || 'Erro ao processar triagem. Tente novamente.');
      setIsSubmitting(false);
    }
  };

  const updateField = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setSubmitError('');
  };

  // Calcular urgência em tempo real
  const calculateUrgency = () => {
    const symptoms = [
      formData.lumpDetected,
      formData.breastPain,
      formData.skinChanges,
      formData.nippleDischarge,
      formData.familyHistory
    ].filter(Boolean).length;

    let riskScore = 0;
    if (formData.lumpDetected) riskScore += 3;
    if (formData.nippleDischarge) riskScore += 2;
    if (formData.skinChanges) riskScore += 2;
    if (formData.familyHistory) riskScore += 2;
    if (formData.previousDiagnosis) riskScore += 3;
    if (formData.breastPain) riskScore += 1;

    if (riskScore >= 7) return { level: 'HIGH', color: 'bg-red-100 text-red-700', label: 'ALTO' };
    if (symptoms >= 1 || riskScore >= 4) return { level: 'MEDIUM', color: 'bg-yellow-100 text-yellow-700', label: 'MÉDIO' };
    return { level: 'LOW', color: 'bg-green-100 text-green-700', label: 'BAIXO' };
  };

  const urgency = calculateUrgency();

  const symptoms = [
    { key: 'lumpDetected', label: 'Nódulo Detectado', weight: '+3 pts' },
    { key: 'breastPain', label: 'Dor na Mama', weight: '+1 pt' },
    { key: 'skinChanges', label: 'Alterações na Pele', weight: '+2 pts' },
    { key: 'nippleDischarge', label: 'Secreção Mamilar', weight: '+2 pts' },
    { key: 'familyHistory', label: 'Histórico Familiar de Oncologia', weight: '+2 pts' },
    { key: 'previousDiagnosis', label: 'Diagnóstico Anterior', weight: '+3 pts' },
  ];

  return (
    <div className="bg-gray-50 pb-20">
      <div className="p-8">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-1">Nova Triagem de Paciente</h1>
            <p className="text-gray-600">Avaliação clínica completa para priorização de rastreio</p>
          </div>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => setFormData({
                fullName: '', dateOfBirth: '', patientId: '', phoneContact: '',
                lumpDetected: false, breastPain: false, skinChanges: false,
                nippleDischarge: false, familyHistory: false, previousDiagnosis: false, observations: ''
              })}
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
            >
              Limpar Formulário
            </button>
            <button
              onClick={() => handleSubmit()}
              disabled={isSubmitting}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div> A processar...</>
              ) : (
                <><Save className="w-4 h-4" /> Finalizar Triagem</>
              )}
            </button>
          </div>
        </div>

        {/* Erro de submissão */}
        {submitError && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3 text-red-700">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <span className="text-sm">{submitError}</span>
          </div>
        )}

        <div className="grid grid-cols-3 gap-6">
          <div className="col-span-2 space-y-6">
            {/* Informações Pessoais */}
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Informações Pessoais</h2>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nome Completo do Paciente <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.fullName}
                    onChange={(e) => updateField('fullName', e.target.value)}
                    placeholder="ex: Maria da Silva"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Data de Nascimento <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={formData.dateOfBirth}
                    onChange={(e) => updateField('dateOfBirth', e.target.value)}
                    max={new Date().toISOString().split('T')[0]}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    ID do Paciente <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.patientId}
                    onChange={(e) => updateField('patientId', e.target.value)}
                    placeholder="ex: PT-0001"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Contacto Telefónico
                  </label>
                  <input
                    type="tel"
                    value={formData.phoneContact}
                    onChange={(e) => updateField('phoneContact', e.target.value)}
                    placeholder="+351 XXX XXX XXX"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
            </div>

            {/* Sintomas Clínicos */}
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Sintomas Clínicos e Histórico</h2>
              <div className="grid grid-cols-2 gap-3">
                {symptoms.map(({ key, label, weight }) => (
                  <label
                    key={key}
                    className={`flex items-center gap-3 p-3 border rounded-lg cursor-pointer transition-colors ${formData[key as keyof typeof formData]
                      ? 'border-blue-300 bg-blue-50'
                      : 'border-gray-200 hover:bg-gray-50'
                      }`}
                  >
                    <input
                      type="checkbox"
                      checked={formData[key as keyof typeof formData] as boolean}
                      onChange={(e) => updateField(key, e.target.checked)}
                      className="w-4 h-4 text-blue-600"
                    />
                    <div className="flex-1">
                      <span className="text-sm text-gray-700">{label}</span>
                      <span className="ml-2 text-xs text-blue-600 font-medium">{weight}</span>
                    </div>
                  </label>
                ))}
              </div>

              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Observações Específicas</label>
                <textarea
                  value={formData.observations}
                  onChange={(e) => updateField('observations', e.target.value)}
                  rows={4}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Notas clínicas adicionais..."
                />
              </div>
            </div>
          </div>

          {/* Coluna Direita */}
          <div className="space-y-6">
            {/* Componente de Medição Sequencial */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-blue-100">
              <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Thermometer className="w-5 h-5 text-blue-600" />
                Medição por Sensores
              </h2>

              {measuringPhase === 'idle' ? (
                <div className="text-center py-6">
                  <p className="text-sm text-gray-500 mb-6">Inicie a medição automática das duas mamas para análise comparativa.</p>
                  <button
                    onClick={startMeasurement}
                    className="w-full bg-blue-600 text-white py-4 rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-blue-700 transition-all shadow-lg shadow-blue-100"
                  >
                    <Play className="w-5 h-5" />
                    Iniciar a Triagem
                  </button>
                </div>
              ) : measuringPhase === 'completed' ? (
                <div className="text-center py-6 bg-green-50 rounded-2xl border border-green-100 animate-in zoom-in duration-300">
                  <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center mx-auto mb-3 shadow-sm">
                    <CheckCircle className="w-7 h-7 text-green-500" />
                  </div>
                  <h3 className="font-bold text-green-900">Medição Concluída!</h3>
                  <p className="text-xs text-green-700 mt-1 mb-4">Dados coletados e prontos para processamento.</p>
                  <div className="text-left bg-white p-3 rounded-lg text-[10px] space-y-1">
                    <p><strong>M1 (Esquerda):</strong> {measurements.breast1?.temperature}°C | {measurements.breast1?.heartRate} BPM</p>
                    <p><strong>M2 (Direita):</strong> {measurements.breast2?.temperature}°C | {measurements.breast2?.heartRate} BPM</p>
                  </div>
                  <button
                    onClick={() => setMeasuringPhase('idle')}
                    className="mt-4 text-xs font-bold text-green-600 hover:underline"
                  >
                    Repetir Medição
                  </button>
                </div>
              ) : (
                <div className="relative overflow-hidden p-6 rounded-2xl bg-[#F0F4FF] border border-blue-200">
                  {/* Progress Bar */}
                  <div className="absolute top-0 left-0 h-1 bg-blue-600 transition-all duration-1000" style={{ width: `${(timer / 10) * 100}%` }}></div>

                  <div className="text-center">
                    <div className="text-5xl font-black text-blue-600 mb-4 tabular-nums">
                      {timer}s
                    </div>

                    <div className="space-y-2">
                      {measuringPhase === 'breast1' && (
                        <div className="animate-pulse">
                          <h3 className="font-bold text-blue-900 uppercase tracking-widest text-xs">A Medir: Primeira Mama</h3>
                          <p className="text-[10px] text-blue-600">Mantenha o sensor na posição indicada.</p>
                        </div>
                      )}
                      {measuringPhase === 'transition' && (
                        <div className="text-pink-600">
                          <h3 className="font-bold uppercase tracking-widest text-xs">Mude para a Outra Mama</h3>
                          <p className="text-[10px]">Aguardando posicionamento...</p>
                        </div>
                      )}
                      {measuringPhase === 'breast2' && (
                        <div className="animate-pulse">
                          <h3 className="font-bold text-blue-900 uppercase tracking-widest text-xs">A Medir: Segunda Mama</h3>
                          <p className="text-[10px] text-blue-600">Quase concluído...</p>
                        </div>
                      )}
                    </div>

                    <div className="mt-6 flex justify-center">
                      <div className="w-12 h-12 rounded-full border-4 border-blue-600 border-t-transparent animate-spin"></div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <IoTSensors onSensorData={handleSensorData} />

            {/* Avaliação por IA */}
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <h3 className="text-sm font-medium text-gray-600 mb-4">Avaliação por IA em Tempo Real</h3>

              <div className="mb-4">
                <div className="text-xs text-gray-500 mb-2">Nível de Urgência Estimado</div>
                <div className={`px-4 py-3 rounded-lg text-center font-bold text-lg ${urgency.color}`}>
                  {urgency.label}
                </div>
              </div>

              {/* Sintomas ativos */}
              <div className="space-y-2">
                {symptoms.filter(s => formData[s.key as keyof typeof formData]).map(s => (
                  <div key={s.key} className="flex items-center gap-2 text-xs text-gray-600">
                    <div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
                    <span>{s.label}</span>
                    <span className="ml-auto text-blue-600 font-medium">{s.weight}</span>
                  </div>
                ))}
                {!symptoms.some(s => formData[s.key as keyof typeof formData]) && (
                  <p className="text-xs text-gray-400 italic">Nenhum sintoma selecionado</p>
                )}
              </div>

              <p className="text-xs text-gray-500 mt-4 pt-4 border-t border-gray-100">
                Análise em tempo real baseada em sintomas e sinais vitais dos Sensores
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}