const presence = new Presence({
  clientId: '1384869884281753680',
})

async function getStrings() {
  return presence.getStrings({
    editTheirPersonnalInfo: 'tbm.editTheirPersonnalInfo',
    deleteAccount: 'tbm.deleteAccount',
    searchStop: 'tbm.searchStop',
    searchRoutes: 'tbm.searchRoutes',
    viewLinesSchedules: 'tbm.viewLinesSchedules',
    viewSchedules: 'tbm.viewSchedules',
    viewPointsScale: 'tbm.viewPointsScale',
    viewHelpPage: 'tbm.viewHelpPage',
    viewDocumentation: 'tbm.viewDocumentation',
    viewTheirOrders: 'tbm.viewTheirOrders',
    viewTheirPointsHistory: 'tbm.viewTheirPointsHistory',
    viewTheirProfile: 'tbm.viewTheirProfile',
    viewDashboard: 'tbm.viewDashboard',
    viewOffer: 'tbm.viewOffer',
    viewShop: 'tbm.viewShop',
    viewHome: 'general.viewHome',
    viewPage: 'general.viewPage',
    stop: 'tbm.stop',
    direction: 'tbm.direction',
    noData: 'tbm.noData',
    from: 'tbm.from',
    to: 'tbm.to',
    viewTrafficInfos: 'tbm.viewTrafficInfos',
    viewTrafficInfo: 'tbm.viewTrafficInfo',
    viewLines: 'tbm.viewLines',
    viewLineInfos: 'tbm.viewLineInfos',
  })
}
const browsingTimestamp = Math.floor(Date.now() / 1000)

enum ActivityAssets {
  Logo = 'https://i.imgur.com/V58nPdz.png',
  OldLogo = 'https://i.imgur.com/eCEEw2y.jpeg',
  NewLogo = 'https://i.imgur.com/k3THrqd.png',
  TBMFid = 'https://i.imgur.com/N7EXvDG.png',
  Routes = 'https://i.imgur.com/8nhzMN3.png',
  Schedules = 'https://i.imgur.com/85krl3t.png',
  Traffic = 'https://i.imgur.com/QyNoz05.png',
}

async function svgToPng(svgUrl: string): Promise<string | undefined> {
  if (!svgUrl || !svgUrl.endsWith('.svg'))
    return

  const response = await fetch(svgUrl)
  const svgText = await response.text()

  const fillMatch = svgText.match(/<rect[^>]*fill="([^"]+)"/i)
  const backgroundColor = fillMatch ? fillMatch[1] : '#ffffff'

  const img = new Image()
  const svgBlob = new Blob([svgText], { type: 'image/svg+xml' })
  const url = URL.createObjectURL(svgBlob)
  img.src = url

  await new Promise((resolve, reject) => {
    img.onload = resolve
    img.onerror = reject
  })

  const maxSize = Math.max(img.width, img.height)
  const canvas = document.createElement('canvas')
  canvas.width = maxSize
  canvas.height = maxSize
  const ctx = canvas.getContext('2d')

  let png: string | undefined
  if (ctx) {
    ctx.fillStyle = backgroundColor!
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    const x = (maxSize - img.width) / 2
    const y = (maxSize - img.height) / 2
    ctx.drawImage(img, x, y, img.width, img.height)

    png = canvas.toDataURL('image/png')
  }

  URL.revokeObjectURL(url)
  return png
}

presence.on('UpdateData', async () => {
  const logo = await presence.getSetting<number>('logo')
  const presenceData: PresenceData = {
    details: 'null',
    largeImageKey: [ActivityAssets.Logo, ActivityAssets.OldLogo, ActivityAssets.NewLogo][logo] || ActivityAssets.Logo,
    startTimestamp: browsingTimestamp,
  }
  const strings = await getStrings()
  const path = document.location.pathname?.split('/')
  let svgImg: HTMLImageElement | null = null

  switch (document.location.hostname) {
    case 'www.infotbm.com': {
      if (document.querySelector('main > div.homepage')) {
        presenceData.details = strings.viewHome
      }
      else if (document.querySelector('main > div.schedules')) {
        presenceData.details = strings.viewLinesSchedules
        presenceData.smallImageKey = ActivityAssets.Schedules
      }
      if (document.querySelector('main > div.schedules-results')) {
        presenceData.details = strings.searchStop
        presenceData.state = `${strings.direction} ${document.querySelector('.direction-wrapper > a.active p:nth-of-type(2)')?.textContent || ''}`
        svgImg = document.querySelector<HTMLImageElement>('.tbm-lines-name-wrapper > img')
        if (svgImg) {
          presenceData.smallImageKey = await svgToPng(svgImg?.src)
          presenceData.smallImageText = svgImg?.alt
        }
      }
      else if (document.querySelector('main > div.schedules-detail')) {
        presenceData.details = strings.viewSchedules
        presenceData.state = `${strings.stop} ${document.querySelector('.tbm-lines-name-wrapper')?.textContent} - ${strings.direction} ${document.querySelector('svg[aria-label="Direction"]')?.nextElementSibling?.textContent}`
        svgImg = document.querySelector<HTMLImageElement>('.tbm-lines-name-wrapper > img')
        if (svgImg) {
          presenceData.smallImageKey = await svgToPng(svgImg?.src)
          presenceData.smallImageText = svgImg?.alt
        }
      }
      else if (document.querySelector('main > div.routes') || document.querySelector('main > div.routes-results') || document.querySelector('main > div.route-roadmap')) {
        presenceData.details = strings.searchRoutes
        presenceData.state = `${strings.from} ${document.querySelector<HTMLInputElement>('.route-search-input input#autosuggest_route\\.search\\.from')?.value || strings.noData} → ${strings.to} ${document.querySelector<HTMLInputElement>('.route-search-input input#autosuggest_route\\.search\\.to')?.value || strings.noData}`
        presenceData.smallImageKey = ActivityAssets.Routes
        svgImg = document.querySelector('.traffic-wrapper button.active > svg')
        if (svgImg) {
          presenceData.smallImageText = svgImg?.getAttribute('aria-label')
        }
      }
      else if (document.querySelector('.traffic-global')) {
        presenceData.details = strings.viewTrafficInfos
        presenceData.state = document.querySelector('.tab-wrapper > a.active')?.textContent
        presenceData.smallImageKey = ActivityAssets.Traffic
      }
      else if (document.querySelector('.traffic-list')) {
        presenceData.details = strings.viewTrafficInfos
        presenceData.state = `${document.querySelector('.traffic-list > h3')?.firstChild?.textContent} : ${document.querySelector('.traffic-list > h3 > span')?.textContent}`
        svgImg = document.querySelector<HTMLImageElement>('.tbm-lines-name-wrapper > img')
        if (svgImg) {
          presenceData.smallImageKey = await svgToPng(svgImg?.src)
          presenceData.smallImageText = svgImg?.alt
        }
      }
      else if (document.querySelector('.traffic-detail')) {
        presenceData.details = strings.viewTrafficInfo
        presenceData.state = document.querySelector('.tbm-lines-name-wrapper > span.lh-xbig')?.textContent || document.querySelector('.tbm-lines-name-wrapper > span:nth-of-type(2)')?.textContent
        svgImg = document.querySelector<HTMLImageElement>('.tbm-lines-name-wrapper > img')
        if (svgImg) {
          presenceData.smallImageKey = await svgToPng(svgImg?.src)
          presenceData.smallImageText = svgImg?.alt
        }
      }
      else if (document.querySelector('.lines')) {
        presenceData.details = strings.viewLines
        if (document.querySelector('.title-line')) {
          presenceData.details = strings.viewLineInfos
          presenceData.state = `${document.querySelector('.lines > h2:nth-of-type(1)')} - ${document.querySelector('.lines > h2:nth-of-type(2)')}`
          svgImg = document.querySelector<HTMLImageElement>('.tbm-icon-picto > img')
          if (svgImg) {
            presenceData.smallImageKey = await svgToPng(svgImg?.src)
            presenceData.smallImageText = svgImg?.alt
          }
        }
      }
      break
    }
    case 'tbmfid.infotbm.com': {
      presenceData.name = 'TBM Fid\''
      presenceData.largeImageKey = ActivityAssets.TBMFid

      if (!path[1]) {
        presenceData.details = strings.viewHome
      }
      else if (path[1] === 'shop') {
        presenceData.details = strings.viewShop
        if (path[2]) {
          presenceData.details = strings.viewOffer
          presenceData.state = document.querySelector('[data-cy="offer-details-offer-title"]')?.textContent
        }
      }
      else if (path[1] === 'dashboard') {
        presenceData.details = strings.viewDashboard
        if (path[2] === 'profile') {
          presenceData.details = strings.viewTheirProfile
          switch (path[3]) {
            case 'update': {
              presenceData.details = strings.editTheirPersonnalInfo
              break
            }
            case 'history': {
              presenceData.details = strings.viewTheirPointsHistory
              break
            }
            case 'orders': {
              presenceData.details = strings.viewTheirOrders
              break
            }
            case 'documentation': {
              presenceData.details = strings.viewDocumentation
              if (path[4] === 'deleteAccount') {
                presenceData.details = strings.deleteAccount
              }
              break
            }
            case 'help': {
              presenceData.details = strings.viewHelpPage
              break
            }
          }
        }
      }
      else if (path[1] === 'scalePoints') {
        presenceData.details = strings.viewPointsScale
      }
      else {
        presenceData.details = strings.viewPage
        presenceData.state = document.title?.split(' - TBM')[0] || document.title
      }
      break
    }
  }

  if (presenceData.details)
    presence.setActivity(presenceData)
  else presence.setActivity()
})
