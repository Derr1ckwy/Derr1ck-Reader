const PALETTES = [
  ['#1a2f4a', '#2e5a8f'],
  ['#5a2e1a', '#8f5a2e'],
  ['#2e4a1a', '#5a8f2e'],
  ['#4a1a2f', '#8f2e5a'],
]

/** 无封面时按书名生成稳定的渐变色 */
function paletteFor(title) {
  let hash = 0
  for (const ch of title) hash = (hash * 31 + ch.charCodeAt(0)) >>> 0
  return PALETTES[hash % PALETTES.length]
}

export default function BookCard({ book, onOpen, onDelete }) {
  const [c0, c1] = paletteFor(book.title)
  const progress = Math.round(book.progress || 0)

  return (
    <div className="book-card" onClick={() => onOpen(book)}>
      <div
        className="book-cover"
        style={book.cover
          ? { backgroundImage: `url(${book.cover})`, backgroundSize: 'cover', backgroundPosition: 'center' }
          : { background: `linear-gradient(135deg, ${c0}, ${c1})` }}
      >
        {!book.cover && <span className="cover-title">{book.title}</span>}
        <button
          className="del"
          title="删除"
          onClick={e => { e.stopPropagation(); onDelete(book) }}
        >
          ✕
        </button>
      </div>
      <div className="book-info">
        <div className="book-title">{book.title}</div>
        <div className="book-author">{book.author || (book.format === 'txt' ? '本地 TXT' : '本地 EPUB')}</div>
        <div className="progress-track">
          <div className="progress-fill" style={{ width: `${progress}%` }} />
        </div>
        <div className="progress-text">{progress > 0 ? `已读 ${progress}%` : '未开始'}</div>
      </div>
    </div>
  )
}
