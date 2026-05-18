import StaggeredChips from '../StaggeredChips';

const GENRES = ['Hip-Hop','House','Techno','R&B','Pop','Afrobeats','Drum & Bass','Reggaeton','Indie','Latin'];

interface Props {
  selected: string[];
  onChange: (v: string[]) => void;
}

export default function StepGenres({ selected, onChange }: Props) {
  const toggle = (g: string) => {
    onChange(selected.includes(g) ? selected.filter(x => x !== g) : [...selected, g]);
  };
  return (
    <StaggeredChips
      options={GENRES.map(g => ({ label: g }))}
      selected={selected}
      onToggle={toggle}
      multi
    />
  );
}
