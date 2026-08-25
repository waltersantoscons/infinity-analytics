/**
 * ============================================================================
 * ANIMATIONS.JS — Animações e micro-interações de UI
 * ============================================================================
 * Contadores animados (CountUp), alternância de tema claro/escuro,
 * abrir/fechar sidebar no mobile, tela cheia, e remoção da tela de
 * carregamento inicial.
 * ============================================================================
 */

function animateCount(el, endVal, isMoney=false, isPct=false, dec=0){
  // O build UMD do CountUp.js expõe o namespace global em minúsculas: window.countUp.CountUp
  const CU = (typeof countUp !== 'undefined' && countUp.CountUp) ? countUp.CountUp : (typeof CountUp !== 'undefined' ? CountUp.CountUp : null);
  if (!STATE.animEnabled || !CU || !el){
    if (el) el.textContent = isMoney ? fmtMoeda(endVal) : isPct ? fmtPct(endVal,dec) : fmtNum(endVal,dec);
    return;
  }
  try{
    const opts = { duration:1.4, separator:'.', decimal:',', decimalPlaces: isPct? (dec+2) : dec };
    let ci;
    if (isMoney){ opts.prefix='R$ '; ci = new CU(el, endVal, opts); }
    else if (isPct){ ci = new CU(el, endVal*100, {...opts, suffix:'%'}); }
    else { ci = new CU(el, endVal, opts); }
    if (ci && !ci.error) ci.start(); else el.textContent = isMoney?fmtMoeda(endVal):isPct?fmtPct(endVal,dec):fmtNum(endVal,dec);
  }catch(err){
    el.textContent = isMoney?fmtMoeda(endVal):isPct?fmtPct(endVal,dec):fmtNum(endVal,dec);
  }
}

function toggleTheme(){
  STATE.theme = STATE.theme==='dark' ? 'light' : 'dark';
  document.body.setAttribute('data-theme', STATE.theme);
  document.getElementById('themeBtn').innerHTML = `<i class="fa-solid fa-${STATE.theme==='dark'?'moon':'sun'}"></i>`;
  document.getElementById('themeSwitch').checked = STATE.theme==='dark';
  renderizarPaginaAtiva();
}

document.getElementById('themeSwitch').addEventListener('change', function(){
  STATE.theme = this.checked ? 'dark' : 'light';
  document.body.setAttribute('data-theme', STATE.theme);
  document.getElementById('themeBtn').innerHTML = `<i class="fa-solid fa-${STATE.theme==='dark'?'moon':'sun'}"></i>`;
  renderizarPaginaAtiva();
});

function toggleSidebar(force){
  const sb = document.getElementById('sidebar');
  const ov = document.getElementById('mobileOverlay');
  const show = force !== undefined ? force : !sb.classList.contains('open');
  sb.classList.toggle('open', show);
  ov.classList.toggle('show', show);
}

function toggleFullscreen(){
  if (!document.fullscreenElement) document.documentElement.requestFullscreen().catch(()=>{});
  else document.exitFullscreen();
}

function esconderOverlay(){
  const ov = document.getElementById('loadingOverlay');
  if (!ov) return;
  ov.style.opacity='0';
  setTimeout(()=>ov.remove(), 450);
}
