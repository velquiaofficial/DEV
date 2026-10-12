import { useEffect, useMemo, useRef, useState } from "react";
import { Avatar, Monogram } from "./components/Avatar";
import { Setup } from "./components/Setup";
import { characters, getCharacter } from "./data/characters";
import { GENDER_LABEL } from "./data/options";
import { compatibility, initialAffection, relationLabel, scoreTone } from "./lib/compatibility";
import { createReply, milestone, openingMessage } from "./lib/dialogue";
import { clamp, uid } from "./lib/util";

const STORAGE_KEY = "aisho-v1";

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed?.user?.name) return null;
    return {
      user: {
        name: parsed.user.name,
        age: parsed.user.age,
        gender: parsed.user.gender,
        seeking: parsed.user.seeking || "all",
        personality: parsed.user.personality || [],
        hobbies: parsed.user.hobbies || [],
        values: parsed.user.values || [],
        ideal: parsed.user.ideal || [],
        bio: parsed.user.bio || "",
      },
      likes: parsed.likes || [],
      passes: parsed.passes || [],
      threads: parsed.threads || {},
    };
  } catch {
    return null;
  }
}

function canSee(user, character) {
  if (!user) return false;
  if (user.seeking === "all") return true;
  return character.gender === user.seeking;
}

function withThread(current, character) {
  if (!character || current.threads[character.id]) return current;
  const comp = compatibility(current.user, character);
  return {
    ...current,
    threads: {
      ...current.threads,
      [character.id]: {
        affection: initialAffection(comp.score),
        topics: [],
        messages: [{ role: "ai", text: openingMessage(character, current.user, comp), at: Date.now() }],
      },
    },
  };
}

function seekingText(seeking) {
  if (seeking === "all") return "男性も女性も";
  if (seeking === "male") return "男性がタイプ";
  return "女性がタイプ";
}

export default function App() {
  const saved = useRef(undefined);
  if (saved.current === undefined) saved.current = loadState();
  const [state, setState] = useState(
    () => saved.current || { user: null, likes: [], passes: [], threads: {} },
  );
  const [view, setView] = useState(saved.current?.user ? "discover" : "welcome");
  const [setupMode, setSetupMode] = useState("create");
  const [sheetId, setSheetId] = useState(null);
  const [matchedId, setMatchedId] = useState(null);
  const [activeId, setActiveId] = useState(null);
  const [draft, setDraft] = useState("");
  const [typingId, setTypingId] = useState(null);
  const [toast, setToast] = useState(null);
  const [filterOpen, setFilterOpen] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);

  useEffect(() => {
    if (!state.user) {
      localStorage.removeItem(STORAGE_KEY);
      return;
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state]);

  useEffect(() => {
    if (!toast) return undefined;
    const timer = setTimeout(() => setToast(null), 1700);
    return () => clearTimeout(timer);
  }, [toast]);

  const deck = useMemo(() => {
    if (!state.user) return [];
    return characters
      .filter((character) => canSee(state.user, character) && !state.likes.includes(character.id) && !state.passes.includes(character.id))
      .map((character) => ({ character, comp: compatibility(state.user, character) }))
      .sort((a, b) => b.comp.score - a.comp.score);
  }, [state.user, state.likes, state.passes]);

  const incoming = useMemo(() => deck.slice(0, 4), [deck]);

  const chatRows = useMemo(() => {
    return state.likes
      .map((id) => {
        const character = getCharacter(id);
        const thread = state.threads[id];
        if (!character || !thread) return null;
        const last = [...thread.messages].reverse().find((message) => message.role !== "system") || thread.messages.at(-1);
        return { character, thread, last };
      })
      .filter(Boolean)
      .sort((a, b) => (b.last?.at || 0) - (a.last?.at || 0));
  }, [state.likes, state.threads]);

  function ping(text) {
    setToast({ id: uid(), text });
  }

  function finishSetup(user) {
    setState((current) => ({ ...current, user }));
    setView(setupMode === "edit" ? "me" : "discover");
  }

  function like(id) {
    const character = getCharacter(id);
    if (!character) return;
    setState((current) => {
      const next = withThread(current, character);
      return {
        ...next,
        likes: next.likes.includes(id) ? next.likes : [...next.likes, id],
        passes: next.passes.filter((item) => item !== id),
      };
    });
    setSheetId(null);
    setMatchedId(id);
  }

  function pass(id) {
    setState((current) => ({
      ...current,
      passes: current.passes.includes(id) ? current.passes : [...current.passes, id],
    }));
    setSheetId(null);
  }

  function openChat(id) {
    const character = getCharacter(id);
    setState((current) => withThread(current, character));
    setActiveId(id);
    setMatchedId(null);
    setSheetId(null);
    setDraft("");
    setView("chat");
  }

  function sendMessage() {
    const text = draft.trim();
    const chatId = activeId;
    const character = getCharacter(chatId);
    if (!text || !character || typingId) return;
    const snapshot = state.threads[chatId];
    const affection = snapshot?.affection ?? 0;
    const history = snapshot?.messages ?? [];
    const comp = compatibility(state.user, character);
    const result = createReply({
      character,
      user: state.user,
      history: [...history, { role: "user", text }],
      message: text,
      affection,
      score: comp.score,
    });
    setDraft("");
    setTypingId(chatId);
    setState((current) => {
      const thread = current.threads[chatId] || { affection, topics: [], messages: [] };
      return {
        ...current,
        threads: {
          ...current.threads,
          [chatId]: {
            ...thread,
            messages: [...thread.messages, { role: "user", text, at: Date.now() }],
          },
        },
      };
    });
    window.setTimeout(() => {
      setState((current) => {
        const thread = current.threads[chatId];
        if (!thread) return current;
        const before = thread.affection;
        const after = clamp(before + result.delta, 0, 100);
        const topics = thread.topics || [];
        const messages = [...thread.messages, { role: "ai", text: result.text, at: Date.now() }];
        const seen = new Set(topics);
        if (result.shared && result.tag && !seen.has(result.tag)) {
          messages.push({ role: "system", text: `共通点がみえた：${result.tag}`, at: Date.now() });
          seen.add(result.tag);
        }
        const mark = milestone(before, after);
        if (mark) messages.push({ role: "system", text: mark, at: Date.now() });
        return {
          ...current,
          threads: {
            ...current.threads,
            [chatId]: { affection: after, topics: [...seen], messages },
          },
        };
      });
      setTypingId((current) => (current === chatId ? null : current));
      if (result.delta) ping(result.delta > 0 ? `好感度 +${result.delta}` : `好感度 ${result.delta}`);
    }, 680 + Math.min(1000, result.text.length * 12));
  }

  function resetAll() {
    setState({ user: null, likes: [], passes: [], threads: {} });
    setConfirmReset(false);
    setView("welcome");
    setActiveId(null);
  }

  const sheetCharacter = sheetId ? getCharacter(sheetId) : null;
  const sheetComp = sheetCharacter && state.user ? compatibility(state.user, sheetCharacter) : null;
  const matched = matchedId ? getCharacter(matchedId) : null;
  const matchedComp = matched && state.user ? compatibility(state.user, matched) : null;
  const active = activeId ? getCharacter(activeId) : null;
  const activeThread = activeId ? state.threads[activeId] : null;
  const activeComp = active && state.user ? compatibility(state.user, active) : null;

  return (
    <div className="phone">
      {view === "welcome" && (
        <section className="screen welcome">
          <p className="eyebrow">talk, then know</p>
          <h1 className="logo">
            ai<span>sho</span>
          </h1>
          <p className="welcome-lead">
            性格と好みを置いて、
            <br />
            話して、相性を知る。
          </p>
          <ul className="welcome-points">
            <li>自分の性格、趣味、価値観を設定する</li>
            <li>男性にも、女性にも会える</li>
            <li>会話のたびに好感度が動く</li>
          </ul>
          <button
            type="button"
            className="primary"
            onClick={() => {
              setSetupMode("create");
              setView("setup");
            }}
          >
            はじめる
          </button>
          <p className="fine">登場人物はすべてフィクションです。18歳以上向け。</p>
        </section>
      )}

      {view === "setup" && (
        <Setup
          mode={setupMode}
          initial={setupMode === "edit" ? state.user : null}
          onComplete={finishSetup}
          onClose={() => setView(setupMode === "edit" ? "me" : "welcome")}
        />
      )}

      {view === "discover" && state.user && (
        <section className="screen discover">
          <header className="topbar">
            <div className="logo small">
              ai<span>sho</span>
            </div>
            <button type="button" className="text-btn" onClick={() => setFilterOpen(true)}>
              {seekingText(state.user.seeking)}
            </button>
          </header>
          {deck[0] ? (
            <DiscoverCard
              character={deck[0].character}
              comp={deck[0].comp}
              user={state.user}
              onOpen={() => setSheetId(deck[0].character.id)}
              onLike={() => like(deck[0].character.id)}
              onPass={() => pass(deck[0].character.id)}
            />
          ) : (
            <div className="empty">
              <b>今日のカードはここまで</b>
              <p>スキップした人を戻すと、もう一度並びます。</p>
              <button type="button" className="primary" onClick={() => setState((current) => ({ ...current, passes: [] }))}>
                スキップを戻す
              </button>
            </div>
          )}
          <p className="remain">{deck.length ? `残り ${deck.length}人` : " "}</p>
          <TabBar view={view} likes={incoming.length} chats={chatRows.length} onChange={setView} />
        </section>
      )}

      {view === "likes" && state.user && (
        <section className="screen">
          <header className="topbar">
            <b>いいね</b>
          </header>
          <div className="scroll">
            <p className="sub pad">相性の高い人から、興味が届いています。</p>
            {incoming.length === 0 && <div className="empty compact">いま届いているいいねはありません。</div>}
            {incoming.map(({ character, comp }) => (
              <button key={character.id} type="button" className="row" onClick={() => setSheetId(character.id)}>
                <span className="mini">
                  <Avatar person={character} className="portrait" />
                </span>
                <span className="row-copy">
                  <strong>
                    {character.name}・{character.age}
                  </strong>
                  <em>{character.hook}</em>
                </span>
                <b className={scoreTone(comp.score)}>{comp.score}%</b>
              </button>
            ))}
          </div>
          <TabBar view={view} likes={incoming.length} chats={chatRows.length} onChange={setView} />
        </section>
      )}

      {view === "chats" && state.user && (
        <section className="screen">
          <header className="topbar">
            <b>トーク</b>
          </header>
          <div className="scroll">
            {chatRows.length === 0 && (
              <div className="empty">
                <b>まだトークはありません</b>
                <p>いいねすると、その場でマッチして会話が始まります。</p>
              </div>
            )}
            {chatRows.map(({ character, thread, last }) => (
              <button key={character.id} type="button" className="row" onClick={() => openChat(character.id)}>
                <span className="mini">
                  <Avatar person={character} className="portrait" />
                </span>
                <span className="row-copy">
                  <strong>{character.name}</strong>
                  <em>{(last?.text || "").replace(/\s+/g, " ")}</em>
                </span>
                <span className="aff-pill">{thread.affection}</span>
              </button>
            ))}
          </div>
          <TabBar view={view} likes={incoming.length} chats={chatRows.length} onChange={setView} />
        </section>
      )}

      {view === "chat" && active && activeThread && activeComp && (
        <ChatScreen
          character={active}
          thread={activeThread}
          comp={activeComp}
          draft={draft}
          typing={typingId === active.id}
          onDraft={setDraft}
          onSend={sendMessage}
          onBack={() => setView("chats")}
          user={state.user}
        />
      )}

      {view === "me" && state.user && (
        <section className="screen">
          <header className="topbar">
            <b>マイページ</b>
          </header>
          <div className="scroll me">
            <div className="me-hero">
              <Monogram name={state.user.name} />
              <h2>{state.user.name}</h2>
              <p>
                {state.user.age}歳 · {GENDER_LABEL[state.user.gender] || "未設定"} · {seekingText(state.user.seeking)}
              </p>
            </div>
            {state.user.bio && <p className="quote">{state.user.bio}</p>}
            <ProfileBlock title="性格" items={state.user.personality} />
            <ProfileBlock title="趣味" items={state.user.hobbies} />
            <ProfileBlock title="大切にしていること" items={state.user.values} />
            <ProfileBlock title="理想のタイプ" items={state.user.ideal} />
            <p className="help">相性は、性格・趣味・価値観・理想のタイプの重なりから出します。好感度は会話で変わります。</p>
            <button
              type="button"
              className="primary"
              onClick={() => {
                setSetupMode("edit");
                setView("setup");
              }}
            >
              プロフィールを編集
            </button>
            <button type="button" className="ghost" onClick={() => { setState((current) => ({ ...current, passes: [] })); ping("スキップを戻しました"); }}>
              スキップした人を戻す
            </button>
            <button type="button" className="ghost danger" onClick={() => setConfirmReset(true)}>
              最初からやり直す
            </button>
          </div>
          <TabBar view={view} likes={incoming.length} chats={chatRows.length} onChange={setView} />
        </section>
      )}

      {sheetCharacter && sheetComp && (
        <ProfileSheet
          character={sheetCharacter}
          comp={sheetComp}
          user={state.user}
          affection={state.threads[sheetCharacter.id]?.affection}
          liked={state.likes.includes(sheetCharacter.id)}
          onClose={() => setSheetId(null)}
          onLike={() => like(sheetCharacter.id)}
          onPass={() => pass(sheetCharacter.id)}
          onChat={() => openChat(sheetCharacter.id)}
        />
      )}

      {matched && matchedComp && (
        <div className="overlay">
          <div className="modal">
            <p className="eyebrow">matched</p>
            <h2>マッチしました</h2>
            <div className="match-face">
              <Avatar person={matched} className="portrait" />
            </div>
            <p>
              {matched.name} · 相性 <b className={scoreTone(matchedComp.score)}>{matchedComp.score}%</b>
            </p>
            <p className="sub">
              {matchedComp.score >= 80
                ? "かなり重なっています。話してみると、共通点が早く出るはずです。"
                : "数字は出発点です。会話で好感度は動きます。"}
            </p>
            <button type="button" className="primary" onClick={() => openChat(matched.id)}>
              話してみる
            </button>
            <button type="button" className="ghost" onClick={() => setMatchedId(null)}>
              あとで
            </button>
          </div>
        </div>
      )}

      {filterOpen && state.user && (
        <div className="overlay sheet-overlay" onClick={() => setFilterOpen(false)}>
          <div className="bottom-sheet" onClick={(event) => event.stopPropagation()}>
            <b>誰と会う？</b>
            <div className="seg">
              {[
                ["female", "女性"],
                ["male", "男性"],
                ["all", "どちらも"],
              ].map(([id, label]) => (
                <button
                  key={id}
                  type="button"
                  className={state.user.seeking === id ? "on" : ""}
                  onClick={() => setState((current) => ({ ...current, user: { ...current.user, seeking: id } }))}
                >
                  {label}
                </button>
              ))}
            </div>
            <button type="button" className="primary" onClick={() => setFilterOpen(false)}>
              閉じる
            </button>
          </div>
        </div>
      )}

      {confirmReset && (
        <div className="overlay">
          <div className="modal">
            <h2>最初からやり直す</h2>
            <p className="sub">プロフィールと会話を消します。</p>
            <button type="button" className="primary" onClick={resetAll}>
              消す
            </button>
            <button type="button" className="ghost" onClick={() => setConfirmReset(false)}>
              やめる
            </button>
          </div>
        </div>
      )}

      {toast && <div className="toast">{toast.text}</div>}
    </div>
  );
}

function DiscoverCard({ character, comp, user, onOpen, onLike, onPass }) {
  const [offset, setOffset] = useState(0);
  const [dragging, setDragging] = useState(false);
  const origin = useRef(null);

  useEffect(() => {
    setOffset(0);
  }, [character.id]);

  function down(event) {
    origin.current = { x: event.clientX, dx: 0 };
    setDragging(true);
    event.currentTarget.setPointerCapture(event.pointerId);
  }
  function move(event) {
    if (!origin.current) return;
    const dx = event.clientX - origin.current.x;
    origin.current.dx = dx;
    setOffset(dx);
  }
  function up() {
    const dx = origin.current?.dx || 0;
    origin.current = null;
    setDragging(false);
    if (dx > 96) onLike();
    else if (dx < -96) onPass();
    else if (Math.abs(dx) < 10) onOpen();
    setOffset(0);
  }

  return (
    <>
      <article
        className="card"
        style={{
          transform: `translateX(${offset}px) rotate(${offset / 18}deg)`,
          transition: dragging ? "none" : "transform .35s cubic-bezier(.2,.8,.2,1)",
        }}
        onPointerDown={down}
        onPointerMove={move}
        onPointerUp={up}
        onPointerCancel={up}
      >
        <div className="photo">
          <Avatar person={character} className="portrait" />
          <span className="stamp like" style={{ opacity: Math.max(0, Math.min(1, offset / 90)) }}>
            いいね
          </span>
          <span className="stamp skip" style={{ opacity: Math.max(0, Math.min(1, -offset / 90)) }}>
            スキップ
          </span>
          <span className={`score-pill ${scoreTone(comp.score)}`}>相性 {comp.score}%</span>
        </div>
        <div className="info">
          <div className="name-row">
            <h2>
              {character.name}
              <span>{character.age}</span>
            </h2>
            {user.seeking === "all" && <em>{character.gender === "female" ? "女性" : "男性"}</em>}
          </div>
          <p className="meta">
            {character.job} · {character.city}
          </p>
          <p className="hook">{character.hook}</p>
          <div className="chips tight">
            {character.personality.map((tag) => (
              <span key={tag} className={user.personality.includes(tag) ? "chip on" : "chip"}>
                {tag}
              </span>
            ))}
          </div>
        </div>
      </article>
      <div className="actions">
        <button type="button" className="round" onClick={onPass} aria-label="スキップ">
          <CloseIcon />
        </button>
        <button type="button" className="round like" onClick={onLike} aria-label="いいね">
          <HeartIcon />
        </button>
      </div>
    </>
  );
}

function ProfileSheet({ character, comp, user, affection, liked, onClose, onLike, onPass, onChat }) {
  const shared = [...comp.shared.personality, ...comp.shared.hobbies, ...comp.shared.values];
  return (
    <section className="sheet">
      <header className="sheet-photo">
        <Avatar person={character} className="portrait" />
        <button type="button" className="close-float" onClick={onClose} aria-label="閉じる">
          <CloseIcon />
        </button>
      </header>
      <div className="scroll sheet-body">
        <div className="name-row">
          <h2>
            {character.name}
            <span>{character.age}</span>
          </h2>
          <Ring value={comp.score} />
        </div>
        <p className="meta">
          {character.job} · {character.city}
        </p>
        <p className="hook">{character.bio}</p>
        <div className="bars">
          {comp.breakdown.map((item) => (
            <div className="bar-row" key={item.label}>
              <span>{item.label}</span>
              <div className="track">
                <div style={{ width: `${item.value}%` }} />
              </div>
              <b>{item.value}</b>
            </div>
          ))}
        </div>
        {typeof affection === "number" && (
          <p className="help">
            好感度 {affection} · {relationLabel(affection)}
          </p>
        )}
        <h3>そろっているところ</h3>
        {shared.length === 0 ? (
          <p className="sub">まだ重なりは少ないです。会話で見えるものもあります。</p>
        ) : (
          <div className="chips">
            {shared.map((item) => (
              <span className="chip on" key={item}>
                {item}
              </span>
            ))}
          </div>
        )}
        <h3>性格</h3>
        <TagList items={character.personality} mine={user.personality} />
        <h3>趣味</h3>
        <TagList items={character.hobbies} mine={user.hobbies} />
        <h3>大切にしていること</h3>
        <TagList items={character.values} mine={user.values} />
      </div>
      <footer className="sheet-actions">
        {liked ? (
          <button type="button" className="primary" onClick={onChat}>
            トークする
          </button>
        ) : (
          <>
            <button type="button" className="ghost" onClick={onPass}>
              スキップ
            </button>
            <button type="button" className="primary" onClick={onLike}>
              いいね
            </button>
          </>
        )}
      </footer>
    </section>
  );
}

function chatHints(character, user, affection) {
  const sharedHobby = (user.hobbies || []).find((item) => character.hobbies.includes(item));
  const hobby = sharedHobby || character.hobbies[0];
  const hints = [
    `こんにちは、${character.name.split(" ").at(-1) || character.name}さん`,
    `${hobby}の話、もっと聞きたい`,
    "今日の調子どう？",
    "仕事の話聞かせて",
  ];
  if (affection >= 40) hints.push("恋愛観ってどんな感じ？");
  if (affection >= 55) hints.push("今度、会ってみたいな");
  if (affection >= 75) hints.push("あなたのこと、好きかも");
  return hints.slice(0, 4);
}

function ChatScreen({ character, thread, comp, draft, typing, onDraft, onSend, onBack, user }) {
  const bottomRef = useRef(null);
  const hints = useMemo(
    () => chatHints(character, user, thread.affection),
    [character, user, thread.affection],
  );

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [thread.messages.length, typing]);

  return (
    <section className="screen chat">
      <header className="chat-head">
        <button type="button" className="text-btn" onClick={onBack} aria-label="戻る">
          戻る
        </button>
        <span className="mini">
          <Avatar person={character} className="portrait" />
        </span>
        <div className="who">
          <b>{character.name}</b>
          <div className="aff-line">
            <span>好感度 {thread.affection}</span>
            <span>{relationLabel(thread.affection)}</span>
            <span className={scoreTone(comp.score)}>相性 {comp.score}%</span>
          </div>
          <div className="meter" aria-hidden="true">
            <div style={{ width: `${thread.affection}%` }} />
          </div>
        </div>
      </header>
      <div className="thread">
        {thread.messages.map((message, index) => (
          <p key={`${message.at}-${index}`} className={`bubble ${message.role}`}>
            {message.text}
          </p>
        ))}
        {typing && (
          <p className="bubble ai typing" aria-label="入力中">
            <i />
            <i />
            <i />
          </p>
        )}
        <div ref={bottomRef} />
      </div>
      {!draft && !typing && (
        <div className="hints" aria-label="会話のヒント">
          {hints.map((hint) => (
            <button
              key={hint}
              type="button"
              className="hint-chip"
              onClick={() => {
                onDraft(hint);
              }}
            >
              {hint}
            </button>
          ))}
        </div>
      )}
      <form
        className="composer"
        onSubmit={(event) => {
          event.preventDefault();
          onSend();
        }}
      >
        <input
          value={draft}
          maxLength={200}
          placeholder="メッセージ"
          onChange={(event) => onDraft(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter" && !event.nativeEvent.isComposing) {
              event.preventDefault();
              onSend();
            }
          }}
        />
        <button type="submit" className="send" disabled={!draft.trim() || typing} aria-label="送信">
          <ArrowIcon />
        </button>
      </form>
    </section>
  );
}

function TabBar({ view, likes, chats, onChange }) {
  const tabs = [
    ["discover", "さがす", <CardsIcon />, 0],
    ["likes", "いいね", <HeartIcon />, likes],
    ["chats", "トーク", <ChatIcon />, chats],
    ["me", "マイページ", <UserIcon />, 0],
  ];
  return (
    <nav className="tabbar">
      {tabs.map(([id, label, icon, count]) => (
        <button key={id} type="button" className={view === id ? "tab on" : "tab"} onClick={() => onChange(id)}>
          <span className="tab-icon">
            {icon}
            {count > 0 && id !== "discover" && <i className="dot">{count}</i>}
          </span>
          {label}
        </button>
      ))}
    </nav>
  );
}

function ProfileBlock({ title, items }) {
  return (
    <section className="block">
      <h3>{title}</h3>
      <div className="chips">
        {items.map((item) => (
          <span className="chip on" key={item}>
            {item}
          </span>
        ))}
      </div>
    </section>
  );
}

function TagList({ items, mine }) {
  return (
    <div className="chips">
      {items.map((item) => (
        <span key={item} className={mine.includes(item) ? "chip on" : "chip"}>
          {item}
        </span>
      ))}
    </div>
  );
}

function Ring({ value }) {
  const radius = 20;
  const circ = 2 * Math.PI * radius;
  return (
    <svg className={`ring ${scoreTone(value)}`} width="58" height="58" viewBox="0 0 54 54" aria-label={`相性${value}%`}>
      <circle cx="27" cy="27" r={radius} className="ring-track" />
      <circle
        cx="27"
        cy="27"
        r={radius}
        className="ring-value"
        strokeDasharray={circ}
        strokeDashoffset={circ * (1 - value / 100)}
      />
      <text x="27" y="31" textAnchor="middle">
        {value}
      </text>
    </svg>
  );
}

function HeartIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 20s-7-4.4-7-9a4 4 0 0 1 7-2 4 4 0 0 1 7 2c0 4.6-7 9-7 9z" fill="currentColor" />
    </svg>
  );
}
function CloseIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M7 7l10 10M17 7 7 17" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}
function CardsIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <rect x="4" y="5" width="12" height="15" rx="2" fill="none" stroke="currentColor" strokeWidth="1.7" />
      <path d="M8 4h10a2 2 0 0 1 2 2v12" fill="none" stroke="currentColor" strokeWidth="1.7" />
    </svg>
  );
}
function ChatIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M5 6h14v9H8l-3 3V6z" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />
    </svg>
  );
}
function UserIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="12" cy="9" r="3.2" fill="none" stroke="currentColor" strokeWidth="1.7" />
      <path d="M6.5 19c1.2-2.4 3-3.5 5.5-3.5S16.3 16.6 17.5 19" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
    </svg>
  );
}
function ArrowIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M5 12h12M13 6l6 6-6 6" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
