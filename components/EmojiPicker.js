'use client';

import { useState } from 'react';
import { EMOJI } from '../lib/emoji';
import Icon from './Icons';

// A small popover of emoji that inserts into whatever text the caller gives it.
export default function EmojiPicker({ onPick }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-label="Add emoji"
        className="w-8 h-8 flex items-center justify-center text-lg rounded-lg hover:bg-white/10"
      >
        🙂
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute z-20 bottom-full mb-2 right-0 bg-surface-2 border border-white/10 rounded-xl p-2 grid grid-cols-6 gap-1 shadow-xl w-52">
            {EMOJI.map((e) => (
              <button
                key={e}
                type="button"
                onClick={() => {
                  onPick(e);
                  setOpen(false);
                }}
                className="text-lg w-7 h-7 flex items-center justify-center rounded hover:bg-white/10"
              >
                {e}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
