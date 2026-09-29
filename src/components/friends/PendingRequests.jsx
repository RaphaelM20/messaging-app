import PersonRow from "../PersonRow";
import EmptyState from "../ui/EmptyState";
import IconButton from "../ui/IconButton";

function RequestSection({ id, title, requests, emptyText, children }) {
  return (
    <section className="page__section" aria-labelledby={id}>
      <h2 id={id} className="section-title">
        {title}
        <span className="count-badge">{requests.length}</span>
      </h2>
      {requests.length === 0 ? (
        <p className="text-subtle">{emptyText}</p>
      ) : (
        <ul className="row-list">{children}</ul>
      )}
    </section>
  );
}

function PendingRequests({
  received,
  sent,
  busyId,
  onAccept,
  onDecline,
  onCancel,
}) {
  if (received.length === 0 && sent.length === 0) {
    return (
      <EmptyState icon="clock" title="No pending requests">
        Friend requests you send or receive will show up here.
      </EmptyState>
    );
  }

  return (
    <>
      <RequestSection
        id="received-title"
        title="Received"
        requests={received}
        emptyText="No incoming requests."
      >
        {received.map((request) => (
          <PersonRow
            key={request.id}
            person={request.user}
            actions={
              <>
                <IconButton
                  icon="check"
                  label={`Accept ${request.user.name}`}
                  variant="success"
                  onClick={() => onAccept(request.id)}
                  disabled={busyId === request.id}
                />
                <IconButton
                  icon="close"
                  label={`Decline ${request.user.name}`}
                  variant="danger"
                  onClick={() => onDecline(request.id)}
                  disabled={busyId === request.id}
                />
              </>
            }
          />
        ))}
      </RequestSection>
      <RequestSection
        id="sent-title"
        title="Sent"
        requests={sent}
        emptyText="No outgoing requests."
      >
        {sent.map((request) => (
          <PersonRow
            key={request.id}
            person={request.buddy}
            actions={
              <IconButton
                icon="close"
                label={`Cancel request to ${request.buddy.name}`}
                variant="danger"
                onClick={() => onCancel(request.id)}
                disabled={busyId === request.id}
              />
            }
          />
        ))}
      </RequestSection>
    </>
  );
}

export default PendingRequests;
