import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getAllBooks, removeBook } from '../db/db.js'
import BookCard from '../components/BookCard.jsx'
import ImportModal from '../components/ImportModal.jsx'

export default function LibraryPage({ theme, onThemeChange }) {
  const [books, setBooks] = useState([])
  const [showImport, setShowImport] = useState(false)
  const [toast, setToast] = useState('')
  const navigate = useNavigate()

  const loadBooks = useCallback(async () => {
    setBooks(await getAllBooks())
  }, [])

  useEffect(() => { loadBooks() }, [loadBooks])

  function showToast(msg) {
    setToast(msg)
    setTimeout(() => setToast(''), 1800)
  }

  function handleDelete(book) {
    if (!window.confirm(`确定删除《${book.title}》吗？阅读进度将一并删除，不可恢复。`)) return
    removeBook(book.id).then(() => {
      setBooks(prev => prev.filter(b => b.id !== book.id))
      showToast('已删除')
    })
  }

  return (
    <div className="lib-header">
      <div className="lib-title-row">
        <div>
          <h1>📚 我的书库</h1>
          <div className="sub">书籍仅保存在此浏览器的本地存储中</div>
        </div>
        <div className="header-actions">
          <div className="seg">
            {[
              { key: 'light', label: '浅色' },
              { key: 'sepia', label: '护眼' },
              { key: 'dark', label: '深色' },
            ].map(t => (
              <button
                key={t.key}
                className={theme === t.key ? 'active' : ''}
                onClick={() => onThemeChange(t.key)}
              >
                {t.label}
              </button>
            ))}
          </div>
          <button className="btn-primary" onClick={() => setShowImport(true)}>＋ 导入书籍</button>
        </div>
      </div>

      {books.length === 0 ? (
        <div className="empty-state">
          <div className="icon">📖</div>
          <p>书库还是空的，点击右上角「导入书籍」开始吧</p>
        </div>
      ) : (
        <div className="book-grid">
          {books.map(b => (
            <BookCard
              key={b.id}
              book={b}
              onOpen={book => navigate(`/reader/${book.id}`)}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}

      {showImport && (
        <ImportModal
          onClose={() => setShowImport(false)}
          onImported={book => {
            loadBooks()
            showToast(`《${book.title}》导入成功`)
          }}
        />
      )}

      {toast && <div className="toast show">{toast}</div>}
    </div>
  )
}
