interface FeyrnLogoProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const FeyrnLogo = ({ size = 'md', className = '' }: FeyrnLogoProps) => {
  const sizeClasses = {
    sm: 'text-base',
    md: 'text-lg',
    lg: 'text-2xl',
  };

  return (
    <span className={`font-display font-bold tracking-tight ${sizeClasses[size]} ${className}`}>
      <span className="text-foreground">feyr</span>
      <span className="text-[hsl(var(--neon-purple))]">n</span>
    </span>
  );
};
