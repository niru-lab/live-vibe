import StaggeredChips from '../StaggeredChips';

const DRINKS = [
  { emoji: '🍺', label: 'Bier' },
  { emoji: '🍹', label: 'Cocktails' },
  { emoji: '🥃', label: 'Shots' },
  { emoji: '🍾', label: 'Prosecco / Sekt' },
  { emoji: '🧃', label: 'Alkoholfrei' },
  { emoji: '🤷', label: 'Kommt drauf an' },
];

interface Props {
  value: string;
  onChange: (v: string) => void;
}

export default function StepDrink({ value, onChange }: Props) {
  return (
    <StaggeredChips
      options={DRINKS}
      selected={value ? [value] : []}
      onToggle={(l) => onChange(value === l ? '' : l)}
    />
  );
}
