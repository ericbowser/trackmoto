import { useState, useEffect, useRef, useCallback } from 'react';
import * as Location from 'expo-location';

export type SpeedUnit   = 'mph' | 'kph';
export type GpsStatus   = 'idle' | 'acquiring' | 'active' | 'denied';

const MS_TO_MPH        = 2.23694;
const MS_TO_KPH        = 3.6;
const GAUGE_OVER_READ  = 0.10;   // bikes typically read ~10% high
const MAX_SAMPLES      = 600;    // ~5 min at 2 reads/sec

export function useGpsSpeed() {
  const [status,   setStatus]   = useState<GpsStatus>('idle');
  const [unit,     setUnit]     = useState<SpeedUnit>('mph');
  const [currentMs, setCurrentMs] = useState(0);
  const [topMs,    setTopMs]    = useState(0);
  const [samples,  setSamples]  = useState<number[]>([]);
  const [accuracy, setAccuracy] = useState<number | null>(null);
  const subRef = useRef<Location.LocationSubscription | null>(null);

  const toUnit = useCallback(
    (ms: number) => Math.max(0, ms) * (unit === 'mph' ? MS_TO_MPH : MS_TO_KPH),
    [unit],
  );

  const startTracking = async () => {
    setStatus('acquiring');

    const { status: perm } = await Location.requestForegroundPermissionsAsync();
    if (perm !== 'granted') {
      setStatus('denied');
      return;
    }

    subRef.current = await Location.watchPositionAsync(
      {
        accuracy:         Location.Accuracy.BestForNavigation,
        timeInterval:     500,
        distanceInterval: 0,
      },
      (loc) => {
        const ms = Math.max(0, loc.coords.speed ?? 0);
        setStatus('active');
        setCurrentMs(ms);
        setAccuracy(loc.coords.accuracy ?? null);
        setTopMs(prev => Math.max(prev, ms));
        setSamples(prev => [...prev.slice(-MAX_SAMPLES), ms]);
      },
    );
  };

  const stopTracking = () => {
    subRef.current?.remove();
    subRef.current = null;
    setStatus('idle');
    setCurrentMs(0);
    setAccuracy(null);
  };

  const resetSession = () => {
    setTopMs(0);
    setSamples([]);
  };

  // clean up subscription when component unmounts
  useEffect(() => () => { subRef.current?.remove(); }, []);

  // derived display values
  const current       = toUnit(currentMs);
  const top           = toUnit(topMs);
  const movingSamples = samples.filter(s => s > 0.5);          // ignore near-zero
  const avg           = movingSamples.length
    ? toUnit(movingSamples.reduce((a, b) => a + b, 0) / movingSamples.length)
    : 0;
  const gauge         = current * (1 + GAUGE_OVER_READ);
  const delta         = gauge - current;

  return {
    status,
    unit, setUnit,
    current, top, avg,
    gauge, delta,
    accuracy,
    isTracking: status === 'active' || status === 'acquiring',
    startTracking,
    stopTracking,
    resetSession,
  };
}
