
import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import AlarmForm from '@/components/AlarmForm';
import { useAlarms } from '@/context/AlarmContext';
import { ArrowLeft } from 'lucide-react';

const EditAlarm = () => {
  const navigate = useNavigate();
  const { id } = useParams<{id: string}>();
  const { alarms } = useAlarms();
  
  const alarm = alarms.find(a => a.id === id);
  
  if (!alarm) {
    return (
      <div className="max-w-md mx-auto p-4">
        <div className="text-center py-10">
          <p className="text-gray-500 mb-4">Alarm not found</p>
          <Button 
            onClick={() => navigate('/')}
            className="bg-blue-500 hover:bg-blue-600"
          >
            Back to Alarms
          </Button>
        </div>
      </div>
    );
  }
  
  return (
    <div className="max-w-md mx-auto p-4">
      <div className="flex items-center mb-6">
        <Button 
          variant="ghost" 
          size="icon"
          onClick={() => navigate('/')}
          className="mr-2"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-2xl font-bold">Edit Alarm</h1>
      </div>
      
      <AlarmForm existingAlarm={alarm} isEditing={true} />
    </div>
  );
};

export default EditAlarm;
