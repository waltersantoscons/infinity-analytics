/**
 * ============================================================================
 * UTILS.JS — Funções utilitárias puras (formatação, datas, helpers genéricos)
 * ============================================================================
 * Nenhuma função aqui depende do DOM ou do estado global da aplicação —
 * são todas puras (mesma entrada = mesma saída), o que as torna fáceis de
 * testar isoladamente e reaproveitar em outros módulos/projetos.
 * ============================================================================
 */

function fmtMoeda(v){
  if (v===null || v===undefined || isNaN(v)) v = 0;
  return v.toLocaleString('pt-BR', {style:'currency', currency:'BRL', maximumFractionDigits:0});
}

function fmtMoedaFull(v){
  if (v===null || v===undefined || isNaN(v)) v = 0;
  return v.toLocaleString('pt-BR', {style:'currency', currency:'BRL'});
}

function fmtNum(v, dec=0){
  if (v===null||v===undefined||isNaN(v)) v=0;
  return v.toLocaleString('pt-BR', {minimumFractionDigits:dec, maximumFractionDigits:dec});
}

function fmtPct(v, dec=1){
  if (v===null||v===undefined||isNaN(v)) v=0;
  return (v*100).toLocaleString('pt-BR',{minimumFractionDigits:dec,maximumFractionDigits:dec}) + '%';
}

function fmtData(iso){
  if(!iso) return '—';
  const dt = luxon.DateTime.fromISO(iso);
  return dt.isValid ? dt.toFormat('dd/MM/yyyy') : '—';
}

function hoje(){ return luxon.DateTime.now(); }

function diasVencidosCalc(validadeIso, status){
  if (!validadeIso) return 0;
  const dt = luxon.DateTime.fromISO(validadeIso);
  if (!dt.isValid) return 0;
  const diff = Math.floor(hoje().diff(dt, 'days').days);
  return diff > 0 ? diff : 0;
}

function scoreBadgeClass(cls){
  return {
    'Muito Alta':'score-muito-alta','Alta':'score-alta','Média':'score-media',
    'Baixa':'score-baixa','Muito Baixa':'score-muito-baixa'
  }[cls] || 'score-media';
}

function unique(arr){ return [...new Set(arr)].filter(v=>v!==undefined && v!==null && v!=='').sort(); }

function debounce(fn, ms){ let t; return (...a)=>{ clearTimeout(t); t=setTimeout(()=>fn(...a), ms); }; }
