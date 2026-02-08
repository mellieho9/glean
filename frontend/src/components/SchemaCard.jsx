import Icon from "./Icon";

export default function SchemaCard({ icon, iconElement, title, subtitle, onClick, action, disabled, centered, as: Tag = "div" }) {
  return (
    <Tag
      onClick={onClick}
      disabled={disabled}
      className={`w-full flex items-center p-4 rounded-xl border border-slate-200 bg-slate-50/50 hover:border-primary/50 transition-colors cursor-pointer ${centered ? "justify-center" : "justify-between"}`}
    >
      <div className="flex items-center gap-4">
        {iconElement || (
          <div className="w-10 h-10 rounded-lg bg-white flex items-center justify-center border border-slate-100">
            <Icon name={icon} filled={false} className="text-slate-600" />
          </div>
        )}
        <div className="text-left">
          <h3 className="font-semibold text-sm">{title}</h3>
          {subtitle && <p className="text-xs text-slate-500">{subtitle}</p>}
        </div>
      </div>
      {action}
    </Tag>
  );
}
