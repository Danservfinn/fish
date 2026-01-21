'use client';

import { Sun, Moon, Monitor } from 'lucide-react';
import { useTheme } from './ThemeProvider';

interface ThemeToggleProps {
  variant?: 'icon' | 'pill' | 'dropdown';
  className?: string;
}

export function ThemeToggle({ variant = 'pill', className = '' }: ThemeToggleProps) {
  const { theme, setTheme, resolvedTheme } = useTheme();

  if (variant === 'icon') {
    return (
      <button
        onClick={() => setTheme(resolvedTheme === 'light' ? 'dark' : 'light')}
        className={`
          relative w-10 h-10 rounded-xl
          flex items-center justify-center
          bg-secondary/50 hover:bg-secondary
          border border-border/50
          transition-all duration-200
          ${className}
        `}
        aria-label={`Switch to ${resolvedTheme === 'light' ? 'dark' : 'light'} mode`}
      >
        <Sun
          className={`
            w-5 h-5 absolute
            transition-all duration-300
            ${resolvedTheme === 'light'
              ? 'opacity-100 rotate-0 scale-100'
              : 'opacity-0 -rotate-90 scale-75'
            }
          `}
          style={{ color: 'hsl(38 92% 50%)' }}
        />
        <Moon
          className={`
            w-5 h-5 absolute
            transition-all duration-300
            ${resolvedTheme === 'dark'
              ? 'opacity-100 rotate-0 scale-100'
              : 'opacity-0 rotate-90 scale-75'
            }
          `}
          style={{ color: 'hsl(220 70% 70%)' }}
        />
      </button>
    );
  }

  if (variant === 'pill') {
    return (
      <div
        className={`
          flex items-center gap-0.5 p-1
          rounded-xl
          bg-secondary/60 backdrop-blur-sm
          border border-border/50
          shadow-sm
          ${className}
        `}
      >
        <ThemePillButton
          active={theme === 'light'}
          onClick={() => setTheme('light')}
          icon={<Sun className="w-4 h-4" />}
          label="Light"
        />
        <ThemePillButton
          active={theme === 'dark'}
          onClick={() => setTheme('dark')}
          icon={<Moon className="w-4 h-4" />}
          label="Dark"
        />
        <ThemePillButton
          active={theme === 'system'}
          onClick={() => setTheme('system')}
          icon={<Monitor className="w-4 h-4" />}
          label="System"
        />
      </div>
    );
  }

  // Dropdown variant
  return (
    <div className={`relative ${className}`}>
      <button
        onClick={() => setTheme(resolvedTheme === 'light' ? 'dark' : 'light')}
        className="
          flex items-center gap-2 px-3 py-2
          rounded-lg
          bg-secondary/50 hover:bg-secondary
          border border-border/50
          transition-all
        "
      >
        {resolvedTheme === 'light' ? (
          <Sun className="w-4 h-4" style={{ color: 'hsl(38 92% 50%)' }} />
        ) : (
          <Moon className="w-4 h-4" style={{ color: 'hsl(220 70% 70%)' }} />
        )}
        <span className="text-sm font-medium capitalize">{resolvedTheme}</span>
      </button>
    </div>
  );
}

function ThemePillButton({
  active,
  onClick,
  icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`
        flex items-center justify-center
        w-9 h-9 rounded-lg
        transition-all duration-200
        ${active
          ? 'bg-background text-foreground shadow-sm'
          : 'text-muted-foreground hover:text-foreground hover:bg-background/50'
        }
      `}
      aria-label={`${label} theme`}
      title={label}
    >
      {icon}
    </button>
  );
}
