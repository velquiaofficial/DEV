import type { Role } from "../types";
import { roleLabel } from "../logic";
import { TopBar } from "./Bits";

export function ExileScreen({
  name,
  role,
  muted,
  onToggleMute,
  onContinue,
}: {
  name: string;
  role: Role;
  muted: boolean;
  onToggleMute: () => void;
  onContinue: () => void;
}) {
  const wolf = role === "wolf";
  return (
    <section className="screen">
      <TopBar title="追放" muted={muted} onToggleMute={onToggleMute} />
      <div className="pass">
        <p className="kicker">{roleLabel(role)}</p>
        <h1>
          {name}さんは
          <br />
          {roleLabel(role)}でした
        </h1>
        <p>{wolf ? "まだウルフが残っています。言葉は伏せたまま、投票を続けます。" : "ウルフはまだ卓にいます。言葉は最後まで秘密です。"}</p>
        <div className="dock">
          <button type="button" className="btn btn-primary" onClick={onContinue}>
            投票を続ける
          </button>
        </div>
      </div>
    </section>
  );
}
