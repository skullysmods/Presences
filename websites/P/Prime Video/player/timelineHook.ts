import type { TimelineSnapshot } from '../config/types.js'
import {
  ENABLE_TIMELINE_CORRECTION,
  MAX_TIMELINE_OFFSET_S,
  MAX_TITLE_ADS_S,
  MAX_TRACKED_TITLES,
  PLAYBACK_PATH_REGEX,
  SELECTORS,
  TIMELINE_ATTRIBUTE,
  UPDATE_SESSION_PATH_REGEX,
  VIDEO_ADS_PATH_REGEX,
} from '../config/constants.js'

/**
 * Script executed in the page (the content script cannot see the player `fetch`), in raw JS: it is
 * injected as text, so it is independent of the bundler. It observes player requests and publishes the
 * state (type TimelineSnapshot) in an attribute on <html>:
 * - `Get*PlaybackResources` response: playlist (intro jingle, ad break points) and title duration
 * - `/cdp/getVideoAds` response: duration of each ad cut
 * - `UpdateSession` request: watched position (VOD) or real time (live)
 * Shared constants with the content script are passed via `config`.
 */
const HOOK_SOURCE = String.raw`(config => {
  if (window.__premidPrimeTimelineHook)
    return;
  window.__premidPrimeTimelineHook = true;

  const playbackPath = new RegExp(config.playbackPath);
  const updateSessionPath = new RegExp(config.updateSessionPath);
  const videoAdsPath = new RegExp(config.videoAdsPath);

  // Titles by playback request (oldest first): the player can prefetch one that is played later
  const titles = {};
  const order = [];
  let adDurations = {};

  const round = value => Math.round(value * 1000) / 1000;
  const getMarker = text => {
    const match = /adMarkerId=([^&]+)/.exec(text || '');
    return match ? match[1] : null;
  };

  const parseIsoDuration = value => {
    const match = /^PT(?:(\d+)H)?(?:(\d+)M)?(?:([\d.]+)S)?$/.exec(String(value));
    return match ? Number(match[1] || 0) * 3600 + Number(match[2] || 0) * 60 + Number(match[3] || 0) : null;
  };

  const parseClock = value => {
    const match = /^(\d+):(\d+):([\d.]+)$/.exec(String(value));
    return match ? Number(match[1]) * 3600 + Number(match[2]) * 60 + Number(match[3]) : 0;
  };

  // Same rule as findPlayerVideo (dom.ts): the one playing, then the visible one, then the most recent
  const findVideo = () => {
    const videos = Array.from(document.querySelectorAll(config.videoSelector));
    const visible = videos.filter(video => video.clientWidth > 0 && video.clientHeight > 0);
    return visible.find(video => !video.paused) || videos.find(video => !video.paused) || visible[visible.length - 1] || videos[videos.length - 1] || document.querySelector('video[src]');
  };

  // Title played by the video: the most recent one whose duration fits (the video also contains its ads).
  // Without duration to compare (live, not loaded yet): the last requested.
  const findActive = () => {
    const video = findVideo();
    if (video && isFinite(video.duration)) {
      for (let i = order.length - 1; i >= 0; i--) {
        const full = titles[order[i]].full;
        const gap = full === null ? NaN : video.duration - full;
        if (gap >= -2 && gap <= config.maxAds)
          return order[i];
      }
    }
    return order.length ? order[order.length - 1] : null;
  };

  const publish = () => {
    const snapshot = { active: findActive(), titles: {} };
    for (const gti of order) {
      const state = titles[gti];
      snapshot.titles[gti] = { ...state, breaks: state.breaks.map(item => ({ cue: item.cue, a: adDurations[item.marker] || 0 })) };
    }
    document.documentElement.setAttribute(config.attribute, JSON.stringify(snapshot));
  };

  const onPlaylist = (gti, json) => {
    const state = titles[gti];
    const result = json && json.vodPlaylistedPlaybackUrls && json.vodPlaylistedPlaybackUrls.result;
    const playlist = result && result.playbackUrls && result.playbackUrls.intraTitlePlaylist;
    if (!state || !Array.isArray(playlist))
      return;

    // position (s) in the video timeline without ads
    let position = 0;
    let intro = 0;
    let seenMain = false;
    const breaks = [];

    for (const item of playlist) {
      if (!item)
        continue;

      if (item.type === 'Remote') {
        breaks.push({ cue: position, marker: getMarker(item.urlsInPriorityOrder && item.urlsInPriorityOrder[0]) });
        continue;
      }

      if (typeof item.startMs === 'number' && typeof item.endMs === 'number') {
        if (!seenMain && item.type !== 'Main')
          intro += (item.endMs - item.startMs) / 1000;
        position = item.endMs / 1000;
      }
      if (item.type === 'Main')
        seenMain = true;
    }

    const full = /"fullTitleDurationMs":(\d+)/.exec(JSON.stringify(result));
    state.intro = intro;
    state.breaks = breaks;
    state.full = full ? Number(full[1]) / 1000 : null;
    publish();
  };

  const onAds = (url, json) => {
    const marker = getMarker(url);
    if (!marker || !json || !Array.isArray(json.playlist))
      return;

    adDurations[marker] = json.playlist.reduce((total, ad) => total + parseClock(ad && ad.description && ad.description.duration), 0);
    publish();
  };

  const onUpdateSession = body => {
    const info = JSON.parse(body);
    const progress = info && info.streamInfo;
    const video = findVideo();
    const state = titles[findActive()];
    if (!progress || !video || !state)
      return;

    // Live: real server-clock time of the watched point
    if (progress.liveProgressInfo) {
      const time = Date.parse(progress.liveProgressInfo.currentProgressTime);
      if (!isNaN(time)) {
        state.live = { ct: round(video.currentTime), t: time, src: video.currentSrc };
        publish();
      }
      return;
    }

    // VOD: position within the content
    const position = parseIsoDuration(progress.vodProgressInfo && progress.vodProgressInfo.currentProgressTime);
    const gap = position === null ? NaN : video.currentTime - position;
    if (gap >= 0 && gap <= config.maxOffset) {
      state.anchor = { ct: round(video.currentTime), cp: position };
      publish();
    }
  };

  const onPlaybackRequest = url => {
    const gti = new URL(url, location.href).searchParams.get('titleId');
    if (!gti)
      return null;

    const index = order.indexOf(gti);
    if (index >= 0)
      order.splice(index, 1);
    order.push(gti);
    titles[gti] = { gti, intro: 0, full: null, breaks: [], anchor: null, live: null };
    while (order.length > config.maxTitles)
      delete titles[order.shift()];

    publish();
    return gti;
  };

  const originalFetch = window.fetch;
  window.fetch = function (input, init) {
    let request;
    try {
      const url = typeof input === 'string' ? input : (input instanceof URL ? input.href : input.url);

      if (updateSessionPath.test(url) && init && typeof init.body === 'string')
        onUpdateSession(init.body);

      if (playbackPath.test(url)) {
        const gti = onPlaybackRequest(url);
        request = originalFetch.call(this, input, init);
        if (gti)
          request.then(response => response.clone().json()).then(json => onPlaylist(gti, json)).catch(() => {});
      }
      else if (videoAdsPath.test(url)) {
        request = originalFetch.call(this, input, init);
        request.then(response => response.clone().json()).then(json => onAds(url, json)).catch(() => {});
      }
    }
    catch (error) {
      // Never interfere with the player
    }
    return request || originalFetch.call(this, input, init);
  };

  // Starting a prefetched title (e.g. "Resume" on a detail page) makes no request: the video changes
  for (const type of ['play', 'loadedmetadata', 'durationchange'])
    document.addEventListener(type, publish, true);

  publish();
})(__CONFIG__)`

export function injectTimelineHook(): void {
  if (!ENABLE_TIMELINE_CORRECTION)
    return

  const config = {
    attribute: TIMELINE_ATTRIBUTE,
    maxOffset: MAX_TIMELINE_OFFSET_S,
    maxTitles: MAX_TRACKED_TITLES,
    maxAds: MAX_TITLE_ADS_S,
    videoSelector: SELECTORS.playerVideo,
    playbackPath: PLAYBACK_PATH_REGEX.source,
    updateSessionPath: UPDATE_SESSION_PATH_REGEX.source,
    videoAdsPath: VIDEO_ADS_PATH_REGEX.source,
  }

  try {
    const script = document.createElement('script')
    script.textContent = HOOK_SOURCE.replace('__CONFIG__', () => JSON.stringify(config))
    ;(document.head ?? document.documentElement).appendChild(script)
    script.remove()
  }
  catch {
    // Injection impossible (CSP...): no correction
  }
}

let cachedRaw: string | null = null
let cachedSnapshot: TimelineSnapshot | null = null

// Reads what the injected script publishes (parsed again only when it changes)
export function readTimelineSnapshot(): TimelineSnapshot | null {
  const raw = document.documentElement.getAttribute(TIMELINE_ATTRIBUTE)

  if (raw !== cachedRaw) {
    cachedRaw = raw
    try {
      cachedSnapshot = raw ? JSON.parse(raw) : null
    }
    catch {
      cachedSnapshot = null
    }
  }

  return cachedSnapshot
}
