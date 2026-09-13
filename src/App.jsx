import { useEffect, useState } from 'react'
import { Routes, Route, useNavigate } from 'react-router-dom'
import { registerSW } from 'virtual:pwa-register'
import LibraryPage from './pages/LibraryPage.jsx'
import ReaderPage from './pages/ReaderPage.jsx'
import ExternalOpenModal from './components/ExternalOpenModal.jsx'
import { initLaunchQueue, OPEN_FILE_EVENT } from './utils/launchQueue.js'

export default function App() {
  // 全局主题：light 浅色 / sepia 护眼 / dark 深色（详见 docs/产品设计文档.md 4.3）
  const [theme, setTheme] = useState('light')
  // 系统"打开方式"递进来的待处理文件
  const [externalFile, setExternalFile] = useState(null)
  const [externalError, setExternalError] = useState('')
  const navigate = useNavigate()

  useEffect(() => {
    // PWA：注册 Service Worker，让应用可安装、可离线
    registerSW({ immediate: true })
    // 注册系统文件关联接收端（右键 txt → 打开方式 → 本应用）
    initLaunchQueue()

    function onOpenFile(e) {
      if (e.detail?.error) {
        setExternalError(e.detail.error)
      } else {
        setExternalFile(e.detail)
      }
    }
    window.addEventListener(OPEN_FILE_EVENT, onOpenFile)
    return () => window.removeEventListener(OPEN_FILE_EVENT, onOpenFile)
  }, [])

  return (
    <div className="app" data-theme={theme}>
      <Routes>
        <Route path="/" element={<LibraryPage theme={theme} onThemeChange={setTheme} />} />
        <Route path="/reader/:id" element={<ReaderPage theme={theme} onThemeChange={setTheme} />} />
      </Routes>

      {(externalFile || externalError) && (
        <ExternalOpenModal
          file={externalFile}
          error={externalError}
          onClose={() => { setExternalFile(null); setExternalError('') }}
          onImported={book => navigate(`/reader/${book.id}`)}
          onPreview={() => navigate('/reader/preview')}
        />
      )}
    </div>
  )
}
