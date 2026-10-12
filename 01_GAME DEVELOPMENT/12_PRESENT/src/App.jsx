import { useEffect, useMemo, useRef, useState } from 'react'
import {
  activeCount,
  budgets,
  emptyFilters,
  filterChips,
  formatYen,
  gifts,
  hobbies,
  loadPicks,
  occasions,
  reasonLine,
  recipients,
  savePicks,
  searchGifts,
  vibes,
} from './data'
import { Icon, Logo } from './icons'

const sortLabels = {
  recommend: 'おすすめ順',
  priceAsc: '価格が低い順',
  priceDesc: '価格が高い順',
}

export default function App() {
  return (
    <div className="stage">
      <aside className="brand">
        <div className="brand-inner">
          <div className="brand-lockup">
            <Logo size={40} />
            <span>okuru</span>
          </div>
          <p className="brand-kicker">条件から、贈りものを決める</p>
          <h1>
            誰に。
            <br />
            どんな場面で。
            <br />
            いくらまで。
          </h1>
          <p className="brand-copy">
            相手・場面・予算・雰囲気を選んで検索すると、渡せるプレゼントだけが残ります。気になったものを候補にして、最後に本命を一つ決められます。
          </p>
          <ol>
            <li>
              <span>01</span>条件を選ぶ
            </li>
            <li>
              <span>02</span>検索して比べる
            </li>
            <li>
              <span>03</span>本命に決める
            </li>
          </ol>
        </div>
      </aside>
      <div className="device-wrap">
        <Phone />
      </div>
    </div>
  )
}

function Phone() {
  const [view, setView] = useState('home')
  const [backTo, setBackTo] = useState('home')
  const [filters, setFilters] = useState(emptyFilters)
  const [draft, setDraft] = useState(emptyFilters)
  const [hasSearched, setHasSearched] = useState(false)
  const [searching, setSearching] = useState(false)
  const [sort, setSort] = useState('recommend')
  const [selectedId, setSelectedId] = useState(null)
  const [picks, setPicks] = useState(loadPicks)
  const [toast, setToast] = useState('')
  const [confirmId, setConfirmId] = useState(null)
  const scroller = useRef(null)

  const results = useMemo(
    () => searchGifts(hasSearched ? filters : emptyFilters, sort),
    [filters, hasSearched, sort],
  )
  const draftResults = useMemo(() => searchGifts(draft, 'recommend'), [draft])
  const chips = filterChips(filters)
  const selected = useMemo(() => {
    const base = gifts.find((gift) => gift.id === selectedId)
    if (!base) return null
    const scored = results.find((gift) => gift.id === selectedId)
    return { ...base, fit: scored?.fit }
  }, [results, selectedId])
  const confirmGift = gifts.find((gift) => gift.id === confirmId) ?? null
  const chosenGifts = picks.ids.map((id) => gifts.find((gift) => gift.id === id)).filter(Boolean)
  const decidedGift = gifts.find((gift) => gift.id === picks.decided) ?? null

  useEffect(() => {
    if (!searching) return undefined
    const timer = setTimeout(() => setSearching(false), 520)
    return () => clearTimeout(timer)
  }, [searching])

  useEffect(() => {
    if (!toast) return undefined
    const timer = setTimeout(() => setToast(''), 2200)
    return () => clearTimeout(timer)
  }, [toast])

  useEffect(() => {
    if (scroller.current) scroller.current.scrollTop = 0
  }, [view])

  useEffect(() => {
    if (hasSearched && activeCount(filters) === 0) setHasSearched(false)
  }, [filters, hasSearched])

  function openConditions(next) {
    setDraft(next ?? filters)
    setView('conditions')
  }

  function runSearch() {
    if (!activeCount(draft) || draftResults.length === 0) return
    setFilters(draft)
    setHasSearched(true)
    setSearching(true)
    setView('home')
  }

  function togglePick(id) {
    setPicks((prev) => {
      const has = prev.ids.includes(id)
      const next = {
        ids: has ? prev.ids.filter((item) => item !== id) : [...prev.ids, id],
        decided: has && prev.decided === id ? null : prev.decided,
      }
      savePicks(next)
      return next
    })
    setToast(picks.ids.includes(id) ? '候補から外しました' : '候補に入れました')
  }

  function decide(id) {
    setPicks((prev) => {
      const next = {
        ids: prev.ids.includes(id) ? prev.ids : [...prev.ids, id],
        decided: id,
      }
      savePicks(next)
      return next
    })
    setConfirmId(null)
    setToast('このプレゼントに決めました')
  }

  function removeChip(chip) {
    setFilters((prev) => {
      if (chip.group === 'budget') return { ...prev, budget: null }
      return { ...prev, [chip.group]: prev[chip.group].filter((id) => id !== chip.id) }
    })
  }

  function openDetail(id, from) {
    setSelectedId(id)
    setBackTo(from)
    setView('detail')
  }

  function cycleSort() {
    setSort((prev) => (prev === 'recommend' ? 'priceAsc' : prev === 'priceAsc' ? 'priceDesc' : 'recommend'))
  }

  function resetAll() {
    const next = { ids: [], decided: null }
    savePicks(next)
    setPicks(next)
    setFilters(emptyFilters)
    setDraft(emptyFilters)
    setHasSearched(false)
    setToast('選びと検索をリセットしました')
  }

  const showTab = view === 'home' || view === 'chosen' || view === 'me'
  const tab = view === 'chosen' ? 'chosen' : view === 'me' ? 'me' : 'home'

  return (
    <div className="device">
      {view !== 'detail' && (
        <header className="top">
          {view === 'conditions' ? (
            <button className="icon-btn" type="button" onClick={() => setView('home')} aria-label="戻る">
              <Icon name="back" />
            </button>
          ) : (
            <div className="lockup">
              <Logo size={26} />
              <span>okuru</span>
            </div>
          )}
          <div className="top-title">
            {view === 'conditions' && '検索条件'}
            {view === 'chosen' && 'えらんだ'}
            {view === 'me' && 'マイページ'}
          </div>
          {view === 'conditions' ? (
            <button className="text-btn" type="button" onClick={() => setDraft(emptyFilters)}>
              リセット
            </button>
          ) : view === 'home' ? (
            <button className="icon-btn" type="button" onClick={() => openConditions()} aria-label="検索条件">
              <Icon name="sliders" />
              {activeCount(filters) > 0 && <i className="dot-count">{activeCount(filters)}</i>}
            </button>
          ) : (
            <span className="icon-spacer" />
          )}
        </header>
      )}

      <main ref={scroller} className="main">
        {view === 'home' && (
          <Home
            hasSearched={hasSearched}
            searching={searching}
            results={results}
            chips={chips}
            sort={sort}
            picks={picks}
            onSearch={() => openConditions()}
            onScene={(id) => {
              const occasionsNext = filters.occasions.includes(id) ? filters.occasions : [...filters.occasions, id]
              openConditions({ ...filters, occasions: occasionsNext })
            }}
            onClear={() => {
              setFilters(emptyFilters)
              setHasSearched(false)
            }}
            onRemoveChip={removeChip}
            onSort={cycleSort}
            filters={hasSearched ? filters : emptyFilters}
            onOpen={(id) => openDetail(id, 'home')}
            onToggle={togglePick}
          />
        )}
        {view === 'conditions' && (
          <Conditions
            draft={draft}
            onToggle={(group, id) => {
              setDraft((prev) => {
                const has = prev[group].includes(id)
                return {
                  ...prev,
                  [group]: has ? prev[group].filter((item) => item !== id) : [...prev[group], id],
                }
              })
            }}
            onBudget={(id) => setDraft((prev) => ({ ...prev, budget: prev.budget === id ? null : id }))}
          />
        )}
        {view === 'detail' && selected && (
          <Detail
            gift={selected}
            picked={picks.ids.includes(selected.id)}
            decided={picks.decided === selected.id}
            searched={hasSearched}
            filters={filters}
            onBack={() => setView(backTo)}
          />
        )}
        {view === 'chosen' && (
          <Chosen
            decided={decidedGift}
            gifts={chosenGifts.filter((gift) => gift.id !== picks.decided)}
            onOpen={(id) => openDetail(id, 'chosen')}
            onRemove={togglePick}
            onDecide={setConfirmId}
            onBrowse={() => setView('home')}
          />
        )}
        {view === 'me' && (
          <MyPage
            picks={picks}
            decided={decidedGift}
            chosenCount={chosenGifts.length}
            total={chosenGifts.reduce((sum, gift) => sum + gift.price, 0)}
            chips={hasSearched ? chips : []}
            onOpen={() => decidedGift && openDetail(decidedGift.id, 'me')}
            onReset={resetAll}
            onSearch={() => openConditions()}
          />
        )}
      </main>

      {view === 'conditions' && (
        <div className="dock">
          <div className="dock-meta">
            <span>{activeCount(draft) ? 'この条件' : '条件未選択'}</span>
            <b>{activeCount(draft) ? `${draftResults.length}件` : '—'}</b>
          </div>
          <button
            className="btn-primary"
            type="button"
            disabled={!activeCount(draft) || draftResults.length === 0}
            onClick={runSearch}
          >
            {!activeCount(draft)
              ? '条件を選んでください'
              : draftResults.length === 0
                ? '合うものがありません'
                : 'この条件で検索'}
          </button>
        </div>
      )}

      {view === 'detail' && selected && (
        <DetailDock
          picked={picks.ids.includes(selected.id)}
          decided={picks.decided === selected.id}
          onToggle={() => togglePick(selected.id)}
          onDecide={() => setConfirmId(selected.id)}
        />
      )}

      {showTab && (
        <nav className="tabbar" aria-label="メイン">
          <TabButton icon="search" label="さがす" active={tab === 'home'} onClick={() => setView('home')} />
          <TabButton
            icon="heart"
            label="えらんだ"
            active={tab === 'chosen'}
            count={picks.ids.length}
            onClick={() => setView('chosen')}
          />
          <TabButton icon="user" label="マイページ" active={tab === 'me'} onClick={() => setView('me')} />
        </nav>
      )}

      {confirmGift && (
        <div className="sheet-backdrop" onClick={() => setConfirmId(null)}>
          <div className="sheet" role="dialog" aria-modal="true" aria-labelledby="confirm-title" onClick={(event) => event.stopPropagation()}>
            <div className="sheet-grab" />
            <p className="sheet-kicker">本命に決める</p>
            <h3 id="confirm-title">{confirmGift.name}</h3>
            <p className="sheet-price">{formatYen(confirmGift.price)}</p>
            <p className="sheet-copy">候補は残したまま、贈るものを一つに決められます。</p>
            <button className="btn-primary" type="button" onClick={() => decide(confirmGift.id)}>
              これに決める
            </button>
            <button className="btn-ghost" type="button" onClick={() => setConfirmId(null)}>
              戻る
            </button>
          </div>
        </div>
      )}

      {toast && (
        <div className={`toast ${showTab ? 'above-tab' : 'above-dock'}`} role="status">
          {toast}
        </div>
      )}
    </div>
  )
}

function TabButton({ icon, label, active, count = 0, onClick }) {
  return (
    <button className={active ? 'tab on' : 'tab'} type="button" onClick={onClick}>
      <span className="tab-icon">
        <Icon name={active && icon === 'heart' ? 'heartFill' : icon} size={22} />
        {count > 0 && <i>{count}</i>}
      </span>
      {label}
    </button>
  )
}

function Home({
  hasSearched,
  searching,
  results,
  chips,
  sort,
  picks,
  onSearch,
  onScene,
  onClear,
  onRemoveChip,
  onSort,
  filters,
  onOpen,
  onToggle,
}) {
  return (
    <div className="view">
      {!hasSearched && (
        <section className="hero">
          <p className="kicker">プレゼントを探す</p>
          <h2>
            条件を選んで、
            <br />
            贈るものを決める。
          </h2>
          <p>相手・場面・予算・雰囲気から、渡せるものだけを残せます。</p>
          <button className="btn-primary" type="button" onClick={onSearch}>
            条件を選んで検索
          </button>
        </section>
      )}

      {!hasSearched && (
        <section className="block">
          <div className="block-head">
            <h3>シーンから</h3>
          </div>
          <div className="scene-row">
            {occasions.map((item) => (
              <button key={item.id} className="scene" type="button" onClick={() => onScene(item.id)}>
                {item.label}
              </button>
            ))}
          </div>
        </section>
      )}

      {hasSearched && (
        <div className="refine">
          <span className="refine-mark">絞り込み中</span>
          <button type="button" onClick={onClear}>
            クリア
          </button>
        </div>
      )}

      {hasSearched && chips.length > 0 && (
        <div className="chip-row">
          {chips.map((chip) => (
            <button key={chip.key} className="mini" type="button" onClick={() => onRemoveChip(chip)}>
              {chip.label}
              <Icon name="close" size={14} />
            </button>
          ))}
          <button className="mini edit" type="button" onClick={onSearch}>
            条件を変更
          </button>
        </div>
      )}

      <div className="block-head pad">
        <h3>{hasSearched ? `${results.length}件のプレゼント` : 'おすすめ'}</h3>
        <button className="sort" type="button" onClick={onSort}>
          {sortLabels[sort]}
        </button>
      </div>

      <div className="feed">
        {searching && (
          <>
            <Skeleton />
            <Skeleton />
          </>
        )}
        {!searching && results.length === 0 && (
          <div className="empty">
            <Logo size={42} />
            <h3>条件に合うものがありません</h3>
            <p>予算を上げるか、雰囲気を一つ外すと見つかりやすくなります。</p>
            <button className="btn-primary" type="button" onClick={onSearch}>
              条件を変更
            </button>
          </div>
        )}
        {!searching &&
          results.map((gift) => (
            <GiftCard
              key={gift.id}
              gift={gift}
              picked={picks.ids.includes(gift.id)}
              decided={picks.decided === gift.id}
              showFit={hasSearched}
              filters={filters}
              onOpen={() => onOpen(gift.id)}
              onToggle={() => onToggle(gift.id)}
            />
          ))}
      </div>
    </div>
  )
}

function GiftCard({ gift, picked, decided, showFit, filters, onOpen, onToggle }) {
  const occasionId = [
    ...gift.occasions.filter((id) => filters.occasions.includes(id)),
    ...gift.occasions.filter((id) => !filters.occasions.includes(id)),
  ][0]
  const vibeIds = [
    ...gift.vibes.filter((id) => filters.vibes.includes(id)),
    ...gift.vibes.filter((id) => !filters.vibes.includes(id)),
  ].slice(0, 2)

  return (
    <article className="card">
      <button className="card-photo" type="button" onClick={onOpen}>
        <Photo src={gift.image} alt={gift.name} />
        <span className="price-pill">{formatYen(gift.price)}</span>
        {decided && <span className="flag">本命</span>}
        {showFit && <span className="fit-pill">適合 {gift.fit}%</span>}
      </button>
      <button
        className={picked ? 'heart on' : 'heart'}
        type="button"
        aria-label={picked ? '選択を解除' : '候補にする'}
        aria-pressed={picked}
        onClick={onToggle}
      >
        <Icon name={picked ? 'heartFill' : 'heart'} size={20} />
      </button>
      <div className="card-body">
        <button className="card-open" type="button" onClick={onOpen}>
          <h3>{gift.name}</h3>
          <p>{gift.lead}</p>
        </button>
        <div className="tags">
          {occasionId && <span>{occasions.find((item) => item.id === occasionId)?.label}</span>}
          {vibeIds.map((id) => (
            <span key={id}>{vibes.find((item) => item.id === id)?.label}</span>
          ))}
        </div>
      </div>
    </article>
  )
}

function Conditions({ draft, onToggle, onBudget }) {
  return (
    <div className="view conditions">
      <p className="cond-lead">当てはまるものを選んでください。予算以外は複数選べます。</p>
      <Section title="誰に贈る？">
        <div className="choice-grid">
          {recipients.map((item) => {
            const on = draft.recipients.includes(item.id)
            return (
              <button key={item.id} className={on ? 'choice on' : 'choice'} type="button" aria-pressed={on} onClick={() => onToggle('recipients', item.id)}>
                <span className="choice-main">
                  <Icon name={item.icon} size={18} />
                  {item.label}
                </span>
                {on && <Icon name="check" size={16} />}
              </button>
            )
          })}
        </div>
      </Section>
      <Section title="どんな場面？">
        <div className="choice-grid">
          {occasions.map((item) => {
            const on = draft.occasions.includes(item.id)
            return (
              <button key={item.id} className={on ? 'choice on center' : 'choice center'} type="button" aria-pressed={on} onClick={() => onToggle('occasions', item.id)}>
                <span>{item.label}</span>
                {on && <Icon name="check" size={16} />}
              </button>
            )
          })}
        </div>
      </Section>
      <Section title="予算">
        <div className="pills">
          {budgets.map((item) => {
            const on = draft.budget === item.id
            return (
              <button key={item.id} className={on ? 'chip on' : 'chip'} type="button" aria-pressed={on} onClick={() => onBudget(item.id)}>
                {item.label}
              </button>
            )
          })}
        </div>
      </Section>
      <Section title="雰囲気">
        <div className="pills">
          {vibes.map((item) => {
            const on = draft.vibes.includes(item.id)
            return (
              <button key={item.id} className={on ? 'chip on' : 'chip'} type="button" aria-pressed={on} onClick={() => onToggle('vibes', item.id)}>
                {item.label}
              </button>
            )
          })}
        </div>
      </Section>
      <Section title="相手の趣味">
        <div className="pills">
          {hobbies.map((item) => {
            const on = draft.hobbies.includes(item.id)
            return (
              <button key={item.id} className={on ? 'chip on' : 'chip'} type="button" aria-pressed={on} onClick={() => onToggle('hobbies', item.id)}>
                {item.label}
              </button>
            )
          })}
        </div>
      </Section>
    </div>
  )
}

function Section({ title, children }) {
  return (
    <section className="section">
      <h3>{title}</h3>
      {children}
    </section>
  )
}

function Detail({ gift, decided, searched, filters, onBack }) {
  const meta = [
    ...gift.recipients.map((id) => recipients.find((item) => item.id === id)?.label),
    ...gift.occasions.map((id) => occasions.find((item) => item.id === id)?.label),
    ...gift.vibes.map((id) => vibes.find((item) => item.id === id)?.label),
  ].filter(Boolean)

  return (
    <article className="detail view">
      <div className="detail-photo">
        <Photo src={gift.image} alt={gift.name} />
        <button className="float-back" type="button" onClick={onBack} aria-label="戻る">
          <Icon name="back" />
        </button>
        {decided && <span className="flag big">本命</span>}
      </div>
      <div className="detail-body">
        <div className="price-row">
          <strong>{formatYen(gift.price)}</strong>
          {searched && typeof gift.fit === 'number' && <span className="fit-pill solid">適合 {gift.fit}%</span>}
        </div>
        <h2>{gift.name}</h2>
        <p className="reason">{searched ? reasonLine(gift, filters) : gift.lead}</p>
        <p className="desc">{gift.description}</p>
        <h3>贈り方</h3>
        <p className="desc">{gift.hint}</p>
        <h3>合いやすい条件</h3>
        <div className="tags loose">
          {meta.map((label) => (
            <span key={label}>{label}</span>
          ))}
        </div>
      </div>
    </article>
  )
}

function DetailDock({ picked, decided, onToggle, onDecide }) {
  if (decided) {
    return (
      <div className="dock">
        <button className="btn-done" type="button" disabled>
          <Icon name="check" size={18} />
          本命に決めています
        </button>
      </div>
    )
  }

  if (!picked) {
    return (
      <div className="dock">
        <button className="btn-primary" type="button" onClick={onToggle}>
          このプレゼントを選ぶ
        </button>
      </div>
    )
  }

  return (
    <div className="dock split">
      <button className="btn-line" type="button" onClick={onToggle}>
        選択を解除
      </button>
      <button className="btn-primary" type="button" onClick={onDecide}>
        これに決める
      </button>
    </div>
  )
}

function Chosen({ decided, gifts: items, onOpen, onRemove, onDecide, onBrowse }) {
  if (!decided && items.length === 0) {
    return (
      <div className="view empty page">
        <Logo size={42} />
        <h3>まだ選んでいません</h3>
        <p>検索結果のハートを押すと、ここに候補が集まります。</p>
        <button className="btn-primary" type="button" onClick={onBrowse}>
          さがす
        </button>
      </div>
    )
  }

  return (
    <div className="view chosen">
      {decided && (
        <section className="decided">
          <p className="kicker">これに決めました</p>
          <button className="decided-card" type="button" onClick={() => onOpen(decided.id)}>
            <Photo src={decided.image} alt="" />
            <span>
              <strong>{decided.name}</strong>
              <em>{formatYen(decided.price)}</em>
            </span>
          </button>
        </section>
      )}
      {items.length > 0 && (
        <section className="block">
          <div className="block-head pad">
            <h3>{decided ? 'ほかの候補' : '候補'}</h3>
          </div>
          <ul className="pick-list">
            {items.map((gift) => (
              <li key={gift.id}>
                <button className="pick" type="button" onClick={() => onOpen(gift.id)}>
                  <Photo src={gift.image} alt="" />
                  <span>
                    <strong>{gift.name}</strong>
                    <em>{formatYen(gift.price)}</em>
                  </span>
                </button>
                <div className="pick-actions">
                  <button type="button" onClick={() => onDecide(gift.id)}>
                    本命にする
                  </button>
                  <button type="button" onClick={() => onRemove(gift.id)}>
                    外す
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  )
}

function MyPage({ picks, decided, chosenCount, total, chips, onOpen, onReset, onSearch }) {
  return (
    <div className="view me">
      <section className="profile">
        <div className="avatar" aria-hidden="true">
          o
        </div>
        <div>
          <h2>贈りものノート</h2>
          <p>選んだものは、この端末に保存されます。</p>
        </div>
      </section>
      <div className="stats">
        <div>
          <b>{chosenCount}</b>
          <span>候補</span>
        </div>
        <div>
          <b>{picks.decided ? 1 : 0}</b>
          <span>本命</span>
        </div>
        <div>
          <b>{chosenCount ? formatYen(total) : '—'}</b>
          <span>候補の合計</span>
        </div>
      </div>
      {decided && (
        <button className="decided-card inset" type="button" onClick={onOpen}>
          <Photo src={decided.image} alt="" />
          <span>
            <small>本命</small>
            <strong>{decided.name}</strong>
            <em>{formatYen(decided.price)}</em>
          </span>
        </button>
      )}
      <section className="panel">
        <h3>最後に検索した条件</h3>
        {chips.length === 0 ? (
          <p className="muted">まだ検索していません。</p>
        ) : (
          <div className="tags loose">
            {chips.map((chip) => (
              <span key={chip.key}>{chip.label}</span>
            ))}
          </div>
        )}
        <button className="btn-line wide" type="button" onClick={onSearch}>
          条件を選ぶ
        </button>
      </section>
      <section className="panel">
        <h3>使い方</h3>
        <ol className="steps">
          <li>誰に贈るか、場面、予算、雰囲気を選ぶ</li>
          <li>検索して、ハートで候補に残す</li>
          <li>候補の中から、本命を一つ決める</li>
        </ol>
      </section>
      <button className="reset" type="button" onClick={onReset}>
        選びと検索をリセット
      </button>
    </div>
  )
}

function Photo({ src, alt }) {
  const [failed, setFailed] = useState(false)
  if (failed) return <span className="photo-fallback" />
  return <img src={src} alt={alt} loading="lazy" onError={() => setFailed(true)} />
}

function Skeleton() {
  return (
    <div className="skel" aria-hidden="true">
      <div className="skel-photo" />
      <div className="skel-line" />
      <div className="skel-line short" />
    </div>
  )
}
