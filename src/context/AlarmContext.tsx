
import React, { createContext, useContext, useState, useEffect } from 'react';
import { Alarm } from '../models/Alarm';
import { toast } from '@/components/ui/use-toast';

interface AlarmContextType {
  alarms: Alarm[];
  addAlarm: (alarm: Alarm) => void;
  updateAlarm: (alarm: Alarm) => void;
  deleteAlarm: (id: string) => void;
  toggleAlarmActive: (id: string) => void;
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

  useEffect(() => {
    localStorage.setItem('alarms', JSON.stringify(alarms));
  }, [alarms]);

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
    <AlarmContext.Provider value={{ alarms, addAlarm, updateAlarm, deleteAlarm, toggleAlarmActive }}>
      {children}
    </AlarmContext.Provider>
  );
};
