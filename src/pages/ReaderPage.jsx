import { useEffect, useRef, useState, useCallback } from 'react'
import { useParams, Link } from 'react-router-dom'
import { db } from '../db/db.js'

const FONT_SIZES = [
  { v: 16, label: '小' },
  { v: 18, label: '标准' },
  { v: 21, label: '大' },
  { v: 24, label: '特大' },
]
const LINE_HEIGHTS = [
  { v: 1.6, label: '紧凑' },
  { v: 1.9, label: '标准' },
  { v: 2.3, label: '宽松' },
]
const THEMES = [
  { key: 'light', label: '浅色' },
  { key: 'sepia', label: '护眼' },
  { key: 'dark', label: '深色' },
]

export default function ReaderPage({ theme, onThemeChange }) {
  const { id } = useParams()
  const bookId = Number(id)

  const [book, setBook] = useState(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  // 章节列表（TXT 与 EPUB 统一）：{ title, index }
  const [chapters, setChapters] = useState([])
  const [currentChapter, setCurrentChapter] = useState(0)
  const [progress, setProgress] = useState(0)
  const [toolbarHidden, setToolbarHidden] = useState(false)
  const [showToc, setShowToc] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [fontSize, setFontSize] = useState(18)
  const [lineHeight, setLineHeight] = useState(1.9)
  const [toast, setToast] = useState('')

  const bodyRef = useRef(null)
  const epubRef = useRef(null)
  const renditionsRef = useRef([])
  const saveTimer = useRef(null)
  const lastScrollY = useRef(0)
  const progressRef = useRef(0)

  const showToast = useCallback(msg => {
    setToast(msg)
    setTimeout(() => setToast(''), 1800)
  }, [])

  /* ---------- 加载书籍并渲染 ---------- */
  useEffect(() => {
    let cancelled = false

    async function load() {
      const record = await db.books.get(bookId)
      if (!record) {
        if (!cancelled) { setError('未找到这本书，可能已被删除'); setLoading(false) }
        return
      }
      if (cancelled) return
      setBook(record)
      setProgress(record.progress || 0)
      progressRef.current = record.progress || 0

      try {
        if (record.format === 'txt') {
          setChapters(record.chapters.map((c, i) => ({ title: c.title, index: i })))
        } else {
          await renderEpub(record)
        }
      } catch (e) {
        if (!cancelled) setError('书籍解析失败，文件可能已损坏')
      }
      if (cancelled) return

      setLoading(false)
      // 恢复到上次阅读位置
      const pct = record.progress || 0
      if (pct > 0) {
        requestAnimationFrame(() => {
          const total = document.documentElement.scrollHeight - window.innerHeight
          window.scrollTo(0, (pct / 100) * total)
          showToast(`已恢复到上次阅读位置（${Math.round(pct)}%）`)
        })
      }
    }

    async function renderEpub(record) {
      const { default: ePub } = await import('epubjs')
      const buf = await record.file.arrayBuffer()
      const epub = ePub(buf)
      epubRef.current = epub
      await epub.ready
      await Promise.all([epub.loaded.metadata, epub.loaded.navigation])

      // 目录标签映射
      const nav = epub.navigation?.toc || []
      const labels = new Map(nav.map(t => [t.href.split('#')[0], t.label.trim()]))

      const container = bodyRef.current
      const list = []
      for (const sec of epub.spine.spineItems) {
        if (sec.linear === 'no') continue
        const wrap = document.createElement('div')
        wrap.className = 'epub-section'
        container.appendChild(wrap)
        const rendition = epub.renderTo(wrap, { width: '100%', flow: 'scrolled-doc' })
        await rendition.display(sec.href)
        rendition.themes.fontSize(fontSizeRef.current + 'px')
        rendition.themes.default({ body: { 'line-height': String(lineHeightRef.current) } })
        renditionsRef.current.push(rendition)
        list.push({
          title: labels.get(sec.href.split('#')[0]) || `第 ${list.length + 1} 节`,
          index: list.length,
        })
      }
      setChapters(list)
    }

    load()
    return () => {
      cancelled = true
      clearTimeout(saveTimer.current)
      renditionsRef.current = []
      epubRef.current?.destroy()
      epubRef.current = null
      // 离开时保存进度
      if (progressRef.current > 0) {
        db.books.update(bookId, { progress: progressRef.current }).catch(() => {})
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bookId])

  // 设置变化时同步到已渲染的 EPUB 章节
  const fontSizeRef = useRef(fontSize)
  const lineHeightRef = useRef(lineHeight)
  useEffect(() => {
    fontSizeRef.current = fontSize
    lineHeightRef.current = lineHeight
    renditionsRef.current.forEach(r => {
      r.themes.fontSize(fontSize + 'px')
      r.themes.default({ body: { 'line-height': String(lineHeight) } })
    })
  }, [fontSize, lineHeight])

  /* ---------- 滚动：进度条 + 当前章节 + 工具栏隐藏 + 防抖保存 ---------- */
  useEffect(() => {
    function onScroll() {
      if (loading) return
      const total = document.documentElement.scrollHeight - window.innerHeight
      const pct = total > 0 ? Math.min(100, (window.scrollY / total) * 100) : 0
      setProgress(pct)
      progressRef.current = pct

      // 工具栏：向下滚隐藏，向上滚显示
      if (window.scrollY > lastScrollY.current + 4 && window.scrollY > 80) {
        setToolbarHidden(true)
      } else if (window.scrollY < lastScrollY.current - 4) {
        setToolbarHidden(false)
      }
      lastScrollY.current = window.scrollY

      // 当前章节
      const els = bodyRef.current?.querySelectorAll('.txt-chapter, .epub-section') || []
      let cur = 0
      els.forEach((el, i) => { if (el.getBoundingClientRect().top < 120) cur = i })
      setCurrentChapter(cur)

      // 防抖保存
      clearTimeout(saveTimer.current)
      saveTimer.current = setTimeout(() => {
        db.books.update(bookId, { progress: Math.round(pct) }).catch(() => {})
      }, 1200)
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [loading, bookId])

  // 鼠标移到屏幕顶部时显示工具栏
  useEffect(() => {
    function onMouseMove(e) {
      if (e.clientY < 60) setToolbarHidden(false)
    }
    window.addEventListener('mousemove', onMouseMove)
    return () => window.removeEventListener('mousemove', onMouseMove)
  }, [])

  function jumpToChapter(index) {
    const els = bodyRef.current?.querySelectorAll('.txt-chapter, .epub-section') || []
    els[index]?.scrollIntoView({ behavior: 'smooth' })
    setShowToc(false)
  }

  return (
    <div className="reader-page">
      <div className="reader-progress" style={{ width: `${progress}%` }} />

      <div className={`reader-toolbar ${toolbarHidden ? 'hidden-bar' : ''}`}>
        <Link to="/" className="back">←</Link>
        <div className="book-name">{book?.title || '…'}</div>
        <button className="icon-btn" onClick={() => setShowToc(true)}>☰ 目录</button>
        <button className="icon-btn" onClick={() => setShowSettings(true)}>⚙ 设置</button>
      </div>

      {loading && <div className="reader-status">正在打开书籍…</div>}
      {error && <div className="reader-status error-text">{error}</div>}

      {/* TXT：直接渲染入库时已切分的章节 */}
      {!loading && book?.format === 'txt' && (
        <div
          className="reader-body"
          ref={bodyRef}
          style={{ fontSize: `${fontSize}px`, lineHeight }}
        >
          {book.chapters.map((c, i) => (
            <div className="txt-chapter" key={i} id={`ch-${i}`}>
              <h2 className="chapter-title">{c.title}</h2>
              {c.content.split(/\n+/).filter(Boolean).map((p, j) => (
                <p key={j}>{p}</p>
              ))}
            </div>
          ))}
        </div>
      )}

      {/* EPUB：由 epub.js 按 spine 分节渲染进此容器 */}
      {!loading && book?.format === 'epub' && (
        <div
          className="reader-body"
          ref={bodyRef}
          style={{ fontSize: `${fontSize}px`, lineHeight }}
        />
      )}

      {!loading && !error && (
        <div className="reader-footer">—— 全文完 ——</div>
      )}

      {/* 目录抽屉 */}
      {showToc && (
        <>
          <div className="drawer-mask" onClick={() => setShowToc(false)} />
          <div className="drawer">
            <h3>📑 目录</h3>
            {chapters.map((c, i) => (
              <div
                key={i}
                className={`toc-item ${i === currentChapter ? 'current' : ''}`}
                onClick={() => jumpToChapter(i)}
              >
                {c.title}
              </div>
            ))}
          </div>
        </>
      )}

      {/* 设置面板 */}
      {showSettings && (
        <>
          <div className="drawer-mask" onClick={() => setShowSettings(false)} />
          <div className="settings-panel">
            <h3>⚙ 阅读设置</h3>
            <div className="setting-group">
              <label>字号</label>
              <div className="seg">
                {FONT_SIZES.map(f => (
                  <button
                    key={f.v}
                    className={fontSize === f.v ? 'active' : ''}
                    onClick={() => setFontSize(f.v)}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </div>
            <div className="setting-group">
              <label>行距</label>
              <div className="seg">
                {LINE_HEIGHTS.map(l => (
                  <button
                    key={l.v}
                    className={lineHeight === l.v ? 'active' : ''}
                    onClick={() => setLineHeight(l.v)}
                  >
                    {l.label}
                  </button>
                ))}
              </div>
            </div>
            <div className="setting-group">
              <label>主题</label>
              <div className="theme-dots">
                {THEMES.map(t => (
                  <div
                    key={t.key}
                    className={`theme-dot ${t.key} ${theme === t.key ? 'active' : ''}`}
                    title={t.label}
                    onClick={() => onThemeChange(t.key)}
                  />
                ))}
              </div>
            </div>
          </div>
        </>
      )}

      {toast && <div className="toast show">{toast}</div>}
    </div>
  )
}
