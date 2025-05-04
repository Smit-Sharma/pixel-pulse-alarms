
import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.lovable.66193db090e54b9fa3b61c05d06fe61f',
  appName: 'pixel-pulse-alarms',
  webDir: 'dist',
  server: {
    url: 'https://66193db0-90e5-4b9f-a3b6-1c05d06fe61f.lovableproject.com?forceHideBadge=true',
    cleartext: true
  },
  plugins: {
    LocalNotifications: {
      smallIcon: "ic_stat_alarm_notification",
      iconColor: "#488AFF",
      sound: "alarm-sound.mp3",
      importance: 4,
    },
    PushNotifications: {
      presentationOptions: ["badge", "sound", "alert"],
    }
  }
};

export default config;
