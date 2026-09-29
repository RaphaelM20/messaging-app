function Alert({ variant = "error", children }) {
  return (
    <p
      className={`alert alert--${variant}`}
      role={variant === "error" ? "alert" : "status"}
    >
      {children}
    </p>
  );
}

export default Alert;
