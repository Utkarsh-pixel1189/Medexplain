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
    <div className="border-2 border-ink/15 rounded-2xl p-2.5 bg-paper shadow-sm min-w-0">
      <div className="flex items-center gap-2 min-w-0">
        <div className={`shrink-0 w-6 h-6 rounded-full bg-sage-light flex items-center justify-center ${accentColor}`}>
          {icon}
        </div>
        <p className="font-display font-bold text-base text-ink leading-none truncate">{value}</p>
      </div>
      <p className="text-[10px] text-inkSoft mt-1 leading-snug">{label}</p>
    </div>
  );
}