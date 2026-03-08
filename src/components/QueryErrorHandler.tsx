import { useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { WifiSlash, ArrowClockwise } from '@phosphor-icons/react';

interface QueryErrorFallbackProps {
  message?: string;
  onRetry?: () => void;
}

export function QueryErrorFallback({ message = 'Daten konnten nicht geladen werden', onRetry }: QueryErrorFallbackProps) {
  const queryClient = useQueryClient();

  const handleRetry = () => {
    if (onRetry) {
      onRetry();
    } else {
      queryClient.invalidateQueries();
    }
  };

  return (
    <div className="flex flex-col items-center justify-center py-12 text-center px-4">
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
        <WifiSlash weight="thin" className="h-8 w-8 text-muted-foreground" />
      </div>
      <p className="mb-4 text-sm text-muted-foreground">{message}</p>
      <Button onClick={handleRetry} variant="outline" size="sm" className="gap-2">
        <ArrowClockwise weight="thin" className="h-4 w-4" />
        Erneut versuchen
      </Button>
    </div>
  );
}
