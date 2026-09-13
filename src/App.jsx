import { useState } from 'react'
import { Routes, Route } from 'react-router-dom'
import LibraryPage from './pages/LibraryPage.jsx'
import ReaderPage from './pages/ReaderPage.jsx'

export default function App() {
  // 全局主题：light 浅色 / sepia 护眼 / dark 深色（详见 docs/产品设计文档.md 4.3）
  const [theme, setTheme] = useState('light')

  return (
    <div className="app" data-theme={theme}>
      <Routes>
        <Route path="/" element={<LibraryPage theme={theme} onThemeChange={setTheme} />} />
        <Route path="/reader/:id" element={<ReaderPage theme={theme} onThemeChange={setTheme} />} />
      </Routes>
    </div>
  )
}
