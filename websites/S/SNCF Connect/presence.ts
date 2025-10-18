const presence = new Presence({
  clientId: '1415252544141398067',
})
const browsingTimestamp = Math.floor(Date.now() / 1000)

enum ActivityAssets {
  Logo = 'https://i.imgur.com/ubNQ6eP.png',
}

let origin, originTime, destination, destinationTime

presence.on('UpdateData', async () => {
  const privacy = await presence.getSetting<boolean>('privacy')

  const strings = await presence.getStrings({
    home: 'general.viewHome',
    searchingItineraries: 'sncfconnect.searchingItineraries',
    searchingItinerariesToALocation: 'sncfconnect.searchingItinerariesToALocation',
    departure: 'sncfconnect.departure',
    arrival: 'sncfconnect.arrival',
    searchingItinerariesInterstitial: 'sncfconnect.searchingItinerariesInterstitial',
    viewingDetailsOfTheItinerary: 'sncfconnect.viewingDetailsOfTheItinerary',
    viewingDetailsOfAnItinerary: 'sncfconnect.viewingDetailsOfAnItinerary',
    rateOutbound: 'sncfconnect.rateOutbound',
    ratesOutbound: 'sncfconnect.ratesOutbound',
    rateInbound: 'sncfconnect.rateInbound',
    ratesInbound: 'sncfconnect.ratesInbound',
  })

  const presenceData: PresenceData = {
    largeImageKey: ActivityAssets.Logo,
    startTimestamp: browsingTimestamp,
  }

  const path = document.location.pathname

  if (path === '/') {
    presenceData.details = strings.home
  }
  else if (path?.includes('/interstitiel')) {
    presenceData.details = strings.searchingItinerariesInterstitial
  }
  else if (path?.includes('/search/od')) {
    [origin, destination] = document.querySelectorAll<HTMLInputElement>('input.MuiInputBase-input')
    presenceData.details = privacy ? strings.searchingItinerariesToALocation : strings.searchingItineraries
    presenceData.state = privacy ? '' : `${strings.departure?.replace('{0}', origin?.value || 'noData')} • ${strings.arrival?.replace('{0}', destination?.value || 'noData')}`
  }
  else if (path?.includes('/doorToDoor/itineraries')) {
    [origin, destination] = document.querySelectorAll('[data-test="place"]');
    [originTime, destinationTime] = document.querySelectorAll('[data-test="time-label"]')
    presenceData.details = privacy ? strings.viewingDetailsOfAnItinerary : strings.viewingDetailsOfTheItinerary
    presenceData.state = privacy ? '' : `${strings.departure?.replace('{0}', origin?.textContent?.trim() || 'noData')} (${originTime?.textContent?.trim() || 'noData'}) • ${strings.arrival?.replace('{0}', destination?.textContent?.trim() || 'noData')} (${destinationTime?.textContent?.trim() || 'noData'})`
  }
  else if (path?.includes('/shop/results/outward')) {
    [origin, destination] = document.querySelectorAll('[data-test="place"]');
    [originTime, destinationTime] = document.querySelectorAll('[data-test="time-label"]')
    const outboundSelected = document.querySelector('.MuiDrawer-modal')
    if (outboundSelected) {
      presenceData.details = privacy ? strings.ratesOutbound : strings.rateOutbound
      presenceData.state = privacy ? '' : `${strings.departure?.replace('{0}', origin?.textContent?.trim() || 'noData')} (${originTime?.textContent?.trim() || 'noData'}) • ${strings.arrival?.replace('{0}', destination?.textContent?.trim() || 'noData')} (${destinationTime?.textContent?.trim() || 'noData'})`
    }
    else {
      presenceData.details = strings.ratesOutbound
    }
  }
  else if (path?.includes('/shop/results/inward')) {
    [origin, destination] = document.querySelectorAll('[data-test="place"]');
    [originTime, destinationTime] = document.querySelectorAll('[data-test="time-label"]')
    const inboundSelected = document.querySelector('.MuiDrawer-modal')
    if (inboundSelected) {
      presenceData.details = privacy ? strings.ratesInbound : strings.rateInbound
      presenceData.state = privacy ? '' : `${strings.departure?.replace('{0}', origin?.textContent?.trim() || 'noData')} (${originTime?.textContent?.trim() || 'noData'}) • ${strings.arrival?.replace('{0}', destination?.textContent?.trim() || 'noData')} (${destinationTime?.textContent?.trim() || 'noData'})`
    }
    else {
      presenceData.details = strings.ratesInbound
    }
  }

  presence.setActivity(presenceData)
})
