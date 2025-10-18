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
  Traffic = 'https://i.imgur.com/Y0blXna.png',
  Lines = 'https://i.imgur.com/bjGzNRG.png',
  Bike = 'https://i.imgur.com/MFFwTFg.png',
  Parking = 'https://i.imgur.com/ERKYYEB.png',
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

function isValidUUID(uuid: string) {
  const regex = /^[a-f0-9]{8}-[a-f0-9]{4}-1[a-f0-9]{3}-[a-f0-9]{4}-[a-f0-9]{12}$/i
  return regex.test(uuid)
}

presence.on('UpdateData', async () => {
  const logo = await presence.getSetting<number>('logo')
  const presenceData: PresenceData = {
    details: 'null', // TODO : Remove this
    largeImageKey: [ActivityAssets.Logo, ActivityAssets.OldLogo, ActivityAssets.NewLogo][logo] || ActivityAssets.Logo,
    startTimestamp: browsingTimestamp,
  }
  const strings = await getStrings()
  const path = document.location.pathname?.split('/')
  const completePath = document.location.pathname
  let svgImg: HTMLImageElement | null = null

  switch (document.location.hostname) {
    case 'www.infotbm.com': {
      if (/^\/(?:fr|en|es)$/.test(completePath)) {
        presenceData.details = strings.viewHome
      }
      else if (/\/(?:horaires|schedules|horarios)(?:\/|$)/.test(completePath)) {
        presenceData.details = strings.viewLinesSchedules
        presenceData.smallImageKey = ActivityAssets.Schedules

        if (/\/(?:recherche|search|buscar)$/.test(completePath)) {
          presenceData.details = strings.searchStop
          presenceData.state = `${strings.direction} ${document.querySelector('.direction-wrapper > a.active p:nth-of-type(2)')?.textContent || ''}`
          svgImg = document.querySelector<HTMLImageElement>('.tbm-lines-name-wrapper > img')
          if (svgImg) {
            presenceData.smallImageKey = await svgToPng(svgImg?.src)
            presenceData.smallImageText = svgImg?.alt
          }
        }
        else if (/\/(?:detail|detalle)(?:\/|$)/.test(completePath)) {
          presenceData.details = strings.viewSchedules
          presenceData.state = `${strings.stop} ${document.querySelector('.tbm-lines-name-wrapper')?.textContent} - ${strings.direction} ${document.querySelector('svg[aria-label="Direction"]')?.nextElementSibling?.textContent}`
          svgImg = document.querySelector<HTMLImageElement>('.tbm-lines-name-wrapper > img')
          if (svgImg) {
            presenceData.smallImageKey = await svgToPng(svgImg?.src)
            presenceData.smallImageText = svgImg?.alt
          }
        }
      }
      else if (/\/(?:itineraires|routes|rutas)(?:\/|$)/.test(completePath)) {
        presenceData.details = strings.searchRoutes
        presenceData.state = `${strings.from} ${document.querySelector<HTMLInputElement>('.route-search-input input#autosuggest_route\\.search\\.from')?.value || strings.noData} → ${strings.to} ${document.querySelector<HTMLInputElement>('.route-search-input input#autosuggest_route\\.search\\.to')?.value || strings.noData}`
        presenceData.smallImageKey = ActivityAssets.Routes
        svgImg = document.querySelector('.traffic-wrapper button.active > svg')
        if (svgImg) {
          presenceData.smallImageText = svgImg?.getAttribute('aria-label')
        }
      }
      else if (/\/(?:perturbations|traffic-info|perturbaciones)(?:\/|$)/.test(completePath)) {
        presenceData.details = strings.viewTrafficInfos
        presenceData.state = document.querySelector('.tab-wrapper > a.active')?.textContent
        presenceData.smallImageKey = ActivityAssets.Traffic

        if (/\/(?:ligne|line|linea)(?:\/|$)/.test(completePath) && isValidUUID(path[path.length - 1]!)) {
          presenceData.details = strings.viewTrafficInfo
          presenceData.state = document.querySelector('.tbm-lines-name-wrapper > span.lh-xbig')?.textContent || document.querySelector('.tbm-lines-name-wrapper > span:nth-of-type(2)')?.textContent
          svgImg = document.querySelector<HTMLImageElement>('.tbm-lines-name-wrapper img')
          if (svgImg) {
            presenceData.smallImageKey = await svgToPng(svgImg?.src)
            presenceData.smallImageText = svgImg?.alt
          }
        }
        else if (/\/(?:ligne|line|linea)(?:\/|$)/.test(completePath)) {
          presenceData.state = `${document.querySelector('.traffic-list > h3')?.firstChild?.textContent} : ${document.querySelector('.traffic-list > h3 > span')?.textContent}`
          svgImg = document.querySelector<HTMLImageElement>('.tbm-lines-name-wrapper > img')
          if (svgImg) {
            presenceData.smallImageKey = await svgToPng(svgImg?.src)
            presenceData.smallImageText = svgImg?.alt
          }
        }
        // velo
        else if (/\/(?:stations|estaciones)(?:\/|$)/.test(completePath) && isValidUUID(path[path.length - 1]!)) {
          presenceData.details = strings.viewTrafficInfo
          presenceData.state = document.querySelector('.tbm-lines-name-wrapper span.lh-xbig')?.textContent
          presenceData.smallImageKey = ActivityAssets.Bike
          presenceData.smallImageText = document.querySelector('.tbm-lines-name-wrapper p')?.textContent || ''
        }
        else if (/\/(?:stations|estaciones)\//.test(completePath)) {
          presenceData.state = `${document.querySelector('.traffic-list > h3')?.firstChild?.textContent} : ${document.querySelector('.traffic-list > h3 > span')?.textContent}`
          presenceData.smallImageKey = ActivityAssets.Bike
          presenceData.smallImageText = document.querySelector('.tbm-lines-name-wrapper > span.lh-xbig')?.textContent || ''
        }
        else if (/\/(?:stations|estaciones)$/.test(completePath)) {
          presenceData.state = document.querySelector('.traffic-list > h3 > p')?.textContent
          presenceData.smallImageKey = ActivityAssets.Bike
          presenceData.smallImageText = document.querySelector('div.tbm-block > h2')?.textContent || ''
        }
        // parking relais
        else if (/\/(?:parc-relais|park-and-rides|aparcamientos-disuasorios)(?:\/|$)/.test(completePath) && isValidUUID(path[path.length - 1]!)) {
          presenceData.details = strings.viewTrafficInfo
          presenceData.state = document.querySelector('.tbm-lines-name-wrapper > span.lh-xbig')?.textContent || document.querySelector('.tbm-lines-name-wrapper > span:nth-of-type(2)')?.textContent
          svgImg = document.querySelector<HTMLImageElement>('.tbm-lines-name-wrapper img')
          if (svgImg) {
            presenceData.smallImageKey = await svgToPng(svgImg?.src)
            presenceData.smallImageText = svgImg?.alt
          }
        }
      }
      else if (document.querySelector('.lines')) {
        presenceData.details = strings.viewLines
        presenceData.smallImageKey = ActivityAssets.Lines
        if (document.querySelector('.title-line')) {
          presenceData.details = strings.viewLineInfos
          presenceData.state = `${document.querySelector('.lines > h2:nth-of-type(1)')?.textContent} ↔ ${document.querySelector('.lines > h2:nth-of-type(2)')?.textContent}`
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
