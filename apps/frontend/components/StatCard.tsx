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
    <div className="border-2 border-ink/15 rounded-xl p-3 bg-paper shadow-sm">
      <div className="flex items-center gap-2.5">
        <div className={`shrink-0 w-7 h-7 rounded-full bg-sage-light flex items-center justify-center ${accentColor}`}>
          {icon}
        </div>
        <p className="font-display font-bold text-lg text-ink leading-none">{value}</p>
      </div>
      <p className="text-[11px] text-inkSoft mt-1.5 leading-snug">{label}</p>
    </div>
  );
}