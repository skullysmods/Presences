import { Assets } from 'premid'

const presence = new Presence({
  clientId: '1094931941616267344',
})

enum ActivityAssets {
  Logo = 'https://cdn.rcd.gg/PreMiD/websites/0-9/3388/assets/logo.png',
}

presence.on('UpdateData', async () => {
  const presenceData: PresenceData = {
    largeImageKey: ActivityAssets.Logo,
    smallImageKey: Assets.Search,
    smallImageText: 'Browsing',
  }
  const { pathname } = document.location

  if (pathname.includes('/detail/')) {
    const filmItems = document.querySelectorAll('.fd-item')
    const coverElement = document.querySelector<HTMLElement>('.detail-film-cover')

    let name = document.querySelector('.film-name')?.textContent

    if (
      filmItems.length >= 3
      && !Number.isNaN(Number.parseInt(filmItems[2]?.textContent ?? 'NaN'))
    ) {
      name += ` (${filmItems[2]?.textContent})`
    }

    if (
      coverElement?.style.backgroundImage.startsWith('url("')
      && coverElement.style.backgroundImage.endsWith('")')
    ) {
      presenceData.largeImageKey = coverElement.style.backgroundImage.slice(
        5,
        coverElement.style.backgroundImage.length - 2,
      )
    }

    presenceData.details = `Viewing ${
      !document.querySelector('#season-list') ? 'a Movie' : 'a TV Show'
    }`
    presenceData.state = name
  }
  else if (pathname.includes('/watch/')) {
    const video = document.querySelector<HTMLVideoElement>('#player')!
    const [startTimestamp, endTimestamp] = presence.getTimestampsfromMedia(video)
    if (document.querySelector('#menu-eps')) {
      presenceData.details = `${
        document.querySelector('.film-name')?.textContent
      } - ${
        document.querySelector('.cmecb-seasons ul li.active a')?.textContent
      }`
      presenceData.state = `E${
        Array.from(
          document.querySelector('.cmecb-epslist ul')?.children ?? [],
        ).findIndex(e => e.classList.contains('active')) + 1
      }: ${document
        .querySelector('.cmecb-epslist ul li.active a')
        ?.getAttribute('title')}`
    }
    else {
      presenceData.details = document.querySelector('span.large')?.textContent
      presenceData.state = 'Movie'
    }

    presenceData.largeImageKey = document.querySelector<HTMLImageElement>(
      '.mbu-bg.blur-small img',
    )?.src
    presenceData.smallImageKey = video.paused ? Assets.Pause : Assets.Play
    presenceData.smallImageText = video.paused ? 'Paused' : 'Playing'

    if (!video.paused) {
      [presenceData.startTimestamp, presenceData.endTimestamp] = [
        startTimestamp,
        endTimestamp,
      ]
    }
  }
  else if (pathname === '/movies') {
    presenceData.details = 'Browsing Movies'
  }
  else if (pathname === '/tv-shows') {
    presenceData.details = 'Browsing TV Shows'
  }
  else {
    presenceData.details = 'Browsing'
  }

  presence.setActivity(presenceData)
})
