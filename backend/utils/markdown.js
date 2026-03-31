const IMAGE_FILE_EXTENSION_REGEX = /\.(?:apng|avif|bmp|gif|ico|jpe?g|png|svg|webp)$/i
const MARKDOWN_IMAGE_REGEX = /!\[([^\]]*)\]\((?:<([^>\n]+)>|([^)]+?))(?:\s+"([^"]*)")?\)/g

function wrapMarkdownDestination(destination = '') {
  if (!destination || /^<.*>$/.test(destination) || !/\s/.test(destination)) {
    return destination
  }

  return `<${destination}>`
}

function shouldTreatAsWikiImage(destination = '') {
  const normalized = String(destination).split('#')[0].split('?')[0]
  return IMAGE_FILE_EXTENSION_REGEX.test(normalized)
}

function escapeMarkdownAltText(altText = '') {
  return String(altText)
    .replace(/\\/g, '\\\\')
    .replace(/\[/g, '\\[')
    .replace(/\]/g, '\\]')
}

function normalizeWikiImageEmbeds(markdown = '') {
  return String(markdown).replace(/!\[\[([^\]\n]+)\]\]/g, (match, inner) => {
    const [rawDestination = '', ...rawMeta] = String(inner).split('|')
    const destination = rawDestination.trim()
    if (!destination || !shouldTreatAsWikiImage(destination)) return match

    const wikiLabel = rawMeta.join('|').trim()
    const altText = wikiLabel && !/^\d+(?:x\d+)?$/i.test(wikiLabel) ? wikiLabel : ''

    return `![${escapeMarkdownAltText(altText)}](${wrapMarkdownDestination(destination)})`
  })
}

function splitMarkdownImageInner(inner = '') {
  const value = String(inner).trim()
  if (!value) {
    return { destination: '', titleSuffix: '' }
  }

  const titleMatch = value.match(/^(.*?)(\s+"[^"]*")$/)
  if (titleMatch) {
    return {
      destination: titleMatch[1].trim(),
      titleSuffix: titleMatch[2]
    }
  }

  return {
    destination: value,
    titleSuffix: ''
  }
}

function normalizeMarkdownImageDestinations(markdown = '') {
  return normalizeWikiImageEmbeds(markdown).replace(/!\[([^\]]*)\]\((?!<)([^)\n]+)\)/g, (match, altText, inner) => {
    const { destination, titleSuffix } = splitMarkdownImageInner(inner)

    if (!destination) {
      return match
    }

    return `![${altText}](${wrapMarkdownDestination(destination)}${titleSuffix})`
  })
}

module.exports = {
  MARKDOWN_IMAGE_REGEX,
  normalizeMarkdownImageDestinations
}
