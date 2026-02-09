export default function SelectOptions({ question, onSelect }) {
  return (
    <div className="space-y-4">
      {question.options.map((opt) => (
        <label
          key={opt.value}
          className={`relative flex items-center p-5 border rounded-2xl cursor-pointer transition-all ${
            opt.selected
              ? "border-primary bg-indigo-50/30"
              : "border-slate-200 hover:border-primary hover:bg-indigo-50/30"
          }`}
          onClick={() => onSelect(opt.value)}
        >
          <input
            type="radio"
            name={`question-${question.id}`}
            checked={opt.selected}
            readOnly
            className="w-5 h-5 text-primary border-slate-300 focus:ring-primary accent-primary"
          />
          <div className="ml-4">
            <span className="block text-sm font-bold text-slate-900">
              {opt.label}
            </span>
            <span className="block text-xs text-slate-500 mt-0.5">
              {opt.description}
            </span>
          </div>
        </label>
      ))}
    </div>
  );
}
