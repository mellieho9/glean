const steps = [
  { label: "Connect", number: 1 },
  { label: "Configure", number: 2 },
  { label: "Finish", number: 3 },
];

export default function ProgressSteps({ currentStep = 1 }) {
  return (
    <div className="flex items-center justify-center mb-16">
      <div className="flex items-center w-full max-w-md">
        {steps.map((step, i) => (
          <div key={step.number} className="flex items-center flex-1 last:flex-none">
            <div className="relative flex flex-col items-center">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold text-sm ${
                  step.number <= currentStep
                    ? "bg-primary text-white"
                    : "bg-slate-100 text-slate-400"
                }`}
              >
                {step.number}
              </div>
              <span
                className={`absolute -bottom-7 text-xs font-medium whitespace-nowrap ${
                  step.number <= currentStep
                    ? "text-primary"
                    : "text-slate-400"
                }`}
              >
                {step.label}
              </span>
            </div>
            {i < steps.length - 1 && (
              <div className="flex-1 h-0.5 bg-slate-100 mx-2" />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
