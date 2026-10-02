'use client';

import { createContext, useCallback, useContext, useEffect, useState } from 'react';

// Global sound preference for the whole app.
// - soundOn: what the viewer WANTS (default: on, remembered between visits)
// - activated: whether the browser has let the page make sound yet. Browsers
//   refuse to play audio until the visitor has clicked/tapped/pressed a key
//   at least once — that's a browser rule we can't bypass, so we start
//   playback the moment it's allowed.
const Ctx = createContext({ soundOn: true, setSoundOn: () => {}, activated: false });

export function SoundProvider({ children }) {
  const [soundOn, setSoundOnState] = useState(true);
  const [activated, setActivated] = useState(false);

  useEffect(() => {
    try {
      if (localStorage.getItem('tubambe_sound') === 'off') setSoundOnState(false);
    } catch {}

    if (typeof navigator !== 'undefined' && navigator.userActivation?.hasBeenActive) {
      setActivated(true);
    }

    const events = ['pointerdown', 'keydown', 'touchend'];
    const onFirst = () => {
      setActivated(true);
      events.forEach((e) => window.removeEventListener(e, onFirst));
    };
    events.forEach((e) => window.addEventListener(e, onFirst, { passive: true }));
    return () => events.forEach((e) => window.removeEventListener(e, onFirst));
  }, []);

  const setSoundOn = useCallback((value) => {
    setSoundOnState(value);
    try {
      localStorage.setItem('tubambe_sound', value ? 'on' : 'off');
    } catch {}
  }, []);

  return <Ctx.Provider value={{ soundOn, setSoundOn, activated }}>{children}</Ctx.Provider>;
}

export const useSound = () => useContext(Ctx);
