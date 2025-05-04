
import React, { createContext, useContext, useState, useEffect } from 'react';
import { Alarm } from '../models/Alarm';
import { toast } from '@/components/ui/use-toast';
import { addDays, format, parse, isWithinInterval } from 'date-fns';

interface AlarmContextType {
  alarms: Alarm[];
  addAlarm: (alarm: Alarm) => void;
  updateAlarm: (alarm: Alarm) => void;
  deleteAlarm: (id: string) => void;
  toggleAlarmActive: (id: string) => void;
  snoozeAlarm: (id: string) => void;
  dismissAlarm: (id: string) => void;
  ringingAlarmId: string | null;
}

const AlarmContext = createContext<AlarmContextType | undefined>(undefined);

export const useAlarms = () => {
  const context = useContext(AlarmContext);
  if (!context) {
    throw new Error("useAlarms must be used within an AlarmProvider");
  }
  return context;
};

export const AlarmProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [alarms, setAlarms] = useState<Alarm[]>(() => {
    const savedAlarms = localStorage.getItem('alarms');
    return savedAlarms ? JSON.parse(savedAlarms) : [];
  });
  const [ringingAlarmId, setRingingAlarmId] = useState<string | null>(null);
  const [audioRef] = useState<HTMLAudioElement | null>(() => {
    if (typeof window !== 'undefined') {
      return new Audio('/alarm-sound.mp3');
    }
    return null;
  });

  // Save alarms to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('alarms', JSON.stringify(alarms));
  }, [alarms]);

  // Set up alarm checking interval
  useEffect(() => {
    const checkAlarms = () => {
      // Don't check for new alarms if one is already ringing
      if (ringingAlarmId) return;
      
      const now = new Date();
      const currentHour = now.getHours();
      const currentMinute = now.getMinutes();
      const currentDay = now.getDay(); // 0 for Sunday, 1 for Monday, etc.
      const currentDateString = format(now, 'dd-MM-yyyy');
      
      // Map days of week to alarm.days properties
      const dayMapping = [
        'sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'
      ];

      // Check each alarm
      for (const alarm of alarms) {
        if (!alarm.isActive) continue;
        
        // Convert alarm hour to 24-hour format
        let alarmHour = alarm.hour;
        if (alarm.ampm === 'PM' && alarm.hour !== 12) {
          alarmHour += 12;
        } else if (alarm.ampm === 'AM' && alarm.hour === 12) {
          alarmHour = 0;
        }
        
        // Check if the current time matches the alarm time
        if (currentHour === alarmHour && currentMinute === alarm.minute) {
          let shouldRing = false;
          
          // Check if day-based alarm should ring today
          if (alarm.days) {
            const dayProperty = dayMapping[currentDay] as keyof typeof alarm.days;
            if (alarm.days[dayProperty]) {
              shouldRing = true;
            }
          }
          
          // Check if interval-based alarm should ring today
          else if (alarm.interval) {
            try {
              const startDate = parse(alarm.interval.startDate, 'yyyy-MM-dd', new Date());
              const diffInDays = Math.floor((now.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
              
              // If today is the start date or a multiple of the interval days since the start date
              if (diffInDays === 0 || diffInDays % alarm.interval.days === 0) {
                shouldRing = true;
              }
            } catch (error) {
              console.error("Error calculating interval:", error);
            }
          }
          
          if (shouldRing) {
            triggerAlarm(alarm.id);
            break; // Only trigger one alarm at a time
          }
        }
      }
    };
    
    // Check alarms every minute
    const intervalId = setInterval(checkAlarms, 60000);
    
    // Also check immediately when component mounts or alarms change
    checkAlarms();
    
    return () => clearInterval(intervalId);
  }, [alarms, ringingAlarmId, audioRef]);

  // Handle playing alarm sound
  useEffect(() => {
    if (ringingAlarmId && audioRef) {
      audioRef.loop = true;
      audioRef.play().catch(err => console.error("Could not play alarm sound:", err));
      
      // Request notification permission and show notification
      if (Notification && Notification.permission !== "granted") {
        Notification.requestPermission();
      }
      
      if (Notification && Notification.permission === "granted") {
        const alarm = alarms.find(a => a.id === ringingAlarmId);
        if (alarm) {
          new Notification("Alarm", {
            body: alarm.label,
            icon: "/favicon.ico",
            vibrate: alarm.vibrate ? [200, 100, 200] : undefined,
          });
        }
      }
      
      // Vibrate device if supported and enabled for this alarm
      const alarm = alarms.find(a => a.id === ringingAlarmId);
      if (alarm?.vibrate && navigator.vibrate) {
        // Vibrate pattern: vibrate for 500ms, pause for 200ms, repeat
        navigator.vibrate([500, 200, 500]);
      }
    } else if (audioRef) {
      audioRef.pause();
      audioRef.currentTime = 0;
      
      // Stop vibration if it was started
      if (navigator.vibrate) {
        navigator.vibrate(0); // Stop vibration
      }
    }
    
    // Auto-dismiss after 5 minutes of ringing
    let timeoutId: number;
    if (ringingAlarmId) {
      timeoutId = window.setTimeout(() => {
        dismissAlarm(ringingAlarmId);
      }, 5 * 60 * 1000);
    }
    
    return () => {
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [ringingAlarmId, alarms, audioRef]);

  const triggerAlarm = (id: string) => {
    setRingingAlarmId(id);
    
    // Show toast
    toast({
      title: "Alarm",
      description: "Your alarm is ringing!",
    });
  };

  const snoozeAlarm = (id: string) => {
    const alarm = alarms.find(a => a.id === id);
    if (!alarm) return;
    
    setRingingAlarmId(null);
    
    // Stop audio and vibration
    if (audioRef) {
      audioRef.pause();
      audioRef.currentTime = 0;
    }
    
    if (navigator.vibrate) {
      navigator.vibrate(0);
    }
    
    // Schedule to ring again after snooze duration
    if (alarm.snooze) {
      toast({
        title: "Alarm Snoozed",
        description: `Will ring again in ${alarm.snoozeDuration} minutes`,
      });
      
      setTimeout(() => {
        triggerAlarm(id);
      }, alarm.snoozeDuration * 60 * 1000);
    }
  };

  const dismissAlarm = (id: string) => {
    setRingingAlarmId(null);
    
    // For one-time alarms, disable them after dismissal
    setAlarms(prevAlarms => {
      return prevAlarms.map(alarm => {
        if (alarm.id === id && !alarm.days && !alarm.interval) {
          return { ...alarm, isActive: false };
        }
        return alarm;
      });
    });
    
    // Stop audio and vibration
    if (audioRef) {
      audioRef.pause();
      audioRef.currentTime = 0;
    }
    
    if (navigator.vibrate) {
      navigator.vibrate(0);
    }
    
    toast({
      title: "Alarm Dismissed",
    });
  };

  const addAlarm = (alarm: Alarm) => {
    setAlarms(prevAlarms => [...prevAlarms, alarm]);
    toast({
      title: "Alarm created",
      description: `Alarm set for ${alarm.hour}:${alarm.minute.toString().padStart(2, '0')} ${alarm.ampm}`,
    });
  };

  const updateAlarm = (updatedAlarm: Alarm) => {
    setAlarms(prevAlarms => 
      prevAlarms.map(alarm => 
        alarm.id === updatedAlarm.id ? updatedAlarm : alarm
      )
    );
    toast({
      title: "Alarm updated",
      description: `Alarm for ${updatedAlarm.hour}:${updatedAlarm.minute.toString().padStart(2, '0')} ${updatedAlarm.ampm} has been updated`,
    });
  };

  const deleteAlarm = (id: string) => {
    setAlarms(prevAlarms => prevAlarms.filter(alarm => alarm.id !== id));
    toast({
      title: "Alarm deleted",
      description: "The alarm has been deleted",
    });
  };

  const toggleAlarmActive = (id: string) => {
    setAlarms(prevAlarms => 
      prevAlarms.map(alarm => 
        alarm.id === id ? { ...alarm, isActive: !alarm.isActive } : alarm
      )
    );
  };

  return (
    <AlarmContext.Provider value={{ 
      alarms, 
      addAlarm, 
      updateAlarm, 
      deleteAlarm, 
      toggleAlarmActive,
      snoozeAlarm,
      dismissAlarm,
      ringingAlarmId
    }}>
      {ringingAlarmId && <AlarmModal alarmId={ringingAlarmId} />}
      {children}
    </AlarmContext.Provider>
  );
};

// Component for the alarm modal
const AlarmModal: React.FC<{ alarmId: string }> = ({ alarmId }) => {
  const { alarms, snoozeAlarm, dismissAlarm } = useAlarms();
  const alarm = alarms.find(a => a.id === alarmId);

  if (!alarm) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-11/12 max-w-md">
        <div className="text-center">
          <h2 className="text-3xl font-bold">{alarm.hour}:{alarm.minute.toString().padStart(2, '0')} {alarm.ampm}</h2>
          <p className="text-xl font-medium mt-2">{alarm.label}</p>
          
          <div className="flex items-center justify-center space-x-4 mt-8">
            {alarm.snooze && (
              <button 
                onClick={() => snoozeAlarm(alarmId)}
                className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium py-3 px-6 rounded-full"
              >
                Snooze ({alarm.snoozeDuration} min)
              </button>
            )}
            
            <button 
              onClick={() => dismissAlarm(alarmId)}
              className="bg-blue-500 hover:bg-blue-600 text-white font-medium py-3 px-6 rounded-full"
            >
              Dismiss
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
