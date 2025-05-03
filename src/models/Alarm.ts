
export interface Alarm {
  id: string;
  hour: number;
  minute: number;
  ampm: "AM" | "PM";
  label: string;
  days: {
    sunday: boolean;
    monday: boolean;
    tuesday: boolean;
    wednesday: boolean;
    thursday: boolean;
    friday: boolean;
    saturday: boolean;
  } | null;
  interval: {
    days: number;
    startDate: string;
  } | null;
  isActive: boolean;
  vibrate: boolean;
  snooze: boolean;
  snoozeDuration: number;
}
