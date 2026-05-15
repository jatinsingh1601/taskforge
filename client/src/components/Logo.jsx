/**
 * TaskForge Logo — inline SVG so it inherits color and scales cleanly.
 * Usage: <Logo size={32} /> or <Logo className="w-8 h-8" showWordmark />
 */
export default function Logo({ size = 32, showWordmark = false, className = '', wordmarkClassName = '' }) {
  return (
    <div className={`inline-flex items-center gap-2.5 ${className}`}>
      <svg width={size} height={size} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" aria-label="TaskForge">
        <rect width="48" height="48" rx="10" className="fill-ink-900 dark:fill-forge-500" />
        {/* Stylized 'T' */}
        <path d="M10 13h22v4.5h-8.75V35h-4.5V17.5H10z" fill="#fff" />
        {/* Orange check pill */}
        <circle cx="34" cy="32" r="6.5" className="fill-forge-500 dark:fill-white" />
        <path d="M31 32l2 2 4-4" className="stroke-white dark:stroke-ink-900" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      {showWordmark && (
        <span className={`font-bold text-lg tracking-tight ${wordmarkClassName || 'text-ink-900 dark:text-white'}`}>
          Task<span className="text-forge-500">Forge</span>
        </span>
      )}
    </div>
  );
}
