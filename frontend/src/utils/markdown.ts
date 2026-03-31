const IMAGE_FILE_EXTENSION_REGEX = /\.(?:apng|avif|bmp|gif|ico|jpe?g|png|svg|webp)$/i

const wrapMarkdownDestination = (destination = ''): string => {
  if (!destination || /^<.*>$/.test(destination) || !/\s/.test(destination)) {
    return destination
  }

  return `<${destination}>`
}

const shouldTreatAsWikiImage = (destination = ''): boolean => {
  const normalized = String(destination).split('#')[0].split('?')[0]
  return IMAGE_FILE_EXTENSION_REGEX.test(normalized)
}

const escapeMarkdownAltText = (altText = ''): string => (
  String(altText).replace(/\\/g, '\\\\').replace(/\[/g, '\\[').replace(/\]/g, '\\]')
)

const normalizeWikiImageEmbeds = (markdown = ''): string => {
  return String(markdown).replace(/!\[\[([^\]\n]+)\]\]/g, (match, inner) => {
    const [rawDestination = '', ...rawMeta] = String(inner).split('|')
    const destination = rawDestination.trim()
    if (!destination || !shouldTreatAsWikiImage(destination)) return match

    const wikiLabel = rawMeta.join('|').trim()
    const altText = wikiLabel && !/^\d+(?:x\d+)?$/i.test(wikiLabel) ? wikiLabel : ''

    return `![${escapeMarkdownAltText(altText)}](${wrapMarkdownDestination(destination)})`
  })
}

export const normalizeMarkdownImageDestinations = (markdown = ''): string => {
  return normalizeWikiImageEmbeds(markdown).replace(/!\[([^\]]*)\]\((?!<)([^)\n]+)\)/g, (match, altText, inner) => {
    const value = String(inner || '').trim()
    if (!value) return match

    const titleMatch = value.match(/^(.*?)(\s+"[^"]*")$/)
    const destination = (titleMatch ? titleMatch[1] : value).trim()
    const titleSuffix = titleMatch ? titleMatch[2] : ''

    if (!destination) {
      return match
    }

    return `![${altText}](${wrapMarkdownDestination(destination)}${titleSuffix})`
  })
}
