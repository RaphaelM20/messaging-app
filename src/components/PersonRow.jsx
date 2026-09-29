import Avatar from "./ui/Avatar";

// A person in a list (friends, requests, search results) with optional
// trailing actions.
function PersonRow({ person, actions }) {
  return (
    <li className="person-row">
      <Avatar src={person.picture} name={person.name} />
      <div className="person-row__text">
        <span className="person-row__name">{person.name}</span>
        <span className="person-row__username">@{person.username}</span>
      </div>
      {actions && <div className="person-row__actions">{actions}</div>}
    </li>
  );
}

export default PersonRow;
