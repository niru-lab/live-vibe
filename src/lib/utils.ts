import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function getEventStatus(startsAt: string | Date, endsAt?: string | Date | null) {
  const now = Date.now();
  const start = new Date(startsAt).getTime();
  const end = endsAt ? new Date(endsAt).getTime() : null;

  if (now < start) {
    return { label: 'In Planung', color: 'bg-blue-500', variant: 'blue' as const };
  }
  if (end) {
    if (now <= end) return { label: 'Aktiv', color: 'bg-green-500', variant: 'green' as const };
    return { label: 'Done', color: 'bg-neutral-500', variant: 'neutral' as const };
  }
  // No end time: active on event day, done afterwards
  const startDay = new Date(startsAt).setHours(0, 0, 0, 0);
  const today = new Date().setHours(0, 0, 0, 0);
  if (today === startDay) return { label: 'Aktiv', color: 'bg-green-500', variant: 'green' as const };
  return { label: 'Done', color: 'bg-neutral-500', variant: 'neutral' as const };
}
