/**
 * ============================================================================
 * NOTIFICATIONS.JS — Sistema de notificações (toasts)
 * ============================================================================
 * Mensagens curtas e não-bloqueantes no canto da tela, usadas para avisos
 * de sucesso, erro e informação em toda a aplicação.
 * ============================================================================
 */

function showToast(msg, type='info'){
  const icons = {info:'circle-info', success:'circle-check', error:'circle-exclamation', warn:'triangle-exclamation'};
  const colors = {info:PALETA.primary, success:PALETA.green, error:PALETA.red, warn:PALETA.yellow};
  const el = document.createElement('div');
  el.className = 'toast glass animate__animated animate__fadeInUp';
  el.style.borderLeft = `4px solid ${colors[type]}`;
  el.innerHTML = `<i class="fa-solid fa-${icons[type]}" style="color:${colors[type]}"></i> <span>${msg}</span>`;
  document.getElementById('toastWrap').appendChild(el);
  setTimeout(()=>{ el.classList.remove('animate__fadeInUp'); el.classList.add('animate__fadeOutRight'); setTimeout(()=>el.remove(), 400); }, 3200);
}
