import Dexie from 'dexie'

// 本地数据库：书籍（含原始文件、封面、目录）全部存在浏览器 IndexedDB，不上传
// 见 docs/产品设计文档.md 三、技术方案
export const db = new Dexie('derr1ck-reader')

db.version(1).stores({
  books: '++id, title, addedAt',
})

/** 获取全部书籍（新的在前） */
export async function getAllBooks() {
  return db.books.orderBy('addedAt').reverse().toArray()
}

/** 保存书籍记录 */
export async function saveBook(record) {
  return db.books.add(record)
}

/** 删除书籍 */
export async function removeBook(id) {
  return db.books.delete(id)
}
