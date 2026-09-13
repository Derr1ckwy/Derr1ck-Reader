const THEMES = [
  { key: 'light', label: '浅色' },
  { key: 'sepia', label: '护眼' },
  { key: 'dark', label: '深色' },
]

export default function LibraryPage({ theme, onThemeChange }) {
  return (
    <div className="lib-header">
      <div>
        <h1>📚 我的书库</h1>
        <div className="sub">Derr1ck 阅读器 · M1 骨架</div>
      </div>
      <div className="header-actions">
        <div className="seg">
          {THEMES.map(t => (
            <button
              key={t.key}
              className={theme === t.key ? 'active' : ''}
              onClick={() => onThemeChange(t.key)}
            >
              {t.label}
            </button>
          ))}
        </div>
        <button className="btn-primary" disabled title="M2 里程碑实现">
          ＋ 导入书籍
        </button>
      </div>
      <div className="placeholder-box">
        <p>🚧 书库功能将在 M2 里程碑实现（EPUB / TXT 导入、IndexedDB 存储、封面网格）</p>
        <p>
          可以先看看 <code>demo/index.html</code> 中的界面流程 Demo
        </p>
      </div>
    </div>
  )
}
