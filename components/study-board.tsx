"use client"

import Link from "next/link"
import {
  CSSProperties,
  FC,
  memo,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
} from "react"
import { SEVERITY, SEVERITY_COLOR, label } from "@/lib/labels"
import {
  EMPTY_STUDY_QUERY,
  filterStudyRows,
  formatPeople,
  getTheme,
  hasKnownCause,
  StudyQuery,
  StudyRow,
  THEMES,
} from "@/lib/study"
import { firstSentence } from "@/lib/digest"
import { Tag, VerificationBadge } from "./ui"
import css from "./study-board.module.css"

// The open incident lives in the URL hash so a link to one case can be shared
// (the row carries that id, so the browser also scrolls to it natively).
// `useSearchParams` is avoided on purpose: under static export it would drop
// the whole list from the prerendered HTML.
const HASH_EVENT = "hashchange"
const subscribeHash = (fn: () => void) => {
  window.addEventListener(HASH_EVENT, fn)
  return () => window.removeEventListener(HASH_EVENT, fn)
}
const readHash = () => decodeURIComponent(window.location.hash.slice(1))
const writeHash = (slug: string) => {
  const { pathname, search } = window.location
  window.history.replaceState(
    null,
    "",
    `${pathname}${search}${slug ? `#${slug}` : ""}`
  )
  // replaceState does not fire hashchange by itself.
  window.dispatchEvent(new Event(HASH_EVENT))
}

// Pinned ("気になる") incidents are kept per browser.
const PIN_KEY = "bo-study-pins"
const PIN_EVENT = "bo-study-pins"
const subscribePins = (fn: () => void) => {
  window.addEventListener("storage", fn)
  window.addEventListener(PIN_EVENT, fn)
  return () => {
    window.removeEventListener("storage", fn)
    window.removeEventListener(PIN_EVENT, fn)
  }
}
const readPins = () => {
  try {
    return window.localStorage.getItem(PIN_KEY) ?? ""
  } catch {
    return ""
  }
}
const writePins = (slugs: string[]) => {
  try {
    window.localStorage.setItem(PIN_KEY, slugs.join(","))
  } catch {
    // Storage can be unavailable (private mode); pins are just not kept then.
  }
  window.dispatchEvent(new Event(PIN_EVENT))
}
const noHash = () => ""

const ItemView: FC<{
  row: StudyRow
  open: boolean
  pinned: boolean
  digest: boolean
  onToggle: (slug: string) => void
  onPin: (slug: string) => void
}> = ({ row: r, open, pinned, digest, onToggle, onPin }) => {
  const known = hasKnownCause(r)
  const questions = r.themes.flatMap(
    (t) => getTheme(t)?.questions.slice(0, 2) ?? []
  )
  return (
    <li
      id={r.slug}
      className={css.item}
      data-open={open}
      style={{ "--sev": SEVERITY_COLOR[r.severity] } as CSSProperties}
    >
      {/* A real link, so crawlers and no-JS readers reach the detail page;
          with JS a plain click expands the case in place instead. */}
      <a
        href={`/incidents/${r.slug}/`}
        className={css.summary}
        aria-expanded={open}
        onClick={(e) => {
          if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return
          e.preventDefault()
          onToggle(r.slug)
        }}
      >
        <span className={css.date}>{r.disclosedAt}</span>
        <span>
          <span className={css.title}>
            {pinned && (
              <span className={css.pin} aria-label="気になる">
                ★
              </span>
            )}
            {r.title}
          </span>
          <span className={css.sub}>
            <span>
              {label(SEVERITY, r.severity)}・{r.industry}
            </span>
            {r.themes.map((t) => (
              <span key={t} className={css.themeTag}>
                #{getTheme(t)?.name}
              </span>
            ))}
            {!known && <span className={css.unknown}>原因調査中</span>}
          </span>
        </span>
        <span className={css.people}>
          {r.affectedUsers != null && (
            <>
              {formatPeople(r.affectedUsers)}
              <small> 人</small>
            </>
          )}
        </span>
      </a>

      {digest && !open && (
        <dl className={css.digest}>
          <div>
            <dt>何が</dt>
            <dd>{firstSentence(r.summary)}</dd>
          </div>
          <div>
            <dt>なぜ</dt>
            <dd className={known ? undefined : css.unknown}>
              {r.cause ? firstSentence(r.cause) : "原因は調査中"}
            </dd>
          </div>
          {r.lessons[0] && (
            <div>
              <dt>どうする</dt>
              <dd>{r.lessons[0]}</dd>
            </div>
          )}
        </dl>
      )}

      {/* Only the open case is rendered: all bodies at once tripled the HTML. */}
      {open && (
        <div className={css.body}>
          <div className={css.questions}>
            <section className={css.panel}>
              <h3>
                <span>Q1</span>何が起きた？
              </h3>
              <p>{r.summary}</p>
              {r.leaked.length > 0 && (
                <>
                  <h4>漏えい・影響した情報</h4>
                  <ul>
                    {r.leaked.map((x) => (
                      <li key={x}>{x}</li>
                    ))}
                  </ul>
                </>
              )}
              <p className={css.facts}>
                <span>
                  対象:{" "}
                  <Link href={`/organizations/${r.organizationSlug}/`}>
                    {r.organization}
                  </Link>
                </span>
                <span>発生 {r.incidentDate ?? "不明"}</span>
                <span>発覚 {r.discoveredAt ?? "不明"}</span>
                <span>公表 {r.disclosedAt}</span>
              </p>
            </section>

            <section className={css.panel}>
              <h3>
                <span>Q2</span>なぜ防げなかった？
              </h3>
              <div className={css.tags}>
                <VerificationBadge value={r.causeStatus} />
                {r.factors.map((f) => (
                  <Tag key={f}>{f}</Tag>
                ))}
              </div>
              <p>{r.cause || "原因は公表されていません（調査中）。"}</p>
              {!known && (
                <p className={css.facts}>
                  公表情報だけでは原因を特定できません。続報を待つか、同種の事例から侵入経路の仮説を立ててみましょう。
                </p>
              )}
              {r.measures.length > 0 && (
                <>
                  <h4>当事者が取った対応</h4>
                  <ul>
                    {r.measures.map((x) => (
                      <li key={x}>{x}</li>
                    ))}
                  </ul>
                </>
              )}
            </section>

            <section className={css.panel}>
              <h3>
                <span>Q3</span>自分ならどうする？
              </h3>
              {r.lessons.length > 0 ? (
                <ul>
                  {r.lessons.map((x) => (
                    <li key={x}>{x}</li>
                  ))}
                </ul>
              ) : (
                <p className={css.facts}>
                  この事例の教訓はまだ整理されていません。
                </p>
              )}
              {questions.length > 0 && (
                <>
                  <h4>自分のサービスに置き換えると</h4>
                  <ul>
                    {questions.map((x) => (
                      <li key={x} className={css.ask}>
                        {x}
                      </li>
                    ))}
                  </ul>
                </>
              )}
            </section>
          </div>

          <div className={css.footer}>
            <ol className={css.sources} aria-label="出典">
              {r.sources.map((s) => (
                <li key={s.url}>
                  <a href={s.url} target="_blank" rel="noopener noreferrer">
                    {s.title}
                  </a>{" "}
                  <span>
                    {s.publisher}・{s.primary ? "一次情報" : "二次情報"}
                  </span>
                </li>
              ))}
            </ol>
            <div className={css.actions}>
              <button
                type="button"
                aria-pressed={pinned}
                onClick={() => onPin(r.slug)}
              >
                {pinned ? "★ 気になる（解除）" : "☆ 気になる"}
              </button>
              <Link href={`/incidents/${r.slug}/`}>経緯・影響の詳細 →</Link>
            </div>
          </div>
        </div>
      )}
    </li>
  )
}
// Toggling one case must not re-render the other few hundred.
const Item = memo(ItemView)

const isTyping = (t: EventTarget | null) =>
  t instanceof HTMLElement &&
  (t.isContentEditable || /^(INPUT|SELECT|TEXTAREA)$/.test(t.tagName))

export const StudyBoard: FC<{ rows: StudyRow[] }> = ({ rows }) => {
  const [q, setQ] = useState<StudyQuery>(EMPTY_STUDY_QUERY)
  const [pinnedOnly, setPinnedOnly] = useState(false)
  // "digest" adds one-line why/what-to-do under every row, for skimming.
  const [digest, setDigest] = useState(false)
  const open = useSyncExternalStore(subscribeHash, readHash, noHash)
  const pinText = useSyncExternalStore(subscribePins, readPins, noHash)
  const pins = useMemo(
    () => new Set(pinText.split(",").filter(Boolean)),
    [pinText]
  )
  const searchRef = useRef<HTMLInputElement>(null)

  const results = useMemo(() => {
    const hit = filterStudyRows(rows, q)
    return pinnedOnly ? hit.filter((r) => pins.has(r.slug)) : hit
  }, [rows, q, pinnedOnly, pins])
  const months = useMemo(
    () =>
      [...new Set(rows.map((r) => r.disclosedAt.slice(0, 7)))].sort().reverse(),
    [rows]
  )
  const themeCounts = useMemo(() => {
    const m = new Map<string, number>()
    for (const r of rows)
      for (const t of r.themes) m.set(t, (m.get(t) ?? 0) + 1)
    return m
  }, [rows])

  const set = (patch: Partial<StudyQuery>) =>
    setQ((prev) => ({ ...prev, ...patch }))
  const toggle = useCallback(
    (slug: string) => writeHash(readHash() === slug ? "" : slug),
    []
  )
  const pin = useCallback((slug: string) => {
    const next = new Set(readPins().split(",").filter(Boolean))
    if (!next.delete(slug)) next.add(slug)
    writePins([...next])
  }, [])

  // Collapsing the previous case shifts the page, so always bring the newly
  // opened one back to the top of the viewport.
  useEffect(() => {
    if (open) document.getElementById(open)?.scrollIntoView({ block: "start" })
  }, [open])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return
      if (isTyping(e.target)) {
        if (e.key === "Escape") (e.target as HTMLElement).blur()
        return
      }
      const move = (d: number) => {
        if (!results.length) return
        const at = results.findIndex((r) => r.slug === open)
        const next = at < 0 ? (d > 0 ? 0 : results.length - 1) : at + d
        writeHash(results[Math.min(Math.max(next, 0), results.length - 1)].slug)
      }
      const actions: Record<string, () => void> = {
        j: () => move(1),
        k: () => move(-1),
        r: () =>
          results.length &&
          writeHash(results[Math.floor(Math.random() * results.length)].slug),
        p: () => open && pin(open),
        d: () => setDigest((v) => !v),
        "/": () => searchRef.current?.focus(),
        Escape: () => writeHash(""),
      }
      const run = actions[e.key]
      if (!run) return
      e.preventDefault()
      run()
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [results, open, pin])

  return (
    <>
      <form
        role="search"
        className={css.toolbar}
        onSubmit={(e) => e.preventDefault()}
      >
        <input
          ref={searchRef}
          type="search"
          className={css.search}
          value={q.q}
          aria-label="キーワード"
          placeholder="キーワード（組織名・原因・対策など。空白区切りでAND）"
          onChange={(e) => set({ q: e.target.value })}
        />
        <div className={css.chips} role="group" aria-label="テーマで絞り込む">
          {THEMES.map((t) => (
            <button
              key={t.id}
              type="button"
              className={css.chip}
              aria-pressed={q.theme === t.id}
              onClick={() => set({ theme: q.theme === t.id ? "" : t.id })}
            >
              {t.name}
              <span className={css.chipCount}>
                {themeCounts.get(t.id) ?? 0}
              </span>
            </button>
          ))}
        </div>
        <div className={css.controls}>
          <label>
            <input
              type="checkbox"
              checked={q.knownCause}
              onChange={(e) => set({ knownCause: e.target.checked })}
            />
            原因が公表された事例のみ
          </label>
          <label>
            <input
              type="checkbox"
              checked={pinnedOnly}
              onChange={(e) => setPinnedOnly(e.target.checked)}
            />
            ★ 気になる（{pins.size}）
          </label>
          <label>
            公表月
            <select
              value={q.month}
              onChange={(e) => set({ month: e.target.value })}
            >
              <option value="">すべて</option>
              {months.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          </label>
          <label>
            並び順
            <select
              value={q.sort}
              onChange={(e) =>
                set({ sort: e.target.value as StudyQuery["sort"] })
              }
            >
              <option value="disclosed">公表日が新しい順</option>
              <option value="severity">深刻度順</option>
              <option value="affected">影響人数が多い順</option>
            </select>
          </label>
          <button
            type="button"
            disabled={!results.length}
            onClick={() =>
              writeHash(
                results[Math.floor(Math.random() * results.length)].slug
              )
            }
          >
            ランダムに1件
          </button>
          <button
            type="button"
            onClick={() => {
              setQ(EMPTY_STUDY_QUERY)
              setPinnedOnly(false)
            }}
          >
            条件をクリア
          </button>
        </div>
      </form>

      <div className={css.meta}>
        <span className={css.view}>
          <span aria-live="polite">
            {results.length} / {rows.length} 件
          </span>
          <span role="group" aria-label="表示">
            <button
              type="button"
              aria-pressed={!digest}
              onClick={() => setDigest(false)}
            >
              一覧
            </button>
            <button
              type="button"
              aria-pressed={digest}
              onClick={() => setDigest(true)}
            >
              ダイジェスト
            </button>
          </span>
        </span>
        <span className={css.keys}>
          <span>
            <kbd>j</kbd> <kbd>k</kbd> 次/前
          </span>
          <span>
            <kbd>r</kbd> ランダム
          </span>
          <span>
            <kbd>p</kbd> 気になる
          </span>
          <span>
            <kbd>/</kbd> 検索
          </span>
          <span>
            <kbd>d</kbd> ダイジェスト
          </span>
          <span>
            <kbd>Esc</kbd> 閉じる
          </span>
        </span>
      </div>

      {results.length ? (
        <ul className={css.list}>
          {results.map((r) => (
            <Item
              key={r.slug}
              row={r}
              open={r.slug === open}
              pinned={pins.has(r.slug)}
              digest={digest}
              onToggle={toggle}
              onPin={pin}
            />
          ))}
        </ul>
      ) : (
        <p style={{ color: "#59636e" }}>条件に一致する事例はありません。</p>
      )}
    </>
  )
}
