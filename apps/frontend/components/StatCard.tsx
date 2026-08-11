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
    <div className="border-2 border-ink/15 rounded-2xl p-5 bg-paper flex items-center gap-4 transition-all hover:-translate-y-1 hover:shadow-lg hover:border-sage">
      <div className={`shrink-0 w-11 h-11 rounded-full bg-sage-light flex items-center justify-center ${accentColor}`}>
        {icon}
      </div>
      <div className="min-w-0">
        <p className="font-display font-bold text-2xl text-ink leading-none">{value}</p>
        <p className="text-xs text-inkSoft mt-1 truncate">{label}</p>
      </div>
    </div>
  );
}