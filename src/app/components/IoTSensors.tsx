import { Heart, Droplet, Thermometer, Wifi, WifiOff } from 'lucide-react';
import { useEffect, useState, useCallback } from 'react';
import { sensorsAPI } from '../services/api';

interface SensorData {
heartRate: number;
spo2: number;
temperature: number;
connected: boolean;
timestamp: string | null;
}

interface IoTSensorsProps {
onSensorData?: (data: SensorData) => void;
}

export function IoTSensors({ onSensorData }: IoTSensorsProps) {
const [sensorData, setSensorData] = useState<SensorData>({
heartRate: 0,
spo2: 0,
temperature: 0,
connected: false,
timestamp: null,
});
const [isConnected, setIsConnected] = useState(false);
const [isLoading, setIsLoading] = useState(true);

const fetchSensorData = useCallback(async () => {
try {
const data = await sensorsAPI.latest();

  setSensorData(prev => {
    // Só dispara callback e atualização de estado se os valores mudarem
    const changed = prev.heartRate !== data.heartRate || 
                    prev.spo2 !== data.spo2 || 
                    prev.temperature !== data.temperature ||
                    prev.connected !== data.connected;
    
    if (changed) {
      onSensorData?.(data);
      return data;
    }
    return prev;
  });

  setIsConnected(data.connected);
} catch {
  setIsConnected(false);
} finally {
  setIsLoading(false);
}

}, [onSensorData]);

useEffect(() => {
fetchSensorData();
const interval = setInterval(fetchSensorData, 3000);
return () => clearInterval(interval);
}, [fetchSensorData]);

const getHeartRateStatus = (hr: number) => {
if (hr < 60) return { label: 'Bradicardia', color: 'text-yellow-400' };
if (hr > 100) return { label: 'Taquicardia', color: 'text-red-400' };
return { label: 'Normal', color: 'text-green-400' };
};

const getSpo2Status = (spo2: number) => {
if (spo2 < 90) return { label: 'Crítico', color: 'text-red-400' };
if (spo2 < 95) return { label: 'Baixo', color: 'text-yellow-400' };
return { label: 'Normal', color: 'text-green-400' };
};

const getTempStatus = (temp: number) => {
if (temp < 36) return { label: 'Hipotermia', color: 'text-blue-300' };
if (temp > 37.5) return { label: 'Febre', color: 'text-red-400' };
return { label: 'Normal', color: 'text-green-400' };
};

const hrStatus = getHeartRateStatus(sensorData.heartRate);
const spo2Status = getSpo2Status(sensorData.spo2);
const tempStatus = getTempStatus(sensorData.temperature);

return (
<div className="bg-blue-600 text-white rounded-xl p-6">
<div className="flex items-center justify-between mb-4">
<h3 className="text-sm font-medium opacity-90">Monitorização de Sensores</h3>
<div className="flex items-center gap-1.5">
{isLoading ? (
<div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
) : isConnected ? (
<Wifi className="w-3.5 h-3.5 text-green-300" />
) : (
<WifiOff className="w-3.5 h-3.5 text-yellow-300" />
)}
<span className="text-xs opacity-75">
{isConnected ? 'Arduino Ativo' : 'Desconectado'}
</span>
</div>
</div>

  <div className="space-y-4">
    {/* Batimento Cardíaco */}
    <div className="bg-white/10 rounded-lg p-4">
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-2">
          <Heart className="w-4 h-4" />
          <span className="text-xs opacity-80">Batimento Cardíaco</span>
        </div>
        <span className={`text-xs font-medium ${hrStatus.color}`}>{hrStatus.label}</span>
      </div>
      <div className="text-3xl font-bold">{isConnected ? sensorData.heartRate : '--'}</div>
      <div className="text-xs opacity-70">bpm</div>
      {/* Mini barra visual */}
      <div className="mt-2 w-full bg-white/20 rounded-full h-1">
        <div
          className="bg-white h-1 rounded-full transition-all duration-500"
          style={{ width: isConnected ? `${Math.min(100, (sensorData.heartRate / 150) * 100)}%` : '0%' }}
        ></div>
      </div>
    </div>

    {/* SpO2 */}
    <div className="bg-white/10 rounded-lg p-4">
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-2">
          <Droplet className="w-4 h-4" />
          <span className="text-xs opacity-80">Saturação (SpO2)</span>
        </div>
        <span className={`text-xs font-medium ${spo2Status.color}`}>{spo2Status.label}</span>
      </div>
      <div className="text-3xl font-bold">{isConnected ? sensorData.spo2 : '--'}</div>
      <div className="text-xs opacity-70">%</div>
      <div className="mt-2 w-full bg-white/20 rounded-full h-1">
        <div
          className="bg-white h-1 rounded-full transition-all duration-500"
          style={{ width: isConnected ? `${sensorData.spo2}%` : '0%' }}
        ></div>
      </div>
    </div>

    {/* Temperatura */}
    <div className="bg-white/10 rounded-lg p-4">
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-2">
          <Thermometer className="w-4 h-4" />
          <span className="text-xs opacity-80">Temperatura</span>
        </div>
        <span className={`text-xs font-medium ${tempStatus.color}`}>{tempStatus.label}</span>
      </div>
      <div className="text-3xl font-bold">{isConnected ? sensorData.temperature.toFixed(1) : '--'}</div>

      <div className="text-xs opacity-70">°C</div>
      <div className="mt-2 w-full bg-white/20 rounded-full h-1">
        <div
          className="bg-white h-1 rounded-full transition-all duration-500"
          style={{ width: `${Math.min(100, ((sensorData.temperature - 35) / 5) * 100)}%` }}
        ></div>
      </div>
    </div>
  </div>

  <div className="mt-4 pt-4 border-t border-white/20">
    <div className="text-xs opacity-70 mb-1">Estado da Porta Serial</div>
    <div className="flex items-center gap-2">
      <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-400 animate-pulse' : 'bg-red-500'}`}></div>
      <span className="text-sm">
        {isConnected ? 'Arduino (Sincronizado)' : 'Nenhum dispositivo detectado'}
      </span>
    </div>
  </div>
</div>

);
}