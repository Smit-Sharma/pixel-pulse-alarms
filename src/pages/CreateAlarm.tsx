
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import AlarmForm from '@/components/AlarmForm';
import { ArrowLeft } from 'lucide-react';

const CreateAlarm = () => {
  const navigate = useNavigate();
  
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
        <h1 className="text-2xl font-bold">New Alarm</h1>
      </div>
      
      <AlarmForm />
    </div>
  );
};

export default CreateAlarm;
