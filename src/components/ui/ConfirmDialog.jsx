import Dialog from "./Dialog";

function ConfirmDialog({
  open,
  title,
  children,
  confirmLabel,
  onConfirm,
  onCancel,
}) {
  return (
    <Dialog open={open} onClose={onCancel} labelledBy="confirm-title">
      <div className="dialog__content">
        <div className="dialog__header">
          <h2 id="confirm-title" className="dialog__title">
            {title}
          </h2>
        </div>
        <div className="dialog__body">
          <p>{children}</p>
        </div>
        <div className="dialog__footer">
          <button
            type="button"
            className="button button--ghost"
            onClick={onCancel}
            data-autofocus
          >
            Cancel
          </button>
          <button
            type="button"
            className="button button--danger"
            onClick={onConfirm}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </Dialog>
  );
}

export default ConfirmDialog;
