import { useNavigate } from "react-router-dom";
import Icon from "./Icon";

const variants = {
  primary:
    "bg-primary text-white font-semibold rounded-xl hover:opacity-90 active:scale-[0.98] transition-all shadow-lg shadow-primary/20 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer",
  ghost:
    "text-slate-400 text-sm font-medium hover:text-slate-600 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed",
  back: "group flex items-center gap-2 px-4 py-2 font-semibold text-slate-400 hover:text-slate-900 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed",
};

export default function Button({
  children,
  variant = "primary",
  to,
  onClick,
  disabled,
  className = "",
  ...rest
}) {
  const navigate = useNavigate();

  const handleClick = (e) => {
    if (onClick) onClick(e);
    else if (to) navigate(to);
  };

  return (
    <button
      onClick={handleClick}
      disabled={disabled}
      className={`${variants[variant] || variants.primary} ${className}`}
      {...rest}
    >
      {variant === "back" && (
        <Icon
          name="arrow_back"
          filled={false}
          className="text-xl transition-transform group-hover:-translate-x-1"
        />
      )}
      {children}
    </button>
  );
}
