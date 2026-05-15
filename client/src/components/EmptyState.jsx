export default function EmptyState({ icon: Icon, title, description, action }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-6 text-center">
      {Icon && (
        <div className="w-14 h-14 rounded-2xl bg-ink-100 dark:bg-ink-800 flex items-center justify-center mb-4">
          <Icon className="w-7 h-7 text-ink-400 dark:text-ink-500" strokeWidth={1.5} />
        </div>
      )}
      <h3 className="text-base font-semibold text-ink-900 dark:text-white">{title}</h3>
      {description && <p className="text-sm text-ink-500 dark:text-ink-400 mt-1 max-w-sm">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
