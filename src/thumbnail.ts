// @ts-ignore
import JSSoup from 'jssoup'
import axios from 'axios'

export const getThumbnailUrl = async (link: string) => {
  let response = await axios.get(link)

  let contentType = response.headers['content-type']

  if (
    response.status !== 200 ||
    (!contentType.startsWith('text/html') && !contentType.startsWith('image/'))
  )
    return null

  if (contentType.startsWith('image/')) return link
  else if (contentType.startsWith('text/html')) {
    const soup = new JSSoup(response.data)
    const metas = ['og:image', 'twitter:image', 'thumbnail']
    let img
    for (const meta of metas) {
      img = soup.find('meta', { name: meta })
      if (!img) continue
      try {
        response = await axios.get(img.attrs.content)
      } catch (e) {
        continue
      }
      break
    }
    if (!img || !response || response.status !== 200) {
      const imgs = soup.findAll('img')
      if (!imgs) return null

      for (const img of imgs) {
        if (!img.attrs.src) continue
        let src = img.attrs.src
        if (src.startsWith('https://')) {
          src = src
        } else if (src.startsWith('http://')) {
          src = `https://${src.split('http://')[1]}`
        } else if (src.startsWith('//')) {
          src = `https:${src}`
        } else if (src.startsWith('/')) return null
        else {
          src = `${link}${link.endsWith('/') ? '' : '/'}${src}`
        }

        response = await axios.get(src)

        if (response.status !== 200) continue

        contentType = response.headers['content-type']

        if (!contentType.startsWith('image/')) continue

        if (contentType.startsWith('image/svg')) continue

        return src
      }
    }
  }
  return null
}
