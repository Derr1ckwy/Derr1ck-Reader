import { useRef, useState } from 'react'
import { parseBookFile, LARGE_FILE_THRESHOLD } from '../utils/importBook.js'
import { saveBook } from '../db/db.js'

const STEPS = { SELECT: 'select', CONFIRM_LARGE: 'confirm-large', PARSING: 'parsing', ERROR: 'error' }

export default function ImportModal({ onClose, onImported }) {
  const [step, setStep] = useState(STEPS.SELECT)
  const [pendingFile, setPendingFile] = useState(null)
  const [error, setError] = useState('')
  const [dragOver, setDragOver] = useState(false)
  const inputRef = useRef(null)

  function pickFile(file) {
    if (!file) return
    setError('')
    if (file.size > LARGE_FILE_THRESHOLD) {
      setPendingFile(file)
      setStep(STEPS.CONFIRM_LARGE)
    } else {
      doParse(file)
    }
  }

  async function doParse(file) {
    setStep(STEPS.PARSING)
    try {
      const record = await parseBookFile(file)
      const id = await saveBook(record)
      onImported({ ...record, id })
      onClose()
    } catch (e) {
      setError(e.message || '解析失败，文件可能已损坏')
      setStep(STEPS.ERROR)
    }
  }

  function handleDrop(e) {
    e.preventDefault()
    setDragOver(false)
    pickFile(e.dataTransfer.files[0])
  }

  return (
    <div className="modal-mask" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        {step === STEPS.SELECT && (
          <>
            <h3>导入书籍</h3>
            <div className="tip">
              支持格式：<code>EPUB</code>、<code>TXT</code><br />
              TXT 文件仅支持 <code>UTF-8</code> 编码，其他编码请先用编辑器转码。<br />
              书籍仅保存在浏览器本地，不会上传。
            </div>
            <div
              className={`drop-zone ${dragOver ? 'drag-over' : ''}`}
              onClick={() => inputRef.current.click()}
              onDragOver={e => { e.preventDefault(); setDragOver(true) }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
            >
              📂 点击选择文件，或将文件拖拽到此处
            </div>
            <input
              ref={inputRef}
              type="file"
              accept=".epub,.txt"
              className="hidden"
              onChange={e => { pickFile(e.target.files[0]); e.target.value = '' }}
            />
            <div className="actions">
              <button className="btn-ghost" onClick={onClose}>取消</button>
            </div>
          </>
        )}

        {step === STEPS.CONFIRM_LARGE && (
          <>
            <h3>⚠️ 文件较大</h3>
            <div className="tip">
              「{pendingFile.name}」大小为 <b>{(pendingFile.size / 1024 / 1024).toFixed(1)} MB</b>
              ，解析可能需要一些时间。导入过程中可以随时取消，要继续吗？
            </div>
            <div className="actions">
              <button className="btn-ghost" onClick={onClose}>取消</button>
              <button className="btn-primary" onClick={() => doParse(pendingFile)}>继续导入</button>
            </div>
          </>
        )}

        {step === STEPS.PARSING && (
          <>
            <h3>正在解析…</h3>
            <div className="tip">正在解析「{pendingFile?.name || '文件'}」，请稍候</div>
            <div className="loading-bar"><div className="indeterminate" /></div>
            <div className="actions">
              <button className="btn-ghost" onClick={onClose}>取消</button>
            </div>
          </>
        )}

        {step === STEPS.ERROR && (
          <>
            <h3>导入失败</h3>
            <div className="tip error-text">{error}</div>
            <div className="actions">
              <button className="btn-ghost" onClick={onClose}>关闭</button>
              <button className="btn-primary" onClick={() => setStep(STEPS.SELECT)}>重试</button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
