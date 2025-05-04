
import { LocalNotifications } from '@capacitor/local-notifications';
import { Alarm } from '@/models/Alarm';
import { format } from 'date-fns';

class AlarmService {
  // Request notification permissions
  async requestPermissions() {
    try {
      const { display } = await LocalNotifications.requestPermissions();
      return display === 'granted';
    } catch (error) {
      console.error('Error requesting notification permissions:', error);
      return false;
    }
  }

  // Schedule a local notification for an alarm
  async scheduleAlarmNotification(alarm: Alarm) {
    try {
      if (!alarm.isActive) return;
      
      // Convert alarm time to 24-hour format
      let hour = alarm.hour;
      if (alarm.ampm === 'PM' && hour !== 12) {
        hour += 12;
      } else if (alarm.ampm === 'AM' && hour === 12) {
        hour = 0;
      }
      
      // Create notification content
      const title = alarm.label || 'Alarm';
      const now = new Date();
      const notificationTime = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate(),
        hour,
        alarm.minute,
        0, // Set seconds to 0
        0  // Set milliseconds to 0
      );
      
      // If the time has passed for today, set it for tomorrow
      if (notificationTime < now) {
        notificationTime.setDate(notificationTime.getDate() + 1);
      }
      
      // Schedule local notification
      await LocalNotifications.schedule({
        notifications: [
          {
            id: parseInt(alarm.id.replace(/\D/g, '').substring(0, 8) || '1'),
            title,
            body: `${alarm.hour}:${alarm.minute.toString().padStart(2, '0')} ${alarm.ampm}`,
            schedule: { at: notificationTime },
            sound: alarm.sound || 'alarm-sound.mp3',
            actionTypeId: 'ALARM_ACTION',
            extra: {
              alarmId: alarm.id,
              sound: alarm.sound
            }
          }
        ]
      });
      
      return true;
    } catch (error) {
      console.error('Error scheduling alarm notification:', error);
      return false;
    }
  }
  
  // Cancel a scheduled notification
  async cancelAlarmNotification(alarmId: string) {
    try {
      const numericId = parseInt(alarmId.replace(/\D/g, '').substring(0, 8) || '1');
      await LocalNotifications.cancel({
        notifications: [{ id: numericId }]
      });
      return true;
    } catch (error) {
      console.error('Error canceling alarm notification:', error);
      return false;
    }
  }
}

export const alarmService = new AlarmService();
