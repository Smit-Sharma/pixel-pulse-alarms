
import React from 'react';
import { Alarm } from '@/models/Alarm';
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { useNavigate } from 'react-router-dom';
import { useAlarms } from '@/context/AlarmContext';
import { formatDistanceToNow, format, parse, addDays } from 'date-fns';

interface AlarmItemProps {
  alarm: Alarm;
}

const AlarmItem: React.FC<AlarmItemProps> = ({ alarm }) => {
  const navigate = useNavigate();
  const { toggleAlarmActive, deleteAlarm } = useAlarms();
  
  const getDaysString = () => {
    if (!alarm.days) return '';
    
    const daysArray = [];
    if (alarm.days.monday) daysArray.push('Mon');
    if (alarm.days.tuesday) daysArray.push('Tue');
    if (alarm.days.wednesday) daysArray.push('Wed');
    if (alarm.days.thursday) daysArray.push('Thu');
    if (alarm.days.friday) daysArray.push('Fri');
    if (alarm.days.saturday) daysArray.push('Sat');
    if (alarm.days.sunday) daysArray.push('Sun');
    
    if (daysArray.length === 7) return 'Every day';
    if (daysArray.length === 0) return 'One time';
    if (daysArray.length === 5 && 
        alarm.days.monday && 
        alarm.days.tuesday && 
        alarm.days.wednesday && 
        alarm.days.thursday && 
        alarm.days.friday) return 'Weekdays';
    if (daysArray.length === 2 && 
        alarm.days.saturday && 
        alarm.days.sunday) return 'Weekends';
    
    return daysArray.join(', ');
  };
  
  const getIntervalString = () => {
    if (!alarm.interval) return '';
    
    if (alarm.interval.days === 1) {
      return 'Every day';
    } else {
      return `Every ${alarm.interval.days} days`;
    }
  };

  const getTimeString = () => {
    return `${alarm.hour}:${alarm.minute.toString().padStart(2, '0')} ${alarm.ampm}`;
  };

  const getNextAlarmTime = () => {
    try {
      if (alarm.interval && alarm.interval.startDate) {
        // For interval based alarms
        const startDate = parse(alarm.interval.startDate, 'dd-MM-yyyy', new Date());
        const now = new Date();
        const todayWithAlarmTime = new Date(
          now.getFullYear(),
          now.getMonth(),
          now.getDate(),
          alarm.ampm === "PM" && alarm.hour !== 12 ? alarm.hour + 12 : alarm.hour === 12 && alarm.ampm === "AM" ? 0 : alarm.hour,
          alarm.minute
        );
        
        // Calculate days since start date
        const diffDays = Math.floor((now.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
        
        // Calculate days until next occurrence
        const daysUntilNext = alarm.interval.days - (diffDays % alarm.interval.days);
        
        // If today's alarm has passed, add the interval
        const nextAlarm = addDays(todayWithAlarmTime, daysUntilNext);
        
        if (nextAlarm > now) {
          return `Rings in ${formatDistanceToNow(nextAlarm)}`;
        }
        return `Rings tomorrow`;
      } else if (alarm.days) {
        // For day-based alarms
        const now = new Date();
        const currentDay = now.getDay(); // 0 for Sunday, 1 for Monday, etc.
        const daysMapping = [
          alarm.days.sunday, // Sunday - 0
          alarm.days.monday, // Monday - 1
          alarm.days.tuesday, // Tuesday - 2
          alarm.days.wednesday, // Wednesday - 3
          alarm.days.thursday, // Thursday - 4
          alarm.days.friday, // Friday - 5
          alarm.days.saturday, // Saturday - 6
        ];
        
        // Check if any day is selected
        if (!daysMapping.some(day => day)) {
          // If no days selected, treat as one-time alarm for today
          const todayWithAlarmTime = new Date(
            now.getFullYear(),
            now.getMonth(),
            now.getDate(),
            alarm.ampm === "PM" && alarm.hour !== 12 ? alarm.hour + 12 : alarm.hour === 12 && alarm.ampm === "AM" ? 0 : alarm.hour,
            alarm.minute
          );
          
          if (todayWithAlarmTime > now) {
            return `Rings in ${formatDistanceToNow(todayWithAlarmTime)}`;
          }
          return `Rings tomorrow`;
        }
        
        // Find the next day the alarm will ring
        let daysUntilNextAlarm = 0;
        for (let i = 0; i < 7; i++) {
          const checkDay = (currentDay + i) % 7;
          if (daysMapping[checkDay]) {
            daysUntilNextAlarm = i;
            break;
          }
        }
        
        const nextAlarmDay = addDays(now, daysUntilNextAlarm);
        const nextAlarmTime = new Date(
          nextAlarmDay.getFullYear(),
          nextAlarmDay.getMonth(),
          nextAlarmDay.getDate(),
          alarm.ampm === "PM" && alarm.hour !== 12 ? alarm.hour + 12 : alarm.hour === 12 && alarm.ampm === "AM" ? 0 : alarm.hour,
          alarm.minute
        );
        
        if (daysUntilNextAlarm === 0 && nextAlarmTime < now) {
          // If the alarm for today has already passed, find the next occurrence
          for (let i = 1; i < 7; i++) {
            const checkDay = (currentDay + i) % 7;
            if (daysMapping[checkDay]) {
              const futureAlarmDay = addDays(now, i);
              return `Rings ${format(futureAlarmDay, 'EEEE')}`;
            }
          }
        }
        
        if (daysUntilNextAlarm === 0) {
          return `Rings today in ${formatDistanceToNow(nextAlarmTime)}`;
        } else if (daysUntilNextAlarm === 1) {
          return `Rings tomorrow`;
        }
        return `Rings ${format(nextAlarmDay, 'EEEE')}`;
      }
    } catch (error) {
      console.error("Error calculating next alarm time:", error);
    }
    
    return '';
  };

  return (
    <div className={`p-4 border rounded-lg mb-4 ${alarm.isActive ? 'border-blue-200 bg-blue-50' : 'border-gray-200 bg-gray-50'}`}>
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold">{getTimeString()}</h3>
          <p className="text-sm text-gray-600">{alarm.label}</p>
          <p className="text-xs text-gray-500">
            {alarm.days ? getDaysString() : getIntervalString()}
          </p>
          {alarm.isActive && (
            <p className="text-xs text-blue-600 mt-1">{getNextAlarmTime()}</p>
          )}
        </div>
        
        <div className="flex items-center space-x-2">
          <Switch 
            checked={alarm.isActive} 
            onCheckedChange={() => toggleAlarmActive(alarm.id)} 
          />
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => navigate(`/edit-alarm/${alarm.id}`)} 
          >
            Edit
          </Button>
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => deleteAlarm(alarm.id)} 
            className="text-red-500 hover:text-red-700"
          >
            Delete
          </Button>
        </div>
      </div>
    </div>
  );
};

export default AlarmItem;
