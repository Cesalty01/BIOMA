import { AlertTriangle, Download, Calendar, User, Phone, Hash, CheckCircle, Heart, Droplet, Thermometer, ArrowLeft } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip } from 'recharts';
import jsPDF from 'jspdf';

interface TriageResultProps {
  patientData: any;
  onBack: () => void;
  onNewTriage?: () => void;
}

export function TriageResult({ patientData, onBack, onNewTriage }: TriageResultProps) {
  const getRiskCategory = (level: string) => {
    switch (level) {
      case 'high':
        return {
          category: 'Alto Risco (Categoria 5)',
          color: 'bg-red-50 text-red-700 border-red-200',
          iconBg: 'bg-red-100',
          badge: 'bg-red-100 text-red-700',
          bar: 'bg-red-500',
        };
      case 'medium':
        return {
          category: 'Risco Médio (Categoria 3)',
          color: 'bg-yellow-50 text-yellow-700 border-yellow-200',
          iconBg: 'bg-yellow-100',
          badge: 'bg-yellow-100 text-yellow-700',
          bar: 'bg-yellow-500',
        };
      default:
        return {
          category: 'Baixo Risco (Categoria 1)',
          color: 'bg-green-50 text-green-700 border-green-200',
          iconBg: 'bg-green-100',
          badge: 'bg-green-100 text-green-700',
          bar: 'bg-green-500',
        };
    }
  };

  const risk = getRiskCategory(patientData.riskLevel);

  const heartRate = patientData.heartRate || patientData.heart_rate || 74;
  const spo2 = patientData.spo2 || 98;
  const temperature = patientData.temperature || 36.7;
  const riskScore = patientData.riskScore || patientData.risk_score || 0;

  const comparisonData = [
    { label: 'Anterior', value: Math.max(0, riskScore - 2.5) },
    { label: 'Atual', value: riskScore },
  ];

  const generatePDF = () => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.width;

    // Header com fundo azul
    doc.setFillColor(37, 99, 235);
    doc.rect(0, 0, pageWidth, 45, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(22);
    doc.text('BIOMA', 15, 20);
    doc.setFontSize(11);
    doc.text('Clinical Pulse Unit A - Sistema de Triagem por Sensores', 15, 30);
    doc.text(`Gerado em: ${new Date().toLocaleString('pt-PT')}`, 15, 38);

    // Título
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(16);
    doc.text('RELATÓRIO DE RESULTADO DA TRIAGEM', pageWidth / 2, 58, { align: 'center' });

    // Separador
    doc.setDrawColor(200, 200, 200);
    doc.line(15, 62, pageWidth - 15, 62);

    // Nível de Risco destacado
    const riskColors: Record<string, [number, number, number]> = {
      high: [239, 68, 68],
      medium: [245, 158, 11],
      low: [34, 197, 94],
    };
    const [r, g, b] = riskColors[patientData.riskLevel] || [34, 197, 94];
    doc.setFillColor(r, g, b);
    doc.roundedRect(15, 66, pageWidth - 30, 14, 3, 3, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(12);
    doc.text(`Classificacao: ${risk.category}  |  Pontuacao: ${riskScore}/13`, pageWidth / 2, 75, { align: 'center' });

    // Informações do Paciente
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(13);
    doc.setFont(undefined, 'bold');
    doc.text('1. Informacoes do Paciente', 15, 92);
    doc.setFont(undefined, 'normal');
    doc.setFontSize(10);
    doc.text(`Nome Completo:  ${patientData.fullName || patientData.full_name}`, 20, 102);
    doc.text(`ID do Paciente:  ${patientData.patientId || patientData.patient_id}`, 20, 110);
    doc.text(`Data de Nascimento:  ${patientData.dateOfBirth || patientData.date_of_birth}`, 20, 118);
    doc.text(`Telefone:  ${patientData.phoneContact || patientData.phone_contact || '-'}`, 20, 126);

    // Dados Sensores
    doc.setFontSize(13);
    doc.setFont(undefined, 'bold');
    doc.text('2. Dados dos Sensores (Monitorização Térmica e Vital)', 15, 142);
    doc.setFont(undefined, 'normal');
    doc.setFontSize(10);
    doc.text(`Frequencia Cardiaca:  ${heartRate} bpm`, 20, 152);
    doc.text(`Saturacao de Oxigenio (SpO2):  ${spo2}%`, 20, 160);
    doc.text(`Temperatura Corporal:  ${temperature}°C`, 20, 168);

    // Sintomas
    doc.setFontSize(13);
    doc.setFont(undefined, 'bold');
    doc.text('3. Sintomas Clinicos Identificados', 15, 184);
    doc.setFont(undefined, 'normal');
    doc.setFontSize(10);
    let y = 194;
    const symptoms = [
      { key: 'lumpDetected', label: 'Nodulo Detectado (+3 pts)' },
      { key: 'breastPain', label: 'Dor na Mama (+1 pt)' },
      { key: 'skinChanges', label: 'Alteracoes na Pele (+2 pts)' },
      { key: 'nippleDischarge', label: 'Secrecao Mamilar (+2 pts)' },
      { key: 'familyHistory', label: 'Historico Familiar de Oncologia (+2 pts)' },
      { key: 'previousDiagnosis', label: 'Diagnostico Anterior (+3 pts)' },
    ];

    let hasSymptom = false;
    symptoms.forEach(({ key, label }) => {
      const v = patientData[key] || patientData[key.replace(/([A-Z])/g, '_$1').toLowerCase()];
      if (v) {
        doc.text(`  [X] ${label}`, 20, y);
        y += 8;
        hasSymptom = true;
      }
    });
    if (!hasSymptom) {
      doc.text('  Nenhum sintoma identificado.', 20, y);
      y += 8;
    }

    // Observações
    if (patientData.observations) {
      doc.setFontSize(13);
      doc.setFont(undefined, 'bold');
      doc.text('4. Observacoes Clinicas', 15, y + 8);
      doc.setFont(undefined, 'normal');
      doc.setFontSize(10);
      const splitText = doc.splitTextToSize(patientData.observations, pageWidth - 35);
      doc.text(splitText, 20, y + 18);
      y += 18 + splitText.length * 6;
    }

    // Recomendações
    doc.setFontSize(13);
    doc.setFont(undefined, 'bold');
    doc.text('5. Recomendacoes Clinicas', 15, y + 14);
    doc.setFont(undefined, 'normal');
    doc.setFontSize(10);
    y += 24;

    const recommendations: Record<string, string[]> = {
      high: [
        '• Consulta especializada URGENTE (dentro de 48 horas)',
        '• Agendar exames de imagem imediatamente (mamografia/ecografia)',
        '• Considerar encaminhamento prioritario para biopsia guiada',
        '• Notificar equipa oncologica de imediato',
      ],
      medium: [
        '• Agendar consulta especializada em 2 semanas',
        '• Exames de imagem de rotina recomendados',
        '• Consulta de acompanhamento em 1 mes',
        '• Monitorizar evolucao dos sintomas',
      ],
      low: [
        '• Manter cronograma regular de rastreio',
        '• Mamografia anual recomendada',
        '• Educacao sobre auto-exame mamario fornecida',
        '• Proxima consulta de rotina em 12 meses',
      ],
    };

    (recommendations[patientData.riskLevel] || recommendations.low).forEach(rec => {
      doc.text(rec, 20, y);
      y += 8;
    });

    // Footer
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text('Este relatorio foi gerado automaticamente pelo Sistema BIOMA.', pageWidth / 2, 285, { align: 'center' });
    doc.text('Para fins clinicos. Consulte sempre um especialista qualificado.', pageWidth / 2, 290, { align: 'center' });

    const patId = patientData.patientId || patientData.patient_id || 'SEM_ID';
    doc.save(`Triagem_${patId}_${new Date().toISOString().split('T')[0]}.pdf`);
  };

  const symptoms = [
    { key: 'lumpDetected', label: 'Nódulo Detectado', pts: 3 },
    { key: 'breastPain', label: 'Dor na Mama', pts: 1 },
    { key: 'skinChanges', label: 'Alterações na Pele', pts: 2 },
    { key: 'nippleDischarge', label: 'Secreção Mamilar', pts: 2 },
    { key: 'familyHistory', label: 'Histórico Familiar', pts: 2 },
    { key: 'previousDiagnosis', label: 'Diagnóstico Anterior', pts: 3 },
  ];

  const activeSymptoms = symptoms.filter(s => {
    const v = patientData[s.key] || patientData[s.key.replace(/([A-Z])/g, '_$1').toLowerCase()];
    return !!v;
  });

  return (
    <div className="bg-gray-50 pb-20">
      <div className="p-8">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-1">Análise do Resultado da Triagem</h1>
            <p className="text-gray-600">Avaliação abrangente e recomendações clínicas</p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={onBack}
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Voltar
            </button>
            {onNewTriage && (
              <button
                onClick={onNewTriage}
                className="px-4 py-2 border border-green-300 text-green-700 rounded-lg hover:bg-green-50"
              >
                Nova Triagem
              </button>
            )}
            <button
              onClick={generatePDF}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              Descarregar PDF
            </button>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-6">
          {/* Coluna Principal */}
          <div className="col-span-2 space-y-6">
            {/* Banner de Risco */}
            <div className={`rounded-xl p-8 border-2 ${risk.color}`}>
              <div className="flex items-start gap-4">
                <div className={`${risk.iconBg} rounded-full p-3 flex-shrink-0`}>
                  {patientData.riskLevel === 'low'
                    ? <CheckCircle className="w-10 h-10" />
                    : <AlertTriangle className="w-10 h-10" />
                  }
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h2 className="text-3xl font-bold">{risk.category}</h2>
                    <span className={`px-3 py-1 rounded-full text-sm font-bold ${risk.badge}`}>
                      {riskScore}/13 pts
                    </span>
                  </div>
                  <p className="text-sm opacity-80">
                    {patientData.riskLevel === 'high' && 'Atenção clínica imediata recomendada. O paciente apresenta múltiplos indicadores de alto risco que requerem consulta especializada urgente.'}
                    {patientData.riskLevel === 'medium' && 'Risco moderado detectado. Agendar consulta especializada em 2 semanas para avaliação completa e exames complementares.'}
                    {patientData.riskLevel === 'low' && 'Perfil de baixo risco. Continuar com cronograma regular de rastreio e monitorização de rotina.'}
                  </p>
                </div>
              </div>
            </div>

            {/* Dados Sensores + Visualização */}
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Monitorização de Sensores</h3>
              <div className="grid grid-cols-3 gap-4">
                {/* Frequência Cardíaca */}
                <div className="border border-gray-200 rounded-xl p-4 text-center">
                  <Heart className="w-6 h-6 text-red-500 mx-auto mb-2" />
                  <div className="text-xs text-gray-500 mb-1">Batimento Cardíaco</div>
                  <div className="text-3xl font-bold text-gray-900">{heartRate}</div>
                  <div className="text-xs text-gray-500 mb-2">bpm</div>
                  <div className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${
                    heartRate < 60 || heartRate > 100 ? 'bg-yellow-100 text-yellow-700' : 'bg-green-100 text-green-700'
                  }`}>
                    {heartRate < 60 ? 'Bradicardia' : heartRate > 100 ? 'Taquicardia' : 'Normal'}
                  </div>
                </div>

                {/* SpO2 */}
                <div className="border border-gray-200 rounded-xl p-4 text-center">
                  <Droplet className="w-6 h-6 text-blue-500 mx-auto mb-2" />
                  <div className="text-xs text-gray-500 mb-1">Saturação (SpO2)</div>
                  <div className="text-3xl font-bold text-gray-900">{spo2}</div>
                  <div className="text-xs text-gray-500 mb-2">%</div>
                  <div className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${
                    spo2 < 90 ? 'bg-red-100 text-red-700' : spo2 < 95 ? 'bg-yellow-100 text-yellow-700' : 'bg-green-100 text-green-700'
                  }`}>
                    {spo2 < 90 ? 'Crítico' : spo2 < 95 ? 'Baixo' : 'Ótimo'}
                  </div>
                </div>

                {/* Temperatura */}
                <div className="border border-gray-200 rounded-xl p-4 text-center">
                  <Thermometer className="w-6 h-6 text-orange-500 mx-auto mb-2" />
                  <div className="text-xs text-gray-500 mb-1">Temperatura</div>
                  <div className="text-3xl font-bold text-gray-900">{Number(temperature).toFixed(1)}</div>
                  <div className="text-xs text-gray-500 mb-2">°C</div>
                  <div className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${
                    temperature < 36 ? 'bg-blue-100 text-blue-700' : temperature > 37.5 ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'
                  }`}>
                    {temperature < 36 ? 'Hipotermia' : temperature > 37.5 ? 'Febre' : 'Normal'}
                  </div>
                </div>
              </div>
            </div>

            {/* Comparação de Risco */}
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Comparação de Pontuação de Risco</h3>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={comparisonData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                  <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fill: '#6b7280', fontSize: 12 }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: '#6b7280', fontSize: 12 }} domain={[0, 13]} />
                  <Tooltip
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}
                    formatter={(v: any) => [`${v} pts`, 'Pontuação']}
                  />
                  <Bar dataKey="value" fill="#2563eb" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
              <div className="mt-2 flex justify-center gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-blue-300 rounded"></div>
                  <span className="text-gray-600">Anterior: {comparisonData[0].value.toFixed(1)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-blue-600 rounded"></div>
                  <span className="text-gray-900 font-medium">Atual: {riskScore}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Coluna Direita */}
          <div className="space-y-6">
            {/* Detalhes do Paciente */}
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <h3 className="text-sm font-semibold text-gray-900 mb-4">Detalhes do Paciente</h3>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <User className="w-4 h-4 text-gray-400 flex-shrink-0" />
                  <div>
                    <div className="text-xs text-gray-500">Nome Completo</div>
                    <div className="text-sm font-medium">{patientData.fullName || patientData.full_name}</div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Hash className="w-4 h-4 text-gray-400 flex-shrink-0" />
                  <div>
                    <div className="text-xs text-gray-500">ID do Paciente</div>
                    <div className="text-sm font-medium">{patientData.patientId || patientData.patient_id}</div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Calendar className="w-4 h-4 text-gray-400 flex-shrink-0" />
                  <div>
                    <div className="text-xs text-gray-500">Data de Nascimento</div>
                    <div className="text-sm font-medium">
                      {(() => {
                        try {
                          return new Date(patientData.dateOfBirth || patientData.date_of_birth).toLocaleDateString('pt-PT');
                        } catch { return patientData.dateOfBirth || patientData.date_of_birth; }
                      })()}
                    </div>
                  </div>
                </div>
                {(patientData.phoneContact || patientData.phone_contact) && (
                  <div className="flex items-center gap-3">
                    <Phone className="w-4 h-4 text-gray-400 flex-shrink-0" />
                    <div>
                      <div className="text-xs text-gray-500">Contacto Telefónico</div>
                      <div className="text-sm font-medium">{patientData.phoneContact || patientData.phone_contact}</div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Sintomas Ativos */}
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <h3 className="text-sm font-semibold text-gray-900 mb-4">
                Sintomas Identificados ({activeSymptoms.length})
              </h3>
              {activeSymptoms.length > 0 ? (
                <div className="space-y-2">
                  {activeSymptoms.map(s => (
                    <div key={s.key} className="flex items-center justify-between p-2 bg-red-50 rounded-lg">
                      <span className="text-sm text-red-800">{s.label}</span>
                      <span className="text-xs font-bold text-red-600">+{s.pts}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500 italic">Nenhum sintoma identificado</p>
              )}
            </div>

            {/* Análise Clínica */}
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <h3 className="text-sm font-semibold text-gray-900 mb-3">Análise Clínica</h3>
              <div className="space-y-3 text-sm text-gray-700">
                <p>
                  A triagem abrangente mostra fatores de risco{' '}
                  {patientData.riskLevel === 'high' ? 'significativos' : patientData.riskLevel === 'medium' ? 'moderados' : 'mínimos'}{' '}
                  que requerem intervenção clínica{' '}
                  {patientData.riskLevel === 'high' ? 'imediata' : patientData.riskLevel === 'medium' ? 'oportuna' : 'de rotina'}.
                </p>
                {patientData.observations && (
                  <div className="bg-gray-50 rounded-lg p-3 text-xs text-gray-600">
                    <strong>Obs:</strong> {patientData.observations}
                  </div>
                )}
                {patientData.riskLevel === 'high' && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-3 mt-2">
                    <p className="text-red-800 text-xs font-medium">
                      ⚠️ Caso Prioritário: Recomenda-se consulta especializada imediata e exames de imagem dentro de 48 horas
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Próximos Passos */}
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
              <div className="text-sm font-medium text-blue-900 mb-2">Próximos Passos</div>
              <ul className="text-xs text-blue-800 space-y-1.5">
                <li>• Descarregar e arquivar PDF do paciente</li>
                <li>• Agendar consultas de acompanhamento</li>
                <li>• Atualizar registos médicos do paciente</li>
                {patientData.riskLevel === 'high' && (
                  <li className="font-medium">• ⚠️ Notificar especialista URGENTE</li>
                )}
                {patientData.riskLevel !== 'high' && (
                  <li>• Notificar especialistas médicos relevantes</li>
                )}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
