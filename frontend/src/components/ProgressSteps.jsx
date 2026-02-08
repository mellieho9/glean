import Icon from "./Icon";

const steps = [
  { label: "Connect", number: 0 },
  { label: "Select", number: 1 },
  { label: "Configure", number: 2 },
  { label: "Finish", number: 3 },
];

export default function ProgressSteps({ currentStep = 0 }) {
  return (
    <div className="flex items-center justify-center mb-16">
      <div className="flex items-center w-full max-w-md">
        {steps.map((step, i) => {
          const isCompleted = step.number < currentStep;
          const isCurrent = step.number === currentStep;

          return (
            <div key={step.number} className="flex items-center flex-1 last:flex-none">
              <div className="relative flex flex-col items-center">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center font-semibold text-xs ${
                    isCompleted
                      ? "bg-primary text-white"
                      : isCurrent
                        ? "bg-primary/15 text-primary"
                        : "bg-slate-100 text-slate-400"
                  }`}
                >
                  {isCompleted ? (
                    <Icon name="check" className="text-xs" />
                  ) : (
                    step.number + 1
                  )}
                </div>
                <span
                  className={`absolute -bottom-7 text-xs font-medium whitespace-nowrap ${
                    isCompleted || isCurrent
                      ? "text-primary"
                      : "text-slate-400"
                  }`}
                >
                  {step.label}
                </span>
              </div>
              {i < steps.length - 1 && (
                <div
                  className={`flex-1 h-0.5 mx-2 ${
                    step.number < currentStep ? "bg-primary" : "bg-slate-100"
                  }`}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
