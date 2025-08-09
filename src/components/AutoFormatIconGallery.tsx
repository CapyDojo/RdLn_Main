import React, { useState } from 'react';
import { Pilcrow, Sparkles, Wand2 } from 'lucide-react';

/**
 * AutoFormatIconGallery
 *
 * A quick visual mock showcasing four square-button options for the Auto Paragraph Formatting control:
 *  A. Pilcrow + corner sparkles (cluster)
 *  B. Wand + Pilcrow (action + target)
 *  C. Magic hat + Pilcrow (whimsical)
 *  D. Pilcrow with sparkle badge (clean)
 *
 * Each tile has its own ON/OFF toggle for quick comparison.
 */
export default function AutoFormatIconGallery() {
  return (
    <div className="p-6 space-y-6">
      <h2 className="text-2xl font-semibold text-theme-primary-900">Auto-format Icon Options</h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <VariantCard title="A · Pilcrow + Sparkles">
          <VariantA />
        </VariantCard>
        <VariantCard title="B · Wand + Pilcrow">
          <VariantB />
        </VariantCard>
        <VariantCard title="C · Magic Hat + Pilcrow">
          <VariantC />
        </VariantCard>
        <VariantCard title="D · Pilcrow + Sparkle Badge (clean)">
          <VariantD />
        </VariantCard>
      </div>
    </div>
  );
}

function VariantCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-white/20 dark:border-white/10 bg-white/60 dark:bg-white/5 p-4 backdrop-blur-sm shadow-sm">
      <div className="text-sm font-medium text-theme-neutral-700 dark:text-theme-neutral-200 mb-3">{title}</div>
      <div className="flex items-center gap-3 flex-wrap">{children}</div>
    </div>
  );
}

function useToggle(initial = true) {
  const [on, setOn] = useState(initial);
  return { on, setOn, toggle: () => setOn((p) => !p) };
}

// Shared square button style
function SquareButton({
  on,
  title,
  children,
}: {
  on: boolean;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      title={`${title} — ${on ? 'ON' : 'OFF'}`}
      aria-pressed={on}
      className={`relative flex items-center justify-center p-3 rounded-lg border transition-all duration-200 shadow-sm hover:shadow-md hover:scale-[1.02] active:scale-[0.98]
        ${on
          ? 'bg-theme-primary-600 dark:bg-theme-primary-500 border-transparent text-white'
          : 'bg-theme-neutral-200/70 dark:bg-white/10 border-transparent dark:border-white/10 text-theme-neutral-800 dark:text-theme-neutral-100'}
      `}
    >
      {children}
    </button>
  );
}

// A. Pilcrow + corner sparkles
function VariantA() {
  const { on, toggle } = useToggle(true);
  return (
    <SquareButton on={on} title="Magically fix broken PDF paragraphs" >
      <Pilcrow className={`w-5 h-5 ${on ? 'text-white' : 'text-theme-neutral-700 dark:text-theme-neutral-200'}`} />
      {/* corner sparkles */}
      <span className="absolute -top-0.5 -right-0.5 pointer-events-none">
        <Sparkles className={`w-4 h-4 ${on ? 'text-amber-200/90' : 'text-theme-neutral-400 dark:text-theme-neutral-300'}`} />
      </span>
      <button onClick={toggle} className="ml-3 px-2 py-1 text-xs rounded border border-white/20 dark:border-white/10 bg-white/60 dark:bg-white/10">
        {on ? 'ON' : 'OFF'}
      </button>
    </SquareButton>
  );
}

// B. Wand + Pilcrow
function VariantB() {
  const { on, toggle } = useToggle(true);
  return (
    <SquareButton on={on} title="Magically fix broken PDF paragraphs" >
      <div className="flex items-center gap-1">
        <Wand2 className={`w-4 h-4 ${on ? 'text-white' : 'text-theme-neutral-600 dark:text-theme-neutral-300'}`} />
        <Pilcrow className={`w-5 h-5 ${on ? 'text-white' : 'text-theme-neutral-700 dark:text-theme-neutral-200'}`} />
      </div>
      <button onClick={toggle} className="ml-3 px-2 py-1 text-xs rounded border border-white/20 dark:border-white/10 bg-white/60 dark:bg-white/10">
        {on ? 'ON' : 'OFF'}
      </button>
    </SquareButton>
  );
}

// C. Magic Hat + Pilcrow (using emoji hat for quick mock)
function VariantC() {
  const { on, toggle } = useToggle(true);
  return (
    <SquareButton on={on} title="Magically fix broken PDF paragraphs" >
      <Pilcrow className={`w-5 h-5 ${on ? 'text-white' : 'text-theme-neutral-700 dark:text-theme-neutral-200'}`} />
      <span className="absolute -bottom-1 -left-0.5 select-none" aria-hidden>
        <span className={`${on ? '' : 'opacity-80'} text-base`}>🎩</span>
      </span>
      {/* tiny stars emitted when ON */}
      {on && (
        <span className="absolute -top-0.5 right-1 text-amber-200/90 select-none" aria-hidden>✧</span>
      )}
      <button onClick={toggle} className="ml-3 px-2 py-1 text-xs rounded border border-white/20 dark:border-white/10 bg-white/60 dark:bg-white/10">
        {on ? 'ON' : 'OFF'}
      </button>
    </SquareButton>
  );
}

// D. Pilcrow with sparkle badge (clean)
function VariantD() {
  const { on, toggle } = useToggle(true);
  return (
    <SquareButton on={on} title="Magically fix broken PDF paragraphs" >
      <Pilcrow className={`w-5 h-5 ${on ? 'text-white' : 'text-theme-neutral-700 dark:text-theme-neutral-200'}`} />
      {/* small top-right badge */}
      <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full flex items-center justify-center bg-white/70 dark:bg-white/10 border border-white/40 dark:border-white/20">
        <Sparkles className={`w-2.5 h-2.5 ${on ? 'text-amber-400' : 'text-theme-neutral-500 dark:text-theme-neutral-300'}`} />
      </span>
      <button onClick={toggle} className="ml-3 px-2 py-1 text-xs rounded border border-white/20 dark:border-white/10 bg-white/60 dark:bg-white/10">
        {on ? 'ON' : 'OFF'}
      </button>
    </SquareButton>
  );
}
