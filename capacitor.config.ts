
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
      importance: 5,
      channelName: "Alarm Notifications",
      channelDescription: "Notifications for alarms"
    },
    PushNotifications: {
      presentationOptions: ["badge", "sound", "alert"],
    },
    CapacitorHttp: {
      enabled: true
    },
    CapacitorCookies: {
      enabled: true
    },
    SplashScreen: {
      launchAutoHide: false,
      showSpinner: true,
      androidSpinnerStyle: "large",
      spinnerColor: "#488AFF",
      backgroundColor: "#FFFFFF",
      duration: 1000
    }
  },
  android: {
    allowMixedContent: true,
    captureInput: true,
    webContentsDebuggingEnabled: true,
    backgroundColor: "#FFFFFF"
  },
  ios: {
    contentInset: "always",
    backgroundColor: "#FFFFFF",
    allowsLinkPreview: false
  }
};

export default config;
