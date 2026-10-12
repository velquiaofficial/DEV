import { useState } from "react";
import type { Difficulty, WordPair } from "../types";
import { isSamePair, normalizeAnswer, uid } from "../logic";
import { PAIRS, categoryList } from "../words";
import { TopBar } from "./Bits";

export function CustomScreen({
  pairs,
  muted,
  onToggleMute,
  onSave,
  onDelete,
  onBack,
}: {
  pairs: WordPair[];
  muted: boolean;
  onToggleMute: () => void;
  onSave: (pair: WordPair) => void;
  onDelete: (id: string) => void;
  onBack: () => void;
}) {
  const [citizen, setCitizen] = useState("");
  const [citizenRead, setCitizenRead] = useState("");
  const [wolf, setWolf] = useState("");
  const [wolfRead, setWolfRead] = useState("");
  const [category, setCategory] = useState("オリジナル");
  const [difficulty, setDifficulty] = useState<Difficulty>("normal");
  const [error, setError] = useState("");
  const [armedId, setArmedId] = useState<string | null>(null);
  const categories = categoryList(pairs);

  function submit() {
    const nextCitizen = citizen.trim();
    const nextWolf = wolf.trim();
    if (!nextCitizen || !nextWolf) {
      setError("ふたつの言葉を入れてください");
      return;
    }
    if (normalizeAnswer(nextCitizen) === normalizeAnswer(nextWolf)) {
      setError("市民とウルフは、別の言葉にしてください");
      return;
    }
    const draft = { citizen: nextCitizen, wolf: nextWolf };
    if ([...PAIRS, ...pairs].some((pair) => isSamePair(pair, draft))) {
      setError("同じ組み合わせがすでにあります");
      return;
    }
    onSave({
      id: `custom-${uid()}`,
      category: category.trim() || "オリジナル",
      difficulty,
      citizen: nextCitizen,
      citizenRead: citizenRead.trim() || nextCitizen,
      wolf: nextWolf,
      wolfRead: wolfRead.trim() || nextWolf,
      custom: true,
    });
    setCitizen("");
    setCitizenRead("");
    setWolf("");
    setWolfRead("");
    setError("");
  }

  return (
    <section className="screen">
      <TopBar title="オリジナル" muted={muted} onToggleMute={onToggleMute} onBack={onBack} />
      <p className="kicker">自分たちの言葉</p>
      <h1>お題を足す</h1>
      <p>近いけれど同じではないペアが、一番盛り上がります。読みを書いておくと、ひらがなの推理も通ります。</p>
      <label className="field">
        <span>市民の言葉</span>
        <input value={citizen} maxLength={20} onChange={(event) => setCitizen(event.target.value)} />
      </label>
      <label className="field">
        <span>市民の読み（空でも可）</span>
        <input value={citizenRead} maxLength={30} placeholder="ひらがな" onChange={(event) => setCitizenRead(event.target.value)} />
      </label>
      <label className="field">
        <span>ウルフの言葉</span>
        <input value={wolf} maxLength={20} onChange={(event) => setWolf(event.target.value)} />
      </label>
      <label className="field">
        <span>ウルフの読み（空でも可）</span>
        <input value={wolfRead} maxLength={30} placeholder="ひらがな" onChange={(event) => setWolfRead(event.target.value)} />
      </label>
      <label className="field">
        <span>カテゴリ</span>
        <input list="custom-categories" value={category} maxLength={12} onChange={(event) => setCategory(event.target.value)} />
        <datalist id="custom-categories">
          {categories.map((item) => (
            <option key={item} value={item} />
          ))}
          <option value="オリジナル" />
        </datalist>
      </label>
      <div className="seg">
        {(
          [
            ["easy", "やさしい"],
            ["normal", "ふつう"],
            ["hard", "まぎらわしい"],
          ] as const
        ).map(([id, label]) => (
          <button type="button" key={id} className={difficulty === id ? "on" : ""} onClick={() => setDifficulty(id)}>
            {label}
          </button>
        ))}
      </div>
      {error ? <p className="warn">{error}</p> : null}
      <button type="button" className="btn btn-primary" onClick={submit}>
        このペアを加える
      </button>

      <div className="section">
        <h2>入っているお題</h2>
        {pairs.length === 0 ? <p className="fine">まだありません。足した言葉は、混ぜるスイッチがオンの卓に入ります。</p> : null}
        {pairs.map((pair) => (
          <article className="custom-card" key={pair.id}>
            <div>
              <strong>
                {pair.citizen} / {pair.wolf}
              </strong>
              <p className="fine">
                {pair.category} · {pair.difficulty === "easy" ? "やさしい" : pair.difficulty === "hard" ? "まぎらわしい" : "ふつう"}
              </p>
            </div>
            <button
              type="button"
              className="icon-btn"
              onClick={() => {
                if (armedId === pair.id) onDelete(pair.id);
                else setArmedId(pair.id);
              }}
            >
              {armedId === pair.id ? "消す" : "削除"}
            </button>
          </article>
        ))}
      </div>
    </section>
  );
}
