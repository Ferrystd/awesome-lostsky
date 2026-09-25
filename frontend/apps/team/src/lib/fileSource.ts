export function fileSourceLabel(source: unknown): string {
  switch (source) {
    case 'manual': return '手动上传'
    case 'markdown': return 'Markdown 上传'
    case 'attachment': return '表单附件'
    case 'join': return '加入申请'
    case 'command': return '命令上传'
    case 'system': return '系统上传'
    default: return '未知来源'
  }
}
