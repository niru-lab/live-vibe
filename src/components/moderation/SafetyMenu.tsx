import { useState } from 'react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { DotsThree, Flag, Prohibit } from '@phosphor-icons/react';
import { ReportDialog, type ReportTarget } from '@/components/moderation/ReportDialog';
import { BlockSheet } from '@/components/safety/BlockSheet';

interface BlockTarget {
  id: string;
  username: string;
  display_name?: string | null;
  avatar_url?: string | null;
}

interface SafetyMenuProps {
  targetType: ReportTarget;
  targetId: string;
  /** When provided, the menu also offers blocking this user. */
  blockTarget?: BlockTarget | null;
  onBlocked?: () => void;
  /** Optional custom trigger classes (defaults to a subtle icon button). */
  className?: string;
  label?: string;
  size?: 'sm' | 'icon';
}

/**
 * Shared UGC safety affordance: report + optional block.
 * Required on every user-generated surface for App Store / Play compliance.
 */
export const SafetyMenu = ({
  targetType,
  targetId,
  blockTarget,
  onBlocked,
  className,
  label = 'Melden oder blockieren',
  size = 'icon',
}: SafetyMenuProps) => {
  const [reportOpen, setReportOpen] = useState(false);
  const [blockOpen, setBlockOpen] = useState(false);

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size={size}
            aria-label={label}
            className={className ?? 'h-9 w-9 rounded-full'}
          >
            <DotsThree weight="bold" className="h-5 w-5" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="min-w-[190px]">
          <DropdownMenuItem className="gap-2 cursor-pointer" onClick={() => setReportOpen(true)}>
            <Flag weight="bold" className="h-4 w-4" />
            Melden
          </DropdownMenuItem>
          {blockTarget && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="gap-2 cursor-pointer text-destructive focus:text-destructive"
                onClick={() => setBlockOpen(true)}
              >
                <Prohibit weight="bold" className="h-4 w-4" />
                Blockieren
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      <ReportDialog
        open={reportOpen}
        onOpenChange={setReportOpen}
        targetType={targetType}
        targetId={targetId}
      />

      {blockTarget && (
        <BlockSheet
          open={blockOpen}
          onOpenChange={setBlockOpen}
          target={blockTarget}
          onBlocked={onBlocked}
        />
      )}
    </>
  );
};
