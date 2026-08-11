export default function StatCard({
  label,
  value,
  icon,
  accentColor = "text-sage",
}: {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  accentColor?: string;
}) {
  return (
    <div className="border-2 border-ink/15 rounded-2xl p-4 sm:p-5 bg-paper shadow-sm transition-all hover:-translate-y-1 hover:shadow-lg hover:border-sage">
      <div className="flex items-center gap-3 sm:gap-4">
        <div className={`shrink-0 w-9 h-9 sm:w-11 sm:h-11 rounded-full bg-sage-light flex items-center justify-center ${accentColor}`}>
          {icon}
        </div>
        <div className="min-w-0">
          <p className="font-display font-bold text-xl sm:text-2xl text-ink leading-none">{value}</p>
        </div>
      </div>
      <p className="text-xs text-inkSoft mt-2 leading-snug">{label}</p>
    </div>
  );
}