import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Camera, PartyPopper, Images, Zap, Sparkles, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PostTypeSelectorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface PostTypeOption {
  id: 'moment-x' | 'event' | 'carousel';
  icon: React.ElementType;
  title: string;
  description: string;
  gradient: string;
  highlighted?: boolean;
  path: string;
}

const postTypes: PostTypeOption[] = [
  {
    id: 'moment-x',
    icon: Camera,
    title: 'Moment X',
    description: 'Foto + Musik – Der beste Moment der Party',
    gradient: 'from-primary to-accent',
    path: '/create',
  },
  {
    id: 'event',
    icon: PartyPopper,
    title: 'Neues Event',
    description: 'Erstelle ein komplettes Event mit allen Details',
    gradient: 'from-pink-500 to-orange-500',
    highlighted: true,
    path: '/events/create',
  },
  {
    id: 'carousel',
    icon: Images,
    title: 'Carousel',
    description: 'Bis zu 10 Fotos/Videos in einem Post',
    gradient: 'from-blue-500 to-cyan-500',
    path: '/create/carousel',
  },
];

export const PostTypeSelector = ({
  open,
  onOpenChange,
}: PostTypeSelectorProps) => {
  const navigate = useNavigate();
  const [selectedType, setSelectedType] = useState<string | null>(null);

  const handleSelect = (type: PostTypeOption) => {
    setSelectedType(type.id);
  };

  const handleContinue = () => {
    const selected = postTypes.find((t) => t.id === selectedType);
    if (selected) {
      onOpenChange(false);
      navigate(selected.path);
    }
  };

  const handleClose = () => {
    setSelectedType(null);
    onOpenChange(false);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="rounded-t-3xl px-4 pb-8 pt-4">
        <SheetHeader className="mb-6">
          <div className="mx-auto mb-2 h-1 w-12 rounded-full bg-muted" />
          <SheetTitle className="text-center font-display text-xl">
            Was möchtest du posten?
          </SheetTitle>
        </SheetHeader>

        <div className="space-y-3">
          {postTypes.map((type) => {
            const Icon = type.icon;
            const isSelected = selectedType === type.id;

            return (
              <button
                key={type.id}
                onClick={() => handleSelect(type)}
                className={cn(
                  'flex w-full items-center gap-4 rounded-2xl border-2 p-4 text-left transition-all',
                  isSelected
                    ? 'border-primary bg-primary/10'
                    : 'border-border/50 bg-card hover:border-primary/50 hover:bg-muted/50',
                  type.highlighted && !isSelected && 'border-pink-500/50 bg-pink-500/5'
                )}
              >
                <div
                  className={cn(
                    'flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br shadow-lg',
                    type.gradient
                  )}
                >
                  <Icon className="h-7 w-7 text-white" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-foreground">
                      {type.title}
                    </h3>
                    {type.highlighted && (
                      <span className="flex items-center gap-1 rounded-full bg-gradient-to-r from-pink-500 to-orange-500 px-2 py-0.5 text-xs font-medium text-white">
                        <Sparkles className="h-3 w-3" />
                        Empfohlen
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {type.description}
                  </p>
                </div>
                <div
                  className={cn(
                    'flex h-6 w-6 items-center justify-center rounded-full border-2 transition-all',
                    isSelected
                      ? 'border-primary bg-primary'
                      : 'border-muted-foreground/30'
                  )}
                >
                  {isSelected && (
                    <div className="h-2 w-2 rounded-full bg-white" />
                  )}
                </div>
              </button>
            );
          })}
        </div>

        {/* Social Cloud Preview */}
        <div className="mt-6 flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-primary/10 to-accent/10 p-3">
          <Zap className="h-5 w-5 text-primary" />
          <span className="text-sm font-medium text-foreground">
            +10 bis +25 Social Cloud Punkte
          </span>
        </div>

        <div className="mt-6 flex gap-3">
          <Button
            variant="outline"
            className="flex-1"
            onClick={handleClose}
          >
            <X className="mr-2 h-4 w-4" />
            Abbrechen
          </Button>
          <Button
            onClick={handleContinue}
            disabled={!selectedType}
            className="flex-1 bg-gradient-to-r from-primary to-accent"
          >
            Weiter
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
};
