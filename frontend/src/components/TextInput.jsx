export default function TextInput({
  label,
  placeholder,
  value,
  onChange,
  className = "",
  ...rest
}) {
  return (
    <div className={className}>
      {label && (
        <label className="block text-sm font-semibold text-slate-900 mb-2">
          {label}
        </label>
      )}
      <input
        type="text"
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50/50 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors"
        {...rest}
      />
    </div>
  );
}
