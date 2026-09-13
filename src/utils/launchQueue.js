// 注册系统文件关联的接收端（Chrome/Edge File Handling API）
// 用户在资源管理器里选择"用 Derr1ck 阅读器打开"txt 后，
// 系统会以 launchQueue 的形式把文件句柄递给本应用。
const OPEN_FILE_EVENT = 'app-open-file'

async function readHandle(handle) {
  // 从文件管理器启动时通常已授权；未授权则申请一次读取权限
  if ((await handle.queryPermission({ mode: 'read' })) !== 'granted') {
    if ((await handle.requestPermission({ mode: 'read' })) !== 'granted') {
      throw new Error('未获得文件读取权限')
    }
  }
  return handle.getFile()
}

export function initLaunchQueue() {
  if (!('launchQueue' in window) || !window.launchQueue) return
  window.launchQueue.setConsumer(async params => {
    for (const handle of params.files) {
      try {
        const file = await readHandle(handle)
        window.dispatchEvent(new CustomEvent(OPEN_FILE_EVENT, { detail: file }))
      } catch (e) {
        window.dispatchEvent(new CustomEvent(OPEN_FILE_EVENT, {
          detail: { error: e.message || '无法读取该文件' },
        }))
      }
    }
  })
}

export { OPEN_FILE_EVENT }
