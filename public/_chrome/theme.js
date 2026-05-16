/* Canonical theme switcher for toys.iamkesava.com.
   Mirrors the wordart/pixart shared/theme.js but injected globally.

   - 5 themes: default · brutalist · editorial · terminal · zen
   - Persisted in localStorage under "kami.theme"
   - T cycles to next theme
   - Sets data-theme on <html>; respects per-toy CSS overrides
   - Idempotent — re-running is safe

   Reads/writes data-theme attribute. If a toy already wires its own
   theme system on the same attribute, this one cooperates (both end up
   in sync) because we're the canonical writer. */
(function(){
  'use strict';
  if(window.__kamiThemeInit){ return; }
  window.__kamiThemeInit = true;

  const THEMES = [
    { id:'default',   label:'classic',   icon:'○' },  // ○
    { id:'brutalist', label:'brutalist', icon:'■' },  // ■
    { id:'editorial', label:'editorial', icon:'¶' },  // ¶
    { id:'terminal',  label:'phosphor',  icon:'>' },
    { id:'zen',       label:'zen',       icon:'◯' },  // ◯
  ];
  const KEY = 'kami.theme';
  const LEGACY_KEYS = ['wa.theme','px.theme','pixart.theme','wordart.theme'];

  function readStored(){
    try{
      let v = localStorage.getItem(KEY);
      if(v) return v;
      for(const lk of LEGACY_KEYS){
        v = localStorage.getItem(lk);
        if(v){ localStorage.setItem(KEY, v); return v; }
      }
    }catch(_){}
    return 'default';
  }
  function writeStored(id){
    try{ localStorage.setItem(KEY, id); }catch(_){}
  }

  function apply(id){
    if(id === 'default'){
      document.documentElement.removeAttribute('data-theme');
    } else {
      document.documentElement.setAttribute('data-theme', id);
    }
    const meta = THEMES.find(t => t.id === id) || THEMES[0];
    const pill = document.querySelector('.theme-switcher-pill');
    if(pill){
      pill.setAttribute('title', meta.label + ' (T)');
      pill.setAttribute('aria-label', 'Current theme: ' + meta.label + '. Click or press T to change.');
      const icon = pill.querySelector('.theme-switcher-pill-icon');
      if(icon) icon.textContent = meta.icon;
    }
    const options = document.querySelectorAll('.theme-switcher-option');
    options.forEach(opt => {
      opt.classList.toggle('active', opt.dataset.theme === id);
    });
    try{
      window.dispatchEvent(new CustomEvent('kami:themechange', { detail:{ id } }));
    }catch(_){}
  }

  function current(){ return readStored(); }
  function set(id){ writeStored(id); apply(id); }

  function buildPicker(container){
    if(container.querySelector('.theme-switcher-picker')) return;
    const picker = document.createElement('div');
    picker.className = 'theme-switcher-picker';
    for(const t of THEMES){
      const b = document.createElement('button');
      b.className = 'theme-switcher-option';
      b.type = 'button';
      b.dataset.theme = t.id;
      b.innerHTML = '<span class="theme-switcher-option-icon">' + t.icon + '</span><span>' + t.label + '</span>';
      b.addEventListener('click', (e) => {
        e.stopPropagation();
        set(t.id);
        container.classList.remove('open');
      });
      picker.appendChild(b);
    }
    container.appendChild(picker);
  }

  function attach(){
    const container = document.querySelector('.theme-switcher-container');
    if(!container){
      // No chrome injected on this page — just apply theme to <html>.
      apply(current());
      return;
    }
    buildPicker(container);
    const pill = container.querySelector('.theme-switcher-pill');
    if(pill && !pill.dataset.kamiWired){
      pill.dataset.kamiWired = '1';
      pill.addEventListener('click', (e) => {
        e.stopPropagation();
        container.classList.toggle('open');
      });
    }
    document.addEventListener('click', (e) => {
      if(!container.contains(e.target)) container.classList.remove('open');
    });
    apply(current());
  }

  // Apply theme to <html> immediately so initial paint is correct.
  apply(current());

  if(document.readyState === 'loading'){
    document.addEventListener('DOMContentLoaded', attach);
  } else {
    attach();
  }

  // T key cycles theme. Respect inputs and per-toy opt-outs.
  // A toy can opt-out by setting <html data-kami-shortcuts="off"> in its
  // markup (or via the aggregator), which is what we do for toys that
  // capture every key as input (gravity-type, sonicc).
  document.addEventListener('keydown', (e) => {
    if(e.defaultPrevented) return;
    if(document.documentElement.getAttribute('data-kami-shortcuts') === 'off') return;
    const t = e.target;
    if(t && typeof t.matches === 'function' && t.matches('input, textarea, select, [contenteditable="true"]')) return;
    if(e.metaKey || e.ctrlKey || e.altKey) return;
    if(e.key === 't' || e.key === 'T'){
      const i = THEMES.findIndex(x => x.id === current());
      set(THEMES[(i + 1) % THEMES.length].id);
    }
  });

  window.KamiTheme = { set, apply, current, THEMES };
})();
