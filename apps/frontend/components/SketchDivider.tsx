export default function SketchDivider() {
  return (
    <div className="flex items-center h-2 w-full">
      <div className="flex-1 h-full bg-sage rounded-full" />
      <div className="w-10 h-full bg-highlight rounded-full ml-1" />
    </div>
  );
}