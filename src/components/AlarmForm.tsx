
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
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

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
  
  const today = format(new Date(), 'yyyy-MM-dd');
  
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
    existingAlarm?.interval?.startDate || today
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
  
  const [sound, setSound] = useState<string>(
    existingAlarm?.sound || "/alarm-sound.mp3"
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

  // Generate arrays for time scrolling
  const hours = Array.from({ length: 12 }, (_, i) => i + 1);
  const minutes = Array.from({ length: 60 }, (_, i) => i);

  // Available alarm sounds
  const alarmSounds = [
    { value: "/alarm-sound.mp3", label: "Default" },
    { value: "/alarm-sound.mp3", label: "Classic" },
    { value: "/alarm-sound.mp3", label: "Digital" }
  ];

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
      snoozeDuration,
      sound
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
            {/* Hour Scroll Picker */}
            <div className="flex flex-col items-center">
              <ScrollArea className="h-40 w-16 rounded-md border">
                <div className="p-4">
                  {hours.map((h) => (
                    <div 
                      key={h} 
                      className={`py-2 text-center cursor-pointer ${h === hour ? 'text-4xl font-bold text-blue-500' : 'text-gray-400 hover:text-gray-600'}`}
                      onClick={() => setHour(h)}
                    >
                      {h}
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </div>
            
            <div className="text-4xl font-bold text-blue-500">:</div>
            
            {/* Minute Scroll Picker */}
            <div className="flex flex-col items-center">
              <ScrollArea className="h-40 w-16 rounded-md border">
                <div className="p-4">
                  {minutes.map((m) => (
                    <div 
                      key={m} 
                      className={`py-2 text-center cursor-pointer ${m === minute ? 'text-4xl font-bold text-blue-500' : 'text-gray-400 hover:text-gray-600'}`}
                      onClick={() => setMinute(m)}
                    >
                      {m.toString().padStart(2, '0')}
                    </div>
                  ))}
                </div>
              </ScrollArea>
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
              <button 
                onClick={() => toggleDay('sunday')} 
                className={`rounded-full w-10 h-10 flex items-center justify-center ${days.sunday ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
                disabled={currentTab !== "days"}
              >S</button>
              <button 
                onClick={() => toggleDay('monday')} 
                className={`rounded-full w-10 h-10 flex items-center justify-center ${days.monday ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
                disabled={currentTab !== "days"}
              >M</button>
              <button 
                onClick={() => toggleDay('tuesday')} 
                className={`rounded-full w-10 h-10 flex items-center justify-center ${days.tuesday ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
                disabled={currentTab !== "days"}
              >T</button>
              <button 
                onClick={() => toggleDay('wednesday')} 
                className={`rounded-full w-10 h-10 flex items-center justify-center ${days.wednesday ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
                disabled={currentTab !== "days"}
              >W</button>
              <button 
                onClick={() => toggleDay('thursday')} 
                className={`rounded-full w-10 h-10 flex items-center justify-center ${days.thursday ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
                disabled={currentTab !== "days"}
              >T</button>
              <button 
                onClick={() => toggleDay('friday')} 
                className={`rounded-full w-10 h-10 flex items-center justify-center ${days.friday ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
                disabled={currentTab !== "days"}
              >F</button>
              <button 
                onClick={() => toggleDay('saturday')} 
                className={`rounded-full w-10 h-10 flex items-center justify-center ${days.saturday ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
                disabled={currentTab !== "days"}
              >S</button>
            </div>
          </TabsContent>
          
          <TabsContent value="interval" className="mt-4">
            <div className="mb-4">
              <h3 className="mb-2">Repeat every:</h3>
              <div className="flex items-center justify-center">
                <button 
                  onClick={() => handleChangeIntervalDays(intervalDays - 1)}
                  className="px-3 py-1 bg-gray-200 rounded-l"
                  disabled={intervalDays <= 1 || currentTab !== "interval"}
                >
                  -
                </button>
                <div className="px-4 py-1 bg-white border-t border-b text-blue-500 font-semibold">
                  {intervalDays}
                </div>
                <button 
                  onClick={() => handleChangeIntervalDays(intervalDays + 1)}
                  className="px-3 py-1 bg-gray-200 rounded-r"
                  disabled={currentTab !== "interval"}
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
                disabled={currentTab !== "interval"}
                min={today}
              />
            </div>
          </TabsContent>
        </Tabs>
      </div>

      <div className="mb-4">
        <label className="block text-sm font-medium mb-1">Alarm Sound</label>
        <Select value={sound} onValueChange={setSound}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Select a sound" />
          </SelectTrigger>
          <SelectContent>
            {alarmSounds.map((sound) => (
              <SelectItem key={sound.value} value={sound.value}>
                {sound.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
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
