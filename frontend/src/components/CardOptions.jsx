import Icon from "./Icon";

export default function CardOptions({ question, onSelect }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {question.options.map((opt) => (
        <button
          key={opt.value}
          onClick={() => onSelect(opt.value)}
          className={`flex flex-col items-center justify-center p-6 rounded-2xl transition-all cursor-pointer ${
            opt.selected
              ? "border-2 border-primary bg-indigo-50/50"
              : "border border-slate-200 hover:border-slate-300 hover:bg-slate-50"
          }`}
        >
          <Icon
            name={opt.icon}
            className={`mb-3 text-2xl ${opt.selected ? "text-primary" : "text-slate-400"}`}
          />
          <span
            className={`text-sm font-bold ${opt.selected ? "text-slate-900" : "text-slate-600"}`}
          >
            {opt.label}
          </span>
        </button>
      ))}
    </div>
  );
}
