import VenueOfferingChips from '../VenueOfferingChips';

const OFFERINGS = [
  { label: 'Live-DJ',          emoji: '🎧' },
  { label: 'Live-Musik',       emoji: '🎸' },
  { label: 'Karaoke',          emoji: '🎤' },
  { label: 'Open Mic',         emoji: '🎙️' },
  { label: 'Kunst',            emoji: '🖼️' },
  { label: 'Yoga',             emoji: '🧘' },
  { label: 'Sport',            emoji: '🏃' },
  { label: 'Gaming',           emoji: '🎮' },
  { label: 'Speed-Dating',     emoji: '💕' },
  { label: 'Stammtisch',       emoji: '🍻' },
  { label: 'Food',             emoji: '👨‍🍳' },
  { label: 'Tanzkurs',         emoji: '💃' },
  { label: 'Brettspiele',      emoji: '🎲' },
  { label: 'Workshop',         emoji: '🛠️' },
  { label: 'Filme',            emoji: '🎬' },
  { label: 'Reading Club',     emoji: '📚' },
  { label: 'Comedy',           emoji: '🎭' },
  { label: 'Queer-Friendly',   emoji: '🌈' },
];

interface Props { value: string[]; onChange: (v: string[]) => void; }

export default function StepVenueOfferings({ value, onChange }: Props) {
  const toggle = (label: string) =>
    onChange(value.includes(label) ? value.filter((x) => x !== label) : [...value, label]);
  return <VenueOfferingChips options={OFFERINGS} selected={value} onToggle={toggle} max={8} />;
}
