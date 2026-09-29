import { Link } from "react-router-dom";
import PersonRow from "../PersonRow";
import EmptyState from "../ui/EmptyState";
import IconButton from "../ui/IconButton";

function FriendList({ friends, currentUserId, busyId, onMessage, onRemove }) {
  if (friends.length === 0) {
    return (
      <EmptyState
        icon="users"
        title="No friends yet"
        action={
          <Link to="/users/search" className="button button--primary">
            Add a friend
          </Link>
        }
      >
        Search for people by username and send them a friend request.
      </EmptyState>
    );
  }

  return (
    <ul className="row-list">
      {friends.map((friendship) => {
        const person =
          friendship.user.id === currentUserId
            ? friendship.buddy
            : friendship.user;
        const busy = busyId === friendship.id;
        return (
          <PersonRow
            key={friendship.id}
            person={person}
            actions={
              <>
                <IconButton
                  icon="message"
                  label={`Message ${person.name}`}
                  onClick={() => onMessage(friendship.id, person.id)}
                  disabled={busy}
                />
                <IconButton
                  icon="close"
                  label={`Remove ${person.name}`}
                  variant="danger"
                  onClick={() => onRemove(friendship.id, person.name)}
                  disabled={busy}
                />
              </>
            }
          />
        );
      })}
    </ul>
  );
}

export default FriendList;
