import { useEffect, useRef } from "react";

// Thin wrapper around the native modal <dialog>, which provides the
// backdrop, focus trapping and top-layer stacking.
//
// - onDismiss: Escape or a backdrop click. Defaults to onClose; pass it to
//   intercept dismissal (e.g. to confirm discarding unsaved changes).
// - onClose: the dialog must close. Also called if the browser closes it on
//   its own (repeated Escape presses cannot be cancelled).
// - An element marked data-autofocus receives focus when the dialog opens.
// - Children mount only while open and should use a .dialog__content root.
function Dialog({ open, onClose, onDismiss = onClose, labelledBy, children }) {
  const dialogRef = useRef(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!open || !dialog) return;

    const previouslyFocused = document.activeElement;
    dialog.showModal();
    dialog.querySelector("[data-autofocus]")?.focus();

    return () => {
      if (dialog.open) dialog.close();
      previouslyFocused?.focus?.();
    };
  }, [open]);

  const handleCancel = (event) => {
    event.preventDefault();
    onDismiss();
  };

  // "close" fires asynchronously, so it can arrive after the dialog was
  // reopened (e.g. StrictMode re-running the effect). Only a dialog that is
  // still closed means the browser dismissed it on its own.
  const handleNativeClose = () => {
    if (open && !dialogRef.current?.open) onClose();
  };

  // The dialog has no padding, so a click whose target is the <dialog>
  // itself landed on the backdrop.
  const handleClick = (event) => {
    if (event.target === dialogRef.current) onDismiss();
  };

  return (
    <dialog
      ref={dialogRef}
      className="dialog"
      aria-labelledby={labelledBy}
      onCancel={handleCancel}
      onClose={handleNativeClose}
      onClick={handleClick}
    >
      {open && children}
    </dialog>
  );
}

export default Dialog;
