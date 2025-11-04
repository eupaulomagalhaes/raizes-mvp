export function enableA11y(){
  // Visível no foco via CSS já aplicado
  // Aria live utils
  const live = document.createElement('div');
  live.setAttribute('aria-live','polite');
  live.setAttribute('aria-atomic','true');
  live.className = 'sr-only';
  Object.assign(live.style,{position:'absolute', width:'1px', height:'1px', overflow:'hidden', clip:'rect(0 0 0 0)'});
  document.body.appendChild(live);
  window.a11yAnnounce = (msg) => { live.textContent = ''; setTimeout(()=> live.textContent = msg, 10); };
}

export function trapFocus(container){
  const focusable = container.querySelectorAll('a,button,input,select,textarea,[tabindex]:not([tabindex="-1"])');
  if (!focusable.length) return () => {};
  const first = focusable[0];
  const last = focusable[focusable.length-1];
  function onKey(e){
    if (e.key !== 'Tab') return;
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  }
  container.addEventListener('keydown', onKey);
  return () => container.removeEventListener('keydown', onKey);
}
