import { useParams, Link } from 'react-router-dom'

export default function ReaderPage() {
  const { id } = useParams()

  return (
    <div className="reader-page">
      <div className="reader-toolbar">
        <Link to="/" className="back">←</Link>
        <div className="book-name">书籍 #{id}</div>
      </div>
      <div className="placeholder-box">
        <p>🚧 阅读器将在 M3 里程碑实现（纵向滚动阅读、目录、字号 / 主题设置）</p>
      </div>
    </div>
  )
}
