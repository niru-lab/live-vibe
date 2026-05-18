import StaggeredChips from '../StaggeredChips';

const DRINKS = [
  { emoji: '🍺', label: 'Bier' },
  { emoji: '🍷', label: 'Wein' },
  { emoji: '🍹', label: 'Cocktails' },
  { emoji: '🥃', label: 'Shots' },
  { emoji: '🥃', label: 'Whiskey' },
  { emoji: '🍸', label: 'Gin Tonic' },
  { emoji: '🧉', label: 'Mate' },
  { emoji: '🍾', label: 'Prosecco' },
  { emoji: '🍾', label: 'Champagner' },
  { emoji: '🍶', label: 'Sake' },
  { emoji: '🧃', label: 'Alkoholfrei' },
  { emoji: '☕', label: 'Espresso Martini' },
  { emoji: '🍒', label: 'Aperol Spritz' },
  { emoji: '🌶️', label: 'Tequila' },
  { emoji: '🥥', label: 'Pina Colada' },
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
