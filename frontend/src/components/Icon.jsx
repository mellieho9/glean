export default function Icon({ name, filled = true, className = "" }) {
  return (
    <span
      className={`material-symbols-outlined ${filled ? "" : "outlined"} ${className}`}
    >
      {name}
    </span>
  );
}
