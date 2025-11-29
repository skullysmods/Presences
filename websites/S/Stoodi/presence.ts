import { Assets, getTimestampsFromMedia } from 'premid'

const presence = new Presence({
  clientId: '1043638037042712637',
})
const browsingTimestamp = Math.floor(Date.now() / 1000)

enum ActivityAssets {
  Logo = 'https://cdn.rcd.gg/PreMiD/websites/S/Stoodi/assets/0.png',
}
presence.on('UpdateData', async () => {
  const presenceData: PresenceData = {
    largeImageKey: ActivityAssets.Logo,
    details: 'Vendo o Stoodi',
    startTimestamp: browsingTimestamp,
  }
  const url = document.location.pathname
  let title = document.querySelector('.c-page-header__title')?.textContent

  if (url === '/')
    presenceData.details = 'Navegando pela Home'

  if (url.includes('/materias')) {
    if (!url.split('/materias/')[1])
      presenceData.details = 'Vendo as matérias'
    else if (title)
      presenceData.details = `Vendo a matéria de ${title}`
  }
  if (url.includes('/intensivao') && !url.split('/intensivao/')[1])
    presenceData.details = 'Procurando aulas no Intensivão'

  let subject = document.querySelector('.c-subject__subtitle')?.textContent
  title = document.querySelector('.c-subject__title')?.textContent

  if (subject && title) {
    presenceData.details = `Vendo módulo de ${subject}:`
    presenceData.state = title
  }
  else if (url.includes('/questao/')) {
    presenceData.details = 'Resolvendo uma questão:'
    presenceData.state = document.querySelector(
      '.c-sidebar__item.is-active .c-sidebar__item-txt',
    )?.textContent
  }
  else {
    subject = document.querySelector('.c-lesson__header-subject')?.textContent
    title = document.querySelector('h1.c-lesson__header-title')?.textContent
    if (subject && title) {
      presenceData.details = `Vendo aula de de ${subject}:`
      presenceData.state = title

      const player = document.querySelector<HTMLVideoElement>('.fp-player video')

      if (player) {
        presenceData.smallImageKey = player.paused ? Assets.Pause : Assets.Play
        presenceData.smallImageText = player.paused ? 'Pausado' : 'Tocando'

        delete presenceData.startTimestamp
        if (!player.paused) {
          [presenceData.startTimestamp, presenceData.endTimestamp] = getTimestampsFromMedia(player)
        }
      }
    }
    if (url.includes('/exercicios')) {
      title = document.querySelector('.question-list__title')?.textContent
      const activeItem = document.querySelector('.areaTabs .active .areaStoodi')?.textContent
      if (title || activeItem) {
        presenceData.details = 'Vendo o Banco de Exercícios:'
        presenceData.state = activeItem
      }
      else {
        presenceData.details = 'Resolvendo exercício'
      }
    }
    if (url.includes('/simulados')) {
      if (title) {
        presenceData.details = 'Vendo os simulados:'
        presenceData.state = title
      }
      else {
        presenceData.details = 'Resolvendo simulado'
      }
    }
    if (url.includes('/aulas-ao-vivo')) {
      title = document.querySelector('.c-live__title')?.textContent
      if (title) {
        presenceData.details = 'Assistindo a aula ao vivo:'
        presenceData.state = title
      }
      else {
        presenceData.details = 'Procurando aulas ao vivo'
      }
    }
    if (url.includes('/correcao-de-redacao')) {
      if (title)
        presenceData.details = 'Vendo a correção de redação'
      else presenceData.details = 'Fazendo uma redação'
    }
    if (url.includes('/provas-do-enem')) {
      const breadcrumb = document.querySelector('.c-breadcrumb__item.is-active')?.textContent
      if (title) {
        presenceData.details = 'Vendo as provas do ENEM:'
        presenceData.state = title
      }
      else if (breadcrumb) {
        presenceData.details = 'Resolvendo prova do ENEM:'
        presenceData.state = breadcrumb
      }
      else {
        presenceData.details = 'Procurando provas do ENEM'
      }
    }
    if (url.includes('/videos/') && title) {
      presenceData.details = 'Procurando vídeoaulas:'
      presenceData.state = document.querySelector(
        '.areaTabs .active .areaStoodi',
      )?.textContent
    }
    if (url.includes('/resumos/')) {
      title = document.querySelector('.c-page-header h1')?.textContent

      if (title) {
        presenceData.details = 'Procurando resumos teóricos:'
        presenceData.state = document.querySelector(
          '.areaTabs .active .areaStoodi',
        )?.textContent
      }
    }
  }

  presence.setActivity(presenceData)
})
