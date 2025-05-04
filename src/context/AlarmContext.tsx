
import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { Alarm } from '../models/Alarm';
import { toast } from '@/components/ui/use-toast';
import { addDays, format, parse, isWithinInterval } from 'date-fns';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

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
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Create audio element when component mounts
  useEffect(() => {
    if (typeof window !== 'undefined') {
      audioRef.current = new Audio('/alarm-sound.mp3');
      audioRef.current.loop = true;
      
      // Preload the audio file
      audioRef.current.load();
      
      // Add error event listener for debugging
      audioRef.current.addEventListener('error', (e) => {
        console.error("Audio error:", e);
      });
    }
    
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = '';
      }
    };
  }, []);

  // Save alarms to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('alarms', JSON.stringify(alarms));
  }, [alarms]);

  // Set up alarm checking interval - checking more frequently for precision
  useEffect(() => {
    const checkAlarms = () => {
      // Don't check for new alarms if one is already ringing
      if (ringingAlarmId) return;
      
      const now = new Date();
      const currentHour = now.getHours();
      const currentMinute = now.getMinutes();
      const currentDay = now.getDay(); // 0 for Sunday, 1 for Monday, etc.
      
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
          // One-time alarm
          else {
            shouldRing = true;
          }
          
          if (shouldRing) {
            triggerAlarm(alarm.id);
            break; // Only trigger one alarm at a time
          }
        }
      }
    };
    
    // Check alarms every 1 second for better precision
    const intervalId = setInterval(checkAlarms, 1000);
    
    // Also check immediately when component mounts or alarms change
    checkAlarms();
    
    return () => clearInterval(intervalId);
  }, [alarms, ringingAlarmId]);

  // Handle playing alarm sound
  useEffect(() => {
    if (ringingAlarmId && audioRef.current) {
      const alarm = alarms.find(a => a.id === ringingAlarmId);
      
      if (alarm) {
        try {
          // Stop any current playback and reset
          audioRef.current.pause();
          audioRef.current.currentTime = 0;
          
          // Set the correct sound file and ensure it's an absolute URL
          const soundPath = alarm.sound || '/alarm-sound.mp3';
          audioRef.current.src = soundPath.startsWith('/') ? soundPath : `/${soundPath}`;
          
          audioRef.current.loop = true;
          
          // Play with promise handling for better error reporting
          const playPromise = audioRef.current.play();
          
          if (playPromise !== undefined) {
            playPromise.catch(error => {
              console.error("Could not play alarm sound:", error);
            });
          }
        } catch (err) {
          console.error("Error playing alarm sound:", err);
        }
      
        // Request notification permission and show notification
        if (Notification && Notification.permission !== "granted") {
          Notification.requestPermission();
        }
        
        if (Notification && Notification.permission === "granted") {
          new Notification("Alarm", {
            body: alarm.label,
            icon: "/favicon.ico"
          });
        }
        
        // Vibrate device if supported and enabled for this alarm
        if (alarm?.vibrate && navigator.vibrate) {
          // Vibrate pattern: vibrate for 500ms, pause for 200ms, repeat
          navigator.vibrate([500, 200, 500]);
        }
      }
    } else if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      
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
  }, [ringingAlarmId, alarms]);

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
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
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
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
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
      {ringingAlarmId && <MobileResponsiveAlarmModal alarmId={ringingAlarmId} />}
      {children}
    </AlarmContext.Provider>
  );
};

// Component for the alarm modal that's mobile-friendly
const MobileResponsiveAlarmModal: React.FC<{ alarmId: string }> = ({ alarmId }) => {
  const { alarms, snoozeAlarm, dismissAlarm } = useAlarms();
  const alarm = alarms.find(a => a.id === alarmId);

  if (!alarm) return null;

  // Using Sheet component from shadcn/ui for better mobile experience
  return (
    <Sheet open={true} modal={true}>
      <SheetContent side="bottom" className="h-auto rounded-t-3xl">
        <SheetHeader>
          <SheetTitle className="text-3xl font-bold mt-6">
            {alarm.hour}:{alarm.minute.toString().padStart(2, '0')} {alarm.ampm}
          </SheetTitle>
          <SheetDescription className="text-xl font-medium">
            {alarm.label}
          </SheetDescription>
        </SheetHeader>
        
        <div className="flex items-center justify-center space-x-4 mt-10 mb-8">
          {alarm.snooze && (
            <button 
              onClick={() => snoozeAlarm(alarmId)}
              className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium py-4 px-8 rounded-full text-lg"
            >
              Snooze ({alarm.snoozeDuration} min)
            </button>
          )}
          
          <button 
            onClick={() => dismissAlarm(alarmId)}
            className="bg-blue-500 hover:bg-blue-600 text-white font-medium py-4 px-8 rounded-full text-lg"
          >
            Dismiss
          </button>
        </div>
      </SheetContent>
    </Sheet>
  );
};
