import StaggeredChips from '../StaggeredChips';

const ARTISTS = [
  'Bicep','Fred again..','FKA twigs','Peggy Gou','Charli XCX','Travis Scott',
  'Bad Bunny','Rosalía','Burna Boy','SZA','Drake','The Weeknd','Tame Impala',
  'Boys Noize','Skrillex','Daft Punk','Disclosure','Four Tet','Floating Points',
  'Aphex Twin','Nina Kraviz','Amelie Lens','Solomun','Black Coffee','Honey Dijon',
  'DJ Snake','Calvin Harris','Tiësto','David Guetta','Marshmello','Diplo',
  'Ayra Starr','Tyla','Asake','Wizkid','Davido','PartyNextDoor','21 Savage',
  'Central Cee','Stormzy','Dave','Aitch','RAYE','PinkPantheress','Doja Cat',
  'Olivia Rodrigo','Billie Eilish','Dua Lipa','Lana Del Rey','Mitski',
  'Phoebe Bridgers','Arctic Monkeys','The 1975','Fontaines D.C.','Idles',
];

interface Props {
  artist: string;
  onChange: (v: string) => void;
}

export default function StepArtist({ artist, onChange }: Props) {
  return (
    <StaggeredChips
      options={ARTISTS.map(a => ({ label: a }))}
      selected={artist ? [artist] : []}
      onToggle={(l) => onChange(artist === l ? '' : l)}
      allowCustom
      customPlaceholder="Eigenen Artist eintragen…"
    />
  );
}
