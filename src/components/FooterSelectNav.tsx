"use client";

type Option = {
  label: string;
  href: string;
  /** href が重複する場合（Archives など）に React key 用 */
  key?: string;
};

type FooterSelectNavProps = {
  id: string;
  label: string;
  placeholder: string;
  options: Option[];
};

export function FooterSelectNav({
  id,
  label,
  placeholder,
  options,
}: FooterSelectNavProps) {
  return (
    <div className="site-footer-select-wrap">
      <label className="site-footer-select-label" htmlFor={id}>
        {label}
      </label>
      <select
        id={id}
        className="site-footer-select"
        defaultValue=""
        onChange={(event) => {
          const href = event.target.value;
          if (href) window.location.href = href;
          event.target.value = "";
        }}
      >
        <option value="" disabled>
          {placeholder}
        </option>
        {options.map((option) => (
          <option key={option.key ?? option.label} value={option.href}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}
