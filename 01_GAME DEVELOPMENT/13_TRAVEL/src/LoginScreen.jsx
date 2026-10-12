import { useState } from "react";
import { originChoices } from "./regions.js";
import { loginAccount, registerAccount } from "./account.js";

export default function LoginScreen({ onEnter }) {
  const [joining, setJoining] = useState(true);
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [origin, setOrigin] = useState("東京");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(event) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      const account = joining
        ? await registerAccount({ name, password, origin })
        : await loginAccount(name, password);
      onEnter(account);
    } catch (err) {
      setError(err.message || "保存できませんでした。");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="gate">
      <form className="gate-card" onSubmit={submit}>
        <p className="seal" aria-hidden="true">行</p>
        <h1>旅の行程</h1>
        <p className="gate-lead">名前とパスワードは、このブラウザに保存します。</p>
        <div className="gate-switch" role="tablist" aria-label="入る方法">
          <button type="button" aria-selected={joining} onClick={() => { setJoining(true); setError(""); }}>新しくはじめる</button>
          <button type="button" aria-selected={!joining} onClick={() => { setJoining(false); setError(""); }}>ログイン</button>
        </div>
        <label htmlFor="account-name">名前</label>
        <input id="account-name" value={name} autoComplete="username" onChange={(event) => setName(event.target.value)} />
        <label htmlFor="account-pass">パスワード</label>
        <input id="account-pass" type="password" value={password} autoComplete={joining ? "new-password" : "current-password"} onChange={(event) => setPassword(event.target.value)} />
        {joining && (
          <>
            <label htmlFor="account-origin">よく出る場所</label>
            <select id="account-origin" value={origin} onChange={(event) => setOrigin(event.target.value)}>
              {originChoices().map((item) => (
                <option key={item} value={item}>{item}</option>
              ))}
            </select>
          </>
        )}
        {error && <p className="gate-error">{error}</p>}
        <button className="submit" type="submit" disabled={busy}>{joining ? "はじめる" : "ログイン"}</button>
      </form>
    </div>
  );
}
