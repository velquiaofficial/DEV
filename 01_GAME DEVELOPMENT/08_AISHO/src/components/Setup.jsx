import { useState } from "react";
import { HOBBIES, PERSONALITY, VALUES } from "../data/options";

const EMPTY = {
  name: "",
  age: "",
  gender: "",
  seeking: "",
  personality: [],
  hobbies: [],
  values: [],
  ideal: [],
  bio: "",
};

const STEPS = ["name", "about", "seeking", "personality", "hobbies", "values", "ideal", "bio"];

function limitOf(key) {
  if (key === "values" || key === "ideal") return 3;
  return 4;
}

export function Setup({ initial, mode, onComplete, onClose }) {
  const [step, setStep] = useState(0);
  const [hint, setHint] = useState("");
  const [draft, setDraft] = useState(() => ({ ...EMPTY, ...initial, age: initial?.age ? String(initial.age) : "" }));
  const key = STEPS[step];

  function toggle(field, item) {
    const max = limitOf(field);
    setDraft((current) => {
      const list = current[field];
      if (list.includes(item)) {
        setHint("");
        return { ...current, [field]: list.filter((entry) => entry !== item) };
      }
      if (list.length >= max) {
        setHint(`${max}つまで選べます`);
        return current;
      }
      setHint("");
      return { ...current, [field]: [...list, item] };
    });
  }

  function validate() {
    if (key === "name") {
      if (!draft.name.trim()) return "名前を入れてください";
      return "";
    }
    if (key === "about") {
      const age = Number(draft.age);
      if (!draft.age || Number.isNaN(age)) return "年齢を入れてください";
      if (age < 18) return "このアプリは18歳以上向けです";
      if (age > 80) return "年齢を確認してください";
      if (!draft.gender) return "性別を選んでください";
      return "";
    }
    if (key === "seeking" && !draft.seeking) return "話す相手を選んでください";
    if (key === "personality" && draft.personality.length === 0) return "性格を1つ以上選んでください";
    if (key === "hobbies" && draft.hobbies.length === 0) return "好きなことを1つ以上選んでください";
    if (key === "values" && draft.values.length === 0) return "大切にしていることを1つ以上選んでください";
    if (key === "ideal" && draft.ideal.length === 0) return "理想のタイプを1つ以上選んでください";
    return "";
  }

  function next() {
    const problem = validate();
    if (problem) {
      setHint(problem);
      return;
    }
    setHint("");
    if (step === STEPS.length - 1) {
      onComplete({
        ...draft,
        name: draft.name.trim(),
        age: Number(draft.age),
        bio: draft.bio.trim(),
      });
      return;
    }
    setStep(step + 1);
  }

  function back() {
    setHint("");
    if (step === 0) onClose();
    else setStep(step - 1);
  }

  return (
    <section className="screen setup">
      <div className="progress" aria-hidden="true">
        <div style={{ width: `${((step + 1) / STEPS.length) * 100}%` }} />
      </div>
      <header className="setup-top">
        <button type="button" className="text-btn" onClick={back}>
          戻る
        </button>
        <span>
          {step + 1} / {STEPS.length}
        </span>
      </header>
      <div className="scroll setup-body">
        {key === "name" && (
          <>
            <h1>なんて呼ばれたい？</h1>
            <p className="sub">相手はこの名前で話しかけます。</p>
            <input
              className="line-input"
              value={draft.name}
              maxLength={12}
              placeholder="名前"
              autoFocus
              onChange={(event) => setDraft({ ...draft, name: event.target.value })}
              onKeyDown={(event) => {
                if (event.key === "Enter" && !event.nativeEvent.isComposing) next();
              }}
            />
          </>
        )}
        {key === "about" && (
          <>
            <h1>年齢と性別</h1>
            <p className="sub">恋愛の会話を含むので、18歳以上で設定します。</p>
            <input
              className="line-input"
              inputMode="numeric"
              value={draft.age}
              placeholder="24"
              maxLength={2}
              onChange={(event) => setDraft({ ...draft, age: event.target.value.replace(/[^\d]/g, "") })}
            />
            <div className="seg">
              {[
                ["female", "女性"],
                ["male", "男性"],
                ["other", "その他"],
              ].map(([id, label]) => (
                <button key={id} type="button" className={draft.gender === id ? "on" : ""} onClick={() => setDraft({ ...draft, gender: id })}>
                  {label}
                </button>
              ))}
            </div>
          </>
        )}
        {key === "seeking" && (
          <>
            <h1>誰と話したい？</h1>
            <p className="sub">男性だけ、女性だけ、どちらも。あとから変えられます。</p>
            <div className="seg">
              {[
                ["female", "女性"],
                ["male", "男性"],
                ["all", "どちらも"],
              ].map(([id, label]) => (
                <button key={id} type="button" className={draft.seeking === id ? "on" : ""} onClick={() => setDraft({ ...draft, seeking: id })}>
                  {label}
                </button>
              ))}
            </div>
          </>
        )}
        {key === "personality" && (
          <ChipStep
            title="あなたの性格"
            sub="近いものを4つまで。相性の軸になります。"
            options={PERSONALITY}
            selected={draft.personality}
            onToggle={(item) => toggle("personality", item)}
          />
        )}
        {key === "hobbies" && (
          <ChipStep
            title="好きなこと"
            sub="4つまで。重なるほど、会話で共通点が出ます。"
            options={HOBBIES}
            selected={draft.hobbies}
            onToggle={(item) => toggle("hobbies", item)}
          />
        )}
        {key === "values" && (
          <ChipStep
            title="大切にしていること"
            sub="3つまで。価値観が近いと相性が上がります。"
            options={VALUES}
            selected={draft.values}
            onToggle={(item) => toggle("values", item)}
          />
        )}
        {key === "ideal" && (
          <ChipStep
            title="相手に求めるもの"
            sub="理想の性格を3つまで。好みとして相性に入ります。"
            options={PERSONALITY}
            selected={draft.ideal}
            onToggle={(item) => toggle("ideal", item)}
          />
        )}
        {key === "bio" && (
          <>
            <h1>ひとこと</h1>
            <p className="sub">任意です。初回の会話で、相手が触れることがあります。</p>
            <textarea
              value={draft.bio}
              maxLength={80}
              placeholder="例）休日は静かな店で、映画の話をしていたい"
              onChange={(event) => setDraft({ ...draft, bio: event.target.value })}
            />
            <div className="summary">
              <b>{draft.name || "名前未設定"}</b>
              <span>
                {draft.age || "—"}歳 · {draft.seeking === "all" ? "男性も女性も" : draft.seeking === "male" ? "男性と話す" : "女性と話す"}
              </span>
              <div className="chips">
                {[...draft.personality, ...draft.hobbies, ...draft.values].map((item) => (
                  <span className="chip on" key={item}>
                    {item}
                  </span>
                ))}
              </div>
            </div>
          </>
        )}
        {hint && <p className="hint">{hint}</p>}
      </div>
      <footer className="setup-foot">
        <button type="button" className="primary" onClick={next}>
          {step === STEPS.length - 1 ? (mode === "edit" ? "保存する" : "このプロフィールではじめる") : "次へ"}
        </button>
      </footer>
    </section>
  );
}

function ChipStep({ title, sub, options, selected, onToggle }) {
  return (
    <>
      <h1>{title}</h1>
      <p className="sub">
        {sub}
        <em>
          {selected.length} / {title === "大切にしていること" || title === "相手に求めるもの" ? 3 : 4}
        </em>
      </p>
      <div className="chips">
        {options.map((item) => (
          <button key={item} type="button" className={selected.includes(item) ? "chip on" : "chip"} onClick={() => onToggle(item)}>
            {item}
          </button>
        ))}
      </div>
    </>
  );
}
