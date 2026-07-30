import { useReferralCapture } from '@/hooks/useReferral';

/** Headless: captures ?ref= and attributes the signup once a profile exists. */
export const ReferralCapture = () => {
  useReferralCapture();
  return null;
};
