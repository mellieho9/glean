export default function ProgressBar({ step, totalSteps, label }) {
  const percent = Math.round((step / totalSteps) * 100);

  return (
    <div className="mb-12">
      <div className="flex items-center justify-between mb-4">
        <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary">
          Step {step} of {totalSteps}
        </span>
        <span className="text-xs font-medium text-slate-400">{label}</span>
      </div>
      <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
        <div
          className="h-full bg-primary rounded-full transition-all duration-500"
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
}
