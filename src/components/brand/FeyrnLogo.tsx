import { Link } from 'react-router-dom';

interface FeyrnLogoProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  /** If false, renders as a plain span instead of a link to /feed */
  asLink?: boolean;
}

export const FeyrnLogo = ({ size = 'md', className = '', asLink = true }: FeyrnLogoProps) => {
  const sizeClasses = {
    sm: 'text-base',
    md: 'text-lg',
    lg: 'text-2xl',
  };

  const content = (
    <>
      <span className="text-foreground">feyr</span>
      <span className="text-[hsl(var(--neon-purple))]">n</span>
    </>
  );

  const classes = `font-display font-bold tracking-tight ${sizeClasses[size]} ${className}`;

  if (!asLink) {
    return <span className={classes}>{content}</span>;
  }

  return (
    <Link to="/" aria-label="Zum Feed" className={`${classes} cursor-pointer transition-opacity hover:opacity-80`}>
      {content}
    </Link>
  );
};
