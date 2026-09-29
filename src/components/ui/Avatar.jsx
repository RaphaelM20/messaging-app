import { useState } from "react";

function getInitials(name = "") {
  const initials = name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join("");
  return initials.toUpperCase() || "?";
}

// Decorative by default: callers render the person's name next to it.
function Avatar({ src, name, size = "md" }) {
  // Remember which URL failed so a new picture gets a fresh attempt.
  const [failedSrc, setFailedSrc] = useState(null);
  const className = `avatar avatar--${size}`;

  if (src && src !== failedSrc) {
    return (
      <img
        className={className}
        src={src}
        alt=""
        onError={() => setFailedSrc(src)}
      />
    );
  }

  return (
    <span className={`${className} avatar--fallback`} aria-hidden="true">
      {getInitials(name)}
    </span>
  );
}

export default Avatar;
