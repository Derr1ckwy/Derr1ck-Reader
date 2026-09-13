import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { parseBookFile } from '../utils/importBook.js'
import { saveBook } from '../db/db.js'
import { setPreviewBook } from '../utils/previewStore.js'

/**
 * 系统"打开方式"递进来的文件：
 * 询问用户加入书库（持久保存）还是仅本次阅览（关闭后不留痕）。
 */
export default function ExternalOpenModal({ file, error, onClose, onImported, onPreview }) {
  const [parsing, setParsing] = useState(false)
  const [parseError, setParseError] = useState('')
  const navigate = useNavigate()

  async function handleParse(mode) {
    setParsing(true)
    setParseError('')
    try {
      const record = await parseBookFile(file)
      if (mode === 'library') {
        const id = await saveBook(record)
        onImported({ ...record, id })
      } else {
        setPreviewBook(record)
        onPreview()
      }
      onClose()
    } catch (e) {
      setParseError(e.message || '解析失败')
    } finally {
      setParsing(false)
    }
  }

  return (
    <div className="modal-mask" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <h3>打开文件</h3>
        {error ? (
          <>
            <div className="tip error-text">{error}</div>
            <div className="actions"><button className="btn-ghost" onClick={onClose}>关闭</button></div>
          </>
        ) : parseError ? (
          <>
            <div className="tip error-text">{parseError}</div>
            <div className="actions"><button className="btn-ghost" onClick={onClose}>关闭</button></div>
          </>
        ) : (
          <>
            <div className="tip">
              系统请求用 Derr1ck 阅读器打开：<br />
              <b>{file.name}</b>（{(file.size / 1024).toFixed(1)} KB）<br /><br />
              选择处理方式：
            </div>
            <div className="external-actions">
              <button
                className="external-option"
                disabled={parsing}
                onClick={() => handleParse('library')}
              >
                <span className="external-icon">📚</span>
                <span className="external-title">加入书库</span>
                <span className="external-desc">保存到浏览器本地，下次从书库继续阅读</span>
              </button>
              <button
                className="external-option"
                disabled={parsing}
                onClick={() => handleParse('preview')}
              >
                <span className="external-icon">👀</span>
                <span className="external-title">仅本次阅览</span>
                <span className="external-desc">关闭后不留痕迹，不占用书库空间</span>
              </button>
            </div>
            {parsing && <div className="tip" style={{ marginTop: 12 }}>正在解析…</div>}
            <div className="actions">
              <button className="btn-ghost" onClick={onClose}>取消</button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
