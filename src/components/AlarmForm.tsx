
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Alarm } from '@/models/Alarm';
import { v4 as uuidv4 } from 'uuid';
import { format } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import { useAlarms } from '@/context/AlarmContext';

interface AlarmFormProps {
  existingAlarm?: Alarm;
  isEditing?: boolean;
}

const AlarmForm = ({ existingAlarm, isEditing = false }: AlarmFormProps) => {
  const navigate = useNavigate();
  const { addAlarm, updateAlarm } = useAlarms();
  const [currentTab, setCurrentTab] = useState<string>(
    existingAlarm?.days ? "days" : existingAlarm?.interval ? "interval" : "days"
  );
  
  const [hour, setHour] = useState<number>(existingAlarm?.hour || 7);
  const [minute, setMinute] = useState<number>(existingAlarm?.minute || 0);
  const [ampm, setAmpm] = useState<"AM" | "PM">(existingAlarm?.ampm || "AM");
  const [label, setLabel] = useState<string>(existingAlarm?.label || "Alarm");
  
  const [days, setDays] = useState({
    sunday: existingAlarm?.days?.sunday || false,
    monday: existingAlarm?.days?.monday || false,
    tuesday: existingAlarm?.days?.tuesday || false,
    wednesday: existingAlarm?.days?.wednesday || false,
    thursday: existingAlarm?.days?.thursday || false,
    friday: existingAlarm?.days?.friday || false,
    saturday: existingAlarm?.days?.saturday || false,
  });
  
  const [intervalDays, setIntervalDays] = useState<number>(
    existingAlarm?.interval?.days || 1
  );
  
  const [startDate, setStartDate] = useState<string>(
    existingAlarm?.interval?.startDate || format(new Date(), 'dd-MM-yyyy')
  );
  
  const [vibrate, setVibrate] = useState<boolean>(
    existingAlarm?.vibrate !== undefined ? existingAlarm.vibrate : true
  );
  
  const [snooze, setSnooze] = useState<boolean>(
    existingAlarm?.snooze !== undefined ? existingAlarm.snooze : true
  );
  
  const [snoozeDuration, setSnoozeDuration] = useState<number>(
    existingAlarm?.snoozeDuration || 5
  );

  const handleTabChange = (value: string) => {
    setCurrentTab(value);
  };

  const toggleDay = (day: keyof typeof days) => {
    setDays(prev => ({ ...prev, [day]: !prev[day] }));
  };

  const handleChangeIntervalDays = (value: number) => {
    setIntervalDays(Math.max(1, Math.min(30, value)));
  };

  const handleChangeSnoozeDuration = (value: number) => {
    setSnoozeDuration(Math.max(1, Math.min(30, value)));
  };

  const handleSubmit = () => {
    const newAlarm: Alarm = {
      id: existingAlarm?.id || uuidv4(),
      hour,
      minute,
      ampm,
      label,
      days: currentTab === "days" ? { ...days } : null,
      interval: currentTab === "interval" ? { days: intervalDays, startDate } : null,
      isActive: existingAlarm?.isActive !== undefined ? existingAlarm.isActive : true,
      vibrate,
      snooze,
      snoozeDuration
    };

    if (isEditing) {
      updateAlarm(newAlarm);
    } else {
      addAlarm(newAlarm);
    }

    navigate('/');
  };

  return (
    <div className="p-4 max-w-md mx-auto">
      <div className="mb-8 flex justify-center">
        <div className="text-center">
          <div className="flex items-center justify-center gap-1 mb-8">
            <div className="flex flex-col">
              <button onClick={() => setHour(prev => (prev < 12 ? prev + 1 : 1))} className="text-gray-400 hover:text-gray-600">
                {(hour === 12 ? 1 : hour + 1).toString().padStart(1, '0')}
              </button>
              <div className="text-4xl font-bold text-blue-500">{hour}</div>
              <button onClick={() => setHour(prev => (prev > 1 ? prev - 1 : 12))} className="text-gray-400 hover:text-gray-600">
                {(hour === 1 ? 12 : hour - 1).toString().padStart(1, '0')}
              </button>
            </div>
            
            <div className="text-4xl font-bold text-blue-500">:</div>
            
            <div className="flex flex-col">
              <button onClick={() => setMinute(prev => (prev < 59 ? prev + 1 : 0))} className="text-gray-400 hover:text-gray-600">
                {(minute === 59 ? 0 : minute + 1).toString().padStart(2, '0')}
              </button>
              <div className="text-4xl font-bold text-blue-500">{minute.toString().padStart(2, '0')}</div>
              <button onClick={() => setMinute(prev => (prev > 0 ? prev - 1 : 59))} className="text-gray-400 hover:text-gray-600">
                {(minute === 0 ? 59 : minute - 1).toString().padStart(2, '0')}
              </button>
            </div>
            
            <button 
              className="ml-4 bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold py-2 px-4 rounded"
              onClick={() => setAmpm(prev => prev === "AM" ? "PM" : "AM")}
            >
              {ampm}
            </button>
          </div>
        </div>
      </div>

      <div className="mb-4">
        <label className="block text-sm font-medium mb-1">Label</label>
        <Input 
          type="text" 
          value={label} 
          onChange={(e) => setLabel(e.target.value)}
          className="w-full"
          placeholder="Alarm label"
        />
      </div>
      
      <div className="mb-4">
        <Tabs value={currentTab} onValueChange={handleTabChange} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="days">Days</TabsTrigger>
            <TabsTrigger value="interval">Interval</TabsTrigger>
          </TabsList>
          
          <TabsContent value="days" className="mt-4">
            <div className="flex justify-between mb-6">
              <button onClick={() => toggleDay('sunday')} className={`rounded-full w-10 h-10 flex items-center justify-center ${days.sunday ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}>S</button>
              <button onClick={() => toggleDay('monday')} className={`rounded-full w-10 h-10 flex items-center justify-center ${days.monday ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}>M</button>
              <button onClick={() => toggleDay('tuesday')} className={`rounded-full w-10 h-10 flex items-center justify-center ${days.tuesday ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}>T</button>
              <button onClick={() => toggleDay('wednesday')} className={`rounded-full w-10 h-10 flex items-center justify-center ${days.wednesday ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}>W</button>
              <button onClick={() => toggleDay('thursday')} className={`rounded-full w-10 h-10 flex items-center justify-center ${days.thursday ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}>T</button>
              <button onClick={() => toggleDay('friday')} className={`rounded-full w-10 h-10 flex items-center justify-center ${days.friday ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}>F</button>
              <button onClick={() => toggleDay('saturday')} className={`rounded-full w-10 h-10 flex items-center justify-center ${days.saturday ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}>S</button>
            </div>
          </TabsContent>
          
          <TabsContent value="interval" className="mt-4">
            <div className="mb-4">
              <h3 className="mb-2">Repeat every:</h3>
              <div className="flex items-center justify-center">
                <button 
                  onClick={() => handleChangeIntervalDays(intervalDays - 1)}
                  className="px-3 py-1 bg-gray-200 rounded-l"
                  disabled={intervalDays <= 1}
                >
                  -
                </button>
                <div className="px-4 py-1 bg-white border-t border-b text-blue-500 font-semibold">
                  {intervalDays}
                </div>
                <button 
                  onClick={() => handleChangeIntervalDays(intervalDays + 1)}
                  className="px-3 py-1 bg-gray-200 rounded-r"
                >
                  +
                </button>
                <span className="ml-2">day{intervalDays !== 1 ? 's' : ''}</span>
              </div>
            </div>
            
            <div className="mb-4">
              <h3 className="mb-2">Starting from:</h3>
              <Input 
                type="date" 
                value={startDate} 
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full"
              />
            </div>
          </TabsContent>
        </Tabs>
      </div>
      
      <div className="mb-4 flex items-center justify-between">
        <span>Vibrate</span>
        <Switch checked={vibrate} onCheckedChange={setVibrate} />
      </div>
      
      <div className="mb-4 flex items-center justify-between">
        <span>Snooze</span>
        <Switch checked={snooze} onCheckedChange={setSnooze} />
      </div>
      
      {snooze && (
        <div className="mb-4">
          <h3 className="mb-2">Snooze duration</h3>
          <div className="flex items-center justify-center">
            <button 
              onClick={() => handleChangeSnoozeDuration(snoozeDuration - 1)}
              className="px-3 py-1 bg-gray-200 rounded-l"
              disabled={snoozeDuration <= 1}
            >
              -
            </button>
            <div className="px-4 py-1 bg-white border-t border-b text-blue-500 font-semibold">
              {snoozeDuration}
            </div>
            <button 
              onClick={() => handleChangeSnoozeDuration(snoozeDuration + 1)}
              className="px-3 py-1 bg-gray-200 rounded-r"
            >
              +
            </button>
            <span className="ml-2">minutes</span>
          </div>
        </div>
      )}
      
      <Button 
        onClick={handleSubmit} 
        className="w-full bg-blue-500 hover:bg-blue-600 text-white"
      >
        {isEditing ? "Update Alarm" : "Save Alarm"}
      </Button>
    </div>
  );
};

export default AlarmForm;
