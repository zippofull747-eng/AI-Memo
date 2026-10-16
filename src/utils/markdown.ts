interface RewriteNode {
  type: string
  tagName?: string
  properties?: Record<string, unknown>
}

// 외부(http/https) 링크는 새 탭에서 열어 앱을 벗어나지 않도록 한다
export const openExternalLinksInNewTab = (node: RewriteNode): void => {
  if (node.type !== 'element' || node.tagName !== 'a' || !node.properties) {
    return
  }

  const href = node.properties.href
  if (typeof href === 'string' && /^https?:\/\//i.test(href)) {
    node.properties.target = '_blank'
    node.properties.rel = 'noopener noreferrer'
  }
}
