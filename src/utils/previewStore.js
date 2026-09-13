// 系统通过"打开方式"把文件递进来时的内存暂存（不入库，用于"仅本次阅览"）
let previewBook = null

export function setPreviewBook(book) {
  previewBook = book
}

export function getPreviewBook() {
  return previewBook
}

export function clearPreviewBook() {
  previewBook = null
}
