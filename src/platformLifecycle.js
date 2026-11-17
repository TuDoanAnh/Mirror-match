// One source of truth for host audio, user audio, ads and host pause requests.
export function createPlatformLifecycle(game, page = globalThis.document) {
  const pauseReasons = new Set();
  const disposers = [];
  let platformAudioEnabled = true;
  let ownsPause = false;
  let inputWasEnabled = true;
  let keyboardWasEnabled = true;
  let pausedSounds = [];

  const applyAudio = () => {
    const muted = !!game.registry.get('isMuted') || !platformAudioEnabled || pauseReasons.size > 0;
    // Assign the AudioParam value as well: while AudioContext is locked,
    // scheduled gain changes alone do not update Phaser's mute getter.
    if (game.sound.masterMuteNode) game.sound.masterMuteNode.gain.value = muted ? 0 : 1;
    game.sound.mute = muted;
    game.events.emit('effective-mute-changed', muted);
  };

  const resetInput = () => {
    for (const scene of game.scene.getScenes(false)) {
      scene.input?.keyboard?.resetKeys();
      scene.mobileControls?.reset();
    }
    for (const pointer of game.input.pointers || []) {
      pointer.reset();
    }
  };

  const setPauseReason = (reason, paused) => {
    if (paused) pauseReasons.add(reason);
    else pauseReasons.delete(reason);
    applyAudio();

    if (pauseReasons.size > 0 && !ownsPause) {
      // Never take ownership of a game that was already paused elsewhere.
      if (!game.isPaused) {
        ownsPause = true;
        inputWasEnabled = game.input.enabled;
        game.input.enabled = false;
        if (game.input.keyboard) {
          keyboardWasEnabled = game.input.keyboard.enabled;
          game.input.keyboard.enabled = false;
          game.input.keyboard.queue.length = 0;
        }
        resetInput();
        pausedSounds = (game.sound.sounds || []).filter(sound => sound.isPlaying);
        pausedSounds.forEach(sound => sound.pause());
        game.pause();
      }
    } else if (pauseReasons.size === 0 && ownsPause) {
      ownsPause = false;
      resetInput();
      game.input.enabled = inputWasEnabled;
      if (game.input.keyboard) {
        game.input.keyboard.queue.length = 0;
        game.input.keyboard.enabled = keyboardWasEnabled;
      }
      game.resume();
      pausedSounds.forEach(sound => {
        if (sound.isPaused && sound.manager) sound.resume();
      });
      pausedSounds = [];
    }
  };

  const onUserMuteChanged = () => applyAudio();
  // DataManager emits setdata for newly introduced keys and changedata for
  // existing keys (including preferences loaded from storage).
  const onUserMuteSet = (_parent, key) => { if (key === 'isMuted') applyAudio(); };
  game.registry.events.on('setdata', onUserMuteSet);
  disposers.push(() => game.registry.events.off('setdata', onUserMuteSet));
  game.registry.events.on('changedata-isMuted', onUserMuteChanged);
  disposers.push(() => game.registry.events.off('changedata-isMuted', onUserMuteChanged));

  const onVisibility = () => setPauseReason('hidden', !!page.hidden);
  if (page?.addEventListener) {
    page.addEventListener('visibilitychange', onVisibility);
    disposers.push(() => page.removeEventListener('visibilitychange', onVisibility));
    onVisibility();
  }

  return {
    applyAudio,
    setPauseReason,
    bindBridge(bridge) {
      const platform = bridge.platform;
      if (!platform) return;
      const onAudio = enabled => {
        platformAudioEnabled = typeof enabled === 'boolean' ? enabled : platform.isAudioEnabled !== false;
        applyAudio();
      };
      const onPause = paused => setPauseReason('platform', typeof paused === 'boolean' ? paused : !!platform.isPaused);
      const listen = (target, event, handler) => {
        if (!target?.on) return;
        target.on(event, handler);
        disposers.push(() => target.off?.(event, handler));
      };
      listen(platform, 'audio_state_changed', onAudio);
      listen(platform, 'pause_state_changed', onPause);
      onAudio(platform.isAudioEnabled !== false);
      onPause(!!platform.isPaused);
      for (const type of ['interstitial', 'rewarded']) {
        listen(bridge.advertisement, `${type}_state_changed`, state => {
          if (state === 'loading' || state === 'opened') setPauseReason(type, true);
          else if (state === 'closed' || state === 'failed') setPauseReason(type, false);
        });
      }
    },
    snapshot() {
      return { platformAudioEnabled, pauseReasons: [...pauseReasons], muted: game.sound.mute, paused: game.isPaused };
    },
    destroy() {
      disposers.splice(0).forEach(dispose => dispose());
    }
  };
}

// Phaser's normal timestamps include time spent paused. Feed scenes an active
// timeline so absolute cooldown deadlines and match duration freeze as well.
export function installGameplayClock(game) {
  let activeTime = 0;
  let frameDelta = 0;
  const tweenDelta = () => frameDelta;
  const sceneManager = game.scene;
  const update = sceneManager.update;
  sceneManager.update = function (_time, delta) {
    activeTime += delta;
    frameDelta = delta;
    game.activeGameplayTime = activeTime;
    for (const scene of this.scenes) {
      if (scene.time) scene.time.now = activeTime;
      if (scene.tweens) scene.tweens.getDelta = tweenDelta;
    }
    return update.call(this, activeTime, delta);
  };
}
