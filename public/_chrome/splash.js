/* Canonical splash for toys.iamkesava.com.
   One-shot: shows on cold load, fades out on first interaction or after a
   short timeout, never shows again in this session. Skippable with any
   keypress or click. Idempotent — re-running is safe.

   If a toy already has its own splash (e.g., plink, synth-pad), the
   aggregator skips injection (the toy's <body> already includes a
   loading-overlay div). The kami splash is only added when missing. */
(function(){
  'use strict';
  if(window.__kamiSplashInit) return;
  window.__kamiSplashInit = true;

  const el = document.querySelector('.kami-splash');
  if(!el) return;

  const KEY = 'kami.splash.seen';
  let seen = false;
  try{ seen = sessionStorage.getItem(KEY) === '1'; }catch(_){}
  if(seen){
    el.remove();
    return;
  }

  let hidden = false;
  function hide(){
    if(hidden) return;
    hidden = true;
    try{ sessionStorage.setItem(KEY, '1'); }catch(_){}
    el.classList.add('hidden');
    setTimeout(() => { try{ el.remove(); }catch(_){} }, 500);
    window.removeEventListener('pointerdown', onInteract, true);
    window.removeEventListener('keydown', onInteract, true);
    window.removeEventListener('wheel', onInteract, true);
    window.removeEventListener('touchstart', onInteract, true);
  }
  function onInteract(){ hide(); }

  // Auto-dismiss after a short reveal so the splash doesn't block users
  // who looked away. 1.6s is enough to register the toy name.
  setTimeout(hide, 1600);

  window.addEventListener('pointerdown', onInteract, true);
  window.addEventListener('keydown', onInteract, true);
  window.addEventListener('wheel', onInteract, true);
  window.addEventListener('touchstart', onInteract, true);
})();
