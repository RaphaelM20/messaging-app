import Icon from "./Icon";

function IconButton({ icon, label, variant, className = "", ...props }) {
  const classes = [
    "icon-button",
    variant && `icon-button--${variant}`,
    className,
  ]
    .filter(Boolean)
    .join(" ");
  return (
    <button
      type="button"
      className={classes}
      aria-label={label}
      title={label}
      {...props}
    >
      <Icon name={icon} />
    </button>
  );
}

export default IconButton;
