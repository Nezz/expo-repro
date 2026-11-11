export function Flagged() {
  return <p>{"Tune down"}</p>;
}

export function Ternary({ flat }) {
  return <p>{flat ? "Tune up" : "Tune down"}</p>;
}

export function Logical({ title }) {
  return <p>{title ?? "Something went wrong"}</p>;
}

export function Template({ instrument }) {
  return <p>{`Play it on your ${instrument}`}</p>;
}
