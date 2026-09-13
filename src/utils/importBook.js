import('epubjs') // 动态引入：epubjs 体积较大，仅在导入 EPUB 时加载

// 大文件阈值：超过则提示"解析可能需要一些时间"（见产品设计文档 4.5）
export const LARGE_FILE_THRESHOLD = 20 * 1024 * 1024 // 20MB

/**
 * 解析用户选择的文件，返回可入库的书籍记录。
 * 失败时抛出带中文提示的 Error。
 */
export async function parseBookFile(file) {
  const ext = file.name.split('.').pop().toLowerCase()
  if (ext === 'txt') return parseTxt(file)
  if (ext === 'epub') return parseEpub(file)
  throw new Error('不支持的格式：仅支持 EPUB / TXT 文件')
}

/** TXT：仅支持 UTF-8（MVP 约定，不做自动转码），按"第X章"切分章节 */
async function parseTxt(file) {
  const buf = await file.arrayBuffer()
  let text
  try {
    text = new TextDecoder('utf-8', { fatal: true }).decode(buf)
  } catch {
    throw new Error('该 TXT 文件不是 UTF-8 编码，请先用编辑器（如 VS Code、Notepad++）转为 UTF-8 后再导入')
  }
  const chapters = splitChapters(text)
  return {
    title: file.name.replace(/\.txt$/i, ''),
    author: '',
    format: 'txt',
    cover: null,
    toc: chapters.map(c => c.title),
    chapters,
    file,
    size: file.size,
    progress: 0,
    addedAt: Date.now(),
  }
}

/** 按"第X章/节/回/卷/部"标题切章；无匹配时整篇作为一章 */
function splitChapters(text) {
  const re = /^\s*(第[一二三四五六七八九十百千零\d]+[章节回卷部][^\n]*)$/gm
  const matches = [...text.matchAll(re)]
  if (matches.length === 0) return [{ title: '全文', content: text.trim() }]
  const chapters = []
  for (let i = 0; i < matches.length; i++) {
    const start = matches[i].index
    const end = i + 1 < matches.length ? matches[i + 1].index : text.length
    chapters.push({ title: matches[i][1].trim(), content: text.slice(start, end).trim() })
  }
  return chapters
}

/** EPUB：解析元数据、封面、目录；原始文件入库，阅读时再重新解析渲染（M3） */
async function parseEpub(file) {
  const { default: ePub } = await import('epubjs')
  const buf = await file.arrayBuffer()
  const book = ePub(buf)
  try {
    await book.ready
    await Promise.all([book.loaded.metadata, book.loaded.navigation])
    const meta = book.package.metadata
    const toc = (book.navigation?.toc || []).map(t => t.label.trim())

    let cover = null
    try {
      const url = await book.coverUrl()
      if (url) cover = await blobUrlToDataUrl(url)
    } catch {
      // 无封面，使用占位封面
    }

    return {
      title: meta.title || file.name.replace(/\.epub$/i, ''),
      author: meta.creator || '',
      format: 'epub',
      cover,
      toc,
      chapters: [], // EPUB 章节在 M3 阅读时按需从文件渲染
      file,
      size: file.size,
      progress: 0,
      addedAt: Date.now(),
    }
  } finally {
    book.destroy()
  }
}

async function blobUrlToDataUrl(url) {
  const blob = await (await fetch(url)).blob()
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result)
    reader.onerror = reject
    reader.readAsDataURL(blob)
  })
}
