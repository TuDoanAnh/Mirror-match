// Only activated by Vite dev mode and ?platformTest=1. Production builds use
// the real SDK and do not expose simulation controls.
function emitter() {
  const listeners = new Map();
  return {
    on(event, handler) {
      if (!listeners.has(event)) listeners.set(event, new Set());
      listeners.get(event).add(handler);
    },
    off(event, handler) { listeners.get(event)?.delete(handler); },
    emit(event, value) { listeners.get(event)?.forEach(handler => handler(value)); }
  };
}

export function createMockBridge() {
  const params = new URLSearchParams(location.search);
  const platform = Object.assign(emitter(), {
    isAudioEnabled: params.get('audio') !== '0',
    isPaused: params.get('paused') === '1',
    sendMessage: () => Promise.resolve()
  });
  const advertisement = Object.assign(emitter(), {
    showInterstitial() { advertisement.emit('interstitial_state_changed', 'failed'); },
    showRewarded() { advertisement.emit('rewarded_state_changed', 'failed'); }
  });
  return { initialize: () => Promise.resolve(), platform, advertisement, isLocalTest: true };
}

export function installPlatformDebug(game, lifecycle) {
  if (new URLSearchParams(location.search).get('platformTest') !== '1') return;
  window.platformTest = {
    audio(enabled) {
      window.bridge.platform.isAudioEnabled = enabled;
      window.bridge.platform.emit('audio_state_changed', enabled);
    },
    pause(paused) {
      window.bridge.platform.isPaused = paused;
      window.bridge.platform.emit('pause_state_changed', paused);
    },
    ad(state, type = 'rewarded') {
      window.bridge.advertisement.emit(`${type}_state_changed`, state);
    },
    state: () => ({ ...lifecycle.snapshot(), activeTime: game.activeGameplayTime }),
    userMute(muted) { game.registry.set('isMuted', muted); }
  };
  console.info('Local Playgama simulation: window.platformTest.audio(false), .pause(true), .ad("opened"), .state()');
}
