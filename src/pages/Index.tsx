
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useAlarms } from '@/context/AlarmContext';
import AlarmItem from '@/components/AlarmItem';
import { Clock, Plus } from 'lucide-react';

const Index = () => {
  const navigate = useNavigate();
  const { alarms } = useAlarms();
  
  return (
    <div className="max-w-md mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center">
          <Clock className="w-6 h-6 mr-2" />
          <h1 className="text-2xl font-bold">Alarms</h1>
        </div>
        <Button 
          onClick={() => navigate('/create-alarm')}
          className="bg-blue-500 hover:bg-blue-600 rounded-full w-12 h-12 p-0 flex items-center justify-center"
        >
          <Plus className="w-6 h-6" />
        </Button>
      </div>
      
      {alarms.length === 0 ? (
        <div className="text-center py-10">
          <p className="text-gray-500 mb-4">No alarms set</p>
          <Button 
            onClick={() => navigate('/create-alarm')}
            className="bg-blue-500 hover:bg-blue-600"
          >
            Add Alarm
          </Button>
        </div>
      ) : (
        <div>
          {alarms.map(alarm => (
            <AlarmItem key={alarm.id} alarm={alarm} />
          ))}
        </div>
      )}
    </div>
  );
};

export default Index;
