import { useRef, useState } from "react";
import Alert from "../ui/Alert";
import Icon from "../ui/Icon";
import Spinner from "../ui/Spinner";

// `onSend(content)` resolves once the message is stored and rejects on
// failure, in which case the draft is kept so nothing is lost.
function MessageComposer({ recipientNames, disabledReason, onSend }) {
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const inputRef = useRef(null);
  const disabled = Boolean(disabledReason);
  const label = recipientNames ? `Message ${recipientNames}` : "Message";

  const handleSubmit = async (e) => {
    e.preventDefault();
    const content = draft.trim();
    if (!content || sending || disabled) return;

    setSending(true);
    setError("");
    try {
      await onSend(content);
      setDraft("");
    } catch {
      setError("Your message couldn't be sent. Please try again.");
    } finally {
      setSending(false);
      // Clicking Send moves focus to the (now disabled) button; return it.
      inputRef.current?.focus();
    }
  };

  return (
    <form className="composer" onSubmit={handleSubmit}>
      {error && <Alert>{error}</Alert>}
      <div className="composer__bar">
        <label htmlFor="message-input" className="visually-hidden">
          {label}
        </label>
        <input
          ref={inputRef}
          id="message-input"
          type="text"
          className="composer__input"
          autoComplete="off"
          value={disabled ? "" : draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder={disabledReason ?? label}
          disabled={disabled}
        />
        <button
          type="submit"
          className="icon-button composer__send"
          disabled={disabled || sending || !draft.trim()}
          aria-label={sending ? "Sending" : "Send"}
          title="Send"
        >
          {sending ? <Spinner /> : <Icon name="send" size="1.1em" />}
        </button>
      </div>
    </form>
  );
}

export default MessageComposer;
