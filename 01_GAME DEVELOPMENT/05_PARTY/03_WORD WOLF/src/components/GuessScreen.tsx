import { useState } from "react";
import { TopBar } from "./Bits";

export function GuessScreen({
  cover,
  kicker,
  title,
  body,
  hold,
  muted,
  onToggleMute,
  onOpen,
  onSubmit,
}: {
  cover: boolean;
  kicker: string;
  title: string;
  body: string;
  hold: string;
  muted: boolean;
  onToggleMute: () => void;
  onOpen: () => void;
  onSubmit: (text: string) => void;
}) {
  const [text, setText] = useState("");

  if (cover) {
    return (
      <section className="screen">
        <TopBar title={kicker} muted={muted} onToggleMute={onToggleMute} />
        <div className="pass">
          <p className="kicker">{kicker}</p>
          <h1>{title}</h1>
          <p>{body}</p>
          <p className="fine center">{hold}</p>
          <div className="dock">
            <button type="button" className="btn btn-primary" onClick={onOpen}>
              推理を入力する
            </button>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="screen">
      <TopBar title={kicker} muted={muted} onToggleMute={onToggleMute} />
      <p className="kicker">{kicker}</p>
      <h1>市民の言葉は？</h1>
      <p>漢字でも、ひらがなでも答えられます。まわりの人は見ないでください。</p>
      <input
        className="guess-input"
        value={text}
        autoFocus
        autoCapitalize="off"
        autoCorrect="off"
        spellCheck={false}
        placeholder="言葉を入力"
        onChange={(event) => setText(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === "Enter" && !event.nativeEvent.isComposing) onSubmit(text);
        }}
      />
      <div className="dock">
        <button type="button" className="btn btn-seal" onClick={() => onSubmit(text)}>
          言い当てる
        </button>
        <button type="button" className="btn btn-text" onClick={() => onSubmit("")}>
          わからない
        </button>
      </div>
    </section>
  );
}
