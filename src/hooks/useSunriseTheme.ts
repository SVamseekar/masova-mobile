import { useState, useEffect, useRef } from 'react';
import * as Location from 'expo-location';
import SunCalc from 'suncalc';
import { ThemeMode } from '../styles/theme';

const getThemeForTime = (now: Date, sunrise: Date, sunset: Date): ThemeMode =>
  now >= sunrise && now < sunset ? 'light' : 'dark';

export const useSunriseTheme = (): ThemeMode => {
  const [mode, setMode] = useState<ThemeMode>('dark');
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    let cancelled = false;

    const scheduleSwitch = (targetTime: Date, nextMode: ThemeMode) => {
      if (timerRef.current) clearTimeout(timerRef.current);
      const delay = targetTime.getTime() - Date.now();
      if (delay > 0) {
        timerRef.current = setTimeout(() => {
          if (!cancelled) setMode(nextMode);
        }, delay);
      }
    };

    const init = async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (cancelled) return;

      if (status !== 'granted') {
        // Fallback: simple 6am-8pm light window
        const now = new Date();
        const hour = now.getHours();
        setMode(hour >= 6 && hour < 20 ? 'light' : 'dark');
        return;
      }

      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Low });
      if (cancelled) return;

      const { latitude, longitude } = loc.coords;
      const now = new Date();
      const times = SunCalc.getTimes(now, latitude, longitude);

      setMode(getThemeForTime(now, times.sunrise, times.sunset));

      // Schedule today's remaining switch
      if (now < times.sunrise) {
        scheduleSwitch(times.sunrise, 'light');
      } else if (now < times.sunset) {
        scheduleSwitch(times.sunset, 'dark');
      } else {
        // After sunset: schedule tomorrow's sunrise
        const tomorrow = new Date(now);
        tomorrow.setDate(tomorrow.getDate() + 1);
        const tomorrowTimes = SunCalc.getTimes(tomorrow, latitude, longitude);
        scheduleSwitch(tomorrowTimes.sunrise, 'light');
      }
    };

    init();

    return () => {
      cancelled = true;
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  return mode;
};
