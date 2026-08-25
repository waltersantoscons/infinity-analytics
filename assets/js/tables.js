/**
 * ============================================================================
 * TABLES.JS — Tabelas inteligentes (DataTables) e exportações
 * ============================================================================
 * Ranking de clientes, base completa de clientes, e as exportações para
 * Excel, CSV e PDF.
 * ============================================================================
 */

function renderRanking(){
  if (typeof $ === 'undefined' || !$.fn || !$.fn.DataTable){
    document.querySelector('#tableRanking tbody').innerHTML = `<tr><td colspan="12" style="padding:16px;color:var(--gray);">Não foi possível carregar a biblioteca de tabelas (DataTables). Verifique sua conexão com a internet e atualize a página.</td></tr>`;
    return;
  }
  const d = [...STATE.filtered].sort((a,b)=>b.score-a.score);
  if (STATE.dtRanking) { STATE.dtRanking.destroy(); document.querySelector('#tableRanking tbody').innerHTML=''; }
  const rows = d.map((x,i)=>[
    i+1, x.cliente, x.uf,
    `<span class="status-pill ${x.baaf==='Sim'?'pill-sim':'pill-nao'}">${x.baaf}</span>`,
    `<span class="status-pill ${x.status==='VENCIDO'?'status-vencido':'status-prazo'}">${x.status}</span>`,
    x.roi.toFixed(2)+'x', fmtMoeda(x.economia), x.diasVencidos, fmtMoeda(x.valorQuit), fmtMoeda(x.saldo),
    x.score.toFixed(1), `<span class="score-badge ${scoreBadgeClass(x.classificacao)}">${x.classificacao}</span>`
  ]);
  STATE.dtRanking = $('#tableRanking').DataTable({
    data: rows, destroy:true, pageLength:10, lengthMenu:[10,25,50,100],
    language: dtLangPtBr(), order:[], dom:'lrtip'
  });
}

const CLIENTES_COLS = [
  {key:'cliente', label:'Cliente'}, {key:'uf', label:'UF'}, {key:'modelo', label:'Modelo'},
  {key:'baaf', label:'BAAF'}, {key:'doc', label:'Doc. Completa'}, {key:'status', label:'Status'},
  {key:'fundo', label:'Fundo'}, {key:'saldo', label:'Saldo Devedor'}, {key:'valorQuit', label:'Vlr Quitação'},
  {key:'economia', label:'Economia'}, {key:'pct', label:'%Atingido'}, {key:'quitado', label:'Quitado'},
  {key:'dataPrevista', label:'Data Prevista'}, {key:'score', label:'Score'}
];

function renderTabelaClientes(){
  if (typeof $ === 'undefined' || !$.fn || !$.fn.DataTable){
    document.querySelector('#tableClientes tbody').innerHTML = `<tr><td colspan="14" style="padding:16px;color:var(--gray);">Não foi possível carregar a biblioteca de tabelas (DataTables). Verifique sua conexão com a internet e atualize a página.</td></tr>`;
    return;
  }
  const d = STATE.filtered;
  if (STATE.dtClientes) { STATE.dtClientes.destroy(); document.querySelector('#tableClientes tbody').innerHTML=''; }
  const rows = d.map(x=>[
    x.cliente, x.uf, x.modelo,
    `<span class="status-pill ${x.baaf==='Sim'?'pill-sim':'pill-nao'}">${x.baaf}</span>`,
    `<span class="status-pill ${x.doc==='Sim'?'pill-sim':'pill-nao'}">${x.doc}</span>`,
    `<span class="status-pill ${x.status==='VENCIDO'?'status-vencido':'status-prazo'}">${x.status}</span>`,
    fmtMoeda(x.fundo), fmtMoeda(x.saldo), fmtMoeda(x.valorQuit), fmtMoeda(x.economia), fmtPct(x.pct),
    `<span class="status-pill ${x.quitado?'pill-sim':'pill-nao'}">${x.quitado?'Sim':'Não'}</span>`,
    fmtData(x.dataPrevista), x.score.toFixed(1)
  ]);
  STATE.dtClientes = $('#tableClientes').DataTable({
    data: rows, destroy:true, pageLength:10, lengthMenu:[10,25,50,100],
    language: dtLangPtBr(), dom:'lrtip', fixedHeader:false
  });
  buildColToggle();
}

function buildColToggle(){
  const panel = document.getElementById('colTogglePanel');
  panel.innerHTML = CLIENTES_COLS.map((c,i)=>`
    <label><input type="checkbox" checked onchange="toggleCol(${i}, this.checked)"> ${c.label}</label>`).join('');
}

function toggleCol(idx, visible){
  if (!STATE.dtClientes) return;
  STATE.dtClientes.column(idx).visible(visible);
}

function toggleColMenu(){ document.getElementById('colTogglePanel').classList.toggle('show'); }

document.addEventListener('click', (e)=>{
  const menu = document.querySelector('.col-toggle-menu');
  if (menu && !menu.contains(e.target)) document.getElementById('colTogglePanel')?.classList.remove('show');
});

function dtLangPtBr(){
  return {
    search:'', searchPlaceholder:'Pesquisar...', lengthMenu:'Mostrar _MENU_ registros',
    info:'_START_–_END_ de _TOTAL_', infoEmpty:'0 registros', infoFiltered:'(filtrado de _MAX_ no total)',
    zeroRecords:'Nenhum registro encontrado', paginate:{first:'«', last:'»', next:'›', previous:'‹'}
  };
}

document.getElementById('globalSearch')?.addEventListener('input', function(){
  if (STATE.dtClientes) STATE.dtClientes.search(this.value).draw();
});

function bibliotecaIndisponivel(nome){
  showToast(`Biblioteca "${nome}" não carregou (verifique sua conexão com a internet) — não foi possível exportar.`, 'error');
}

function exportExcel(){
  if (typeof XLSX === 'undefined'){ bibliotecaIndisponivel('SheetJS/XLSX'); return; }
  try{
    // Nota: quando o setor Apreensões for implementado (ver docs/PROXIMOS_PASSOS.md),
    // adicione aqui um branch equivalente ao que existia no protótipo single-file.
    const ws = XLSX.utils.json_to_sheet(STATE.filtered.map(x=>({
      UF:x.uf, Cliente:x.cliente, Modelo:x.modelo, BAAF:x.baaf, 'Doc.Completa':x.doc, Status:x.status,
      Fundo:x.fundo, 'Saldo Devedor':x.saldo, 'Valor Quitação':x.valorQuit, Economia:x.economia,
      '%Atingido':x.pct, Quitado:x.quitado?'Sim':'Não', 'Data Prevista':x.dataPrevista||'', ROI:x.roi.toFixed(2),
      'Dias Vencidos':x.diasVencidos, Score:x.score, Classificação:x.classificacao, Prioridade:x.prioridade
    })));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Infinity Analytics');
    XLSX.writeFile(wb, `infinity_analytics_${luxon.DateTime.now().toFormat('yyyyMMdd_HHmm')}.xlsx`);
    showToast('Excel exportado com sucesso!', 'success');
  }catch(err){ console.error(err); showToast('Erro ao exportar Excel.', 'error'); }
}

function exportTableExcel(tableId, filename){
  if (typeof XLSX === 'undefined'){ bibliotecaIndisponivel('SheetJS/XLSX'); return; }
  try{
    const table = document.getElementById(tableId);
    const wb = XLSX.utils.table_to_book(table, {sheet:'Dados'});
    XLSX.writeFile(wb, `${filename}.xlsx`);
    showToast('Excel exportado!', 'success');
  }catch(err){ console.error(err); showToast('Erro ao exportar Excel.', 'error'); }
}

function exportTableCsv(tableId, filename){
  if (typeof XLSX === 'undefined'){ bibliotecaIndisponivel('SheetJS/XLSX'); return; }
  try{
    const table = document.getElementById(tableId);
    const wb = XLSX.utils.table_to_book(table, {sheet:'Dados'});
    const csv = XLSX.utils.sheet_to_csv(wb.Sheets['Dados']);
    const blob = new Blob(["\ufeff"+csv], {type:'text/csv;charset=utf-8;'});
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = `${filename}.csv`; a.click();
    showToast('CSV exportado!', 'success');
  }catch(err){ console.error(err); showToast('Erro ao exportar CSV.', 'error'); }
}

function exportTablePdf(tableId, title){
  if (typeof window.jspdf === 'undefined'){ bibliotecaIndisponivel('jsPDF'); return; }
  try{
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({orientation:'landscape'});
    doc.setFontSize(14); doc.text(title, 14, 15);
    doc.setFontSize(9); doc.text(`Gerado em ${luxon.DateTime.now().toFormat('dd/MM/yyyy HH:mm')}`, 14, 21);
    doc.autoTable({ html:'#'+tableId, startY:26, styles:{fontSize:7}, headStyles:{fillColor:[184,134,58], textColor:[255,255,255]}, margin:{left:10,right:10} });
    doc.save(`${title.replace(/\s+/g,'_')}.pdf`);
    showToast('PDF exportado!', 'success');
  }catch(err){ console.error(err); showToast('Erro ao exportar PDF.', 'error'); }
}

function exportPDF(){
  if (typeof window.jspdf === 'undefined'){ bibliotecaIndisponivel('jsPDF'); return; }
  try{
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    // Nota: quando o setor Apreensões for implementado, adicione aqui um
    // branch equivalente ao que existia no protótipo single-file.
    const ag = calcularAgregados(STATE.filtered);
    doc.setFontSize(16); doc.text('Infinity Analytics — Dashboard Executivo', 14, 16);
    doc.setFontSize(10); doc.text(`Gerado em ${luxon.DateTime.now().toFormat('dd/MM/yyyy HH:mm')}`, 14, 23);
    const kpis = [
      ['Total de Clientes', ag.totalClientes], ['Quitados', ag.quitados], ['Pendentes', ag.pendentes],
      ['Vencidos', ag.vencidos], ['Fundo Total', fmtMoeda(ag.fundoTotal)], ['Saldo Devedor Total', fmtMoeda(ag.saldoTotal)],
      ['Valor Total p/ Quitação', fmtMoeda(ag.valorQuitTotal)], ['Economia Total', fmtMoeda(ag.economiaTotal)],
      ['ROI Médio', ag.roiMedio.toFixed(2)+'x'], ['Score Médio', ag.scoreMedio.toFixed(1)]
    ];
    doc.autoTable({ startY:30, head:[['Indicador','Valor']], body:kpis, styles:{fontSize:10}, headStyles:{fillColor:[184,134,58], textColor:[255,255,255]} });
    doc.autoTable({ startY:doc.lastAutoTable.finalY+10, head:[['#','Cliente','UF','Score','ROI','Economia']],
      body: [...STATE.filtered].sort((a,b)=>b.score-a.score).slice(0,20).map((x,i)=>[i+1,x.cliente,x.uf,x.score.toFixed(1),x.roi.toFixed(2)+'x',fmtMoeda(x.economia)]),
      styles:{fontSize:8}, headStyles:{fillColor:[16,185,129]} });
    doc.save(`infinity_analytics_dashboard_${luxon.DateTime.now().toFormat('yyyyMMdd_HHmm')}.pdf`);
    showToast('PDF do dashboard exportado!', 'success');
  }catch(err){ console.error(err); showToast('Erro ao exportar PDF.', 'error'); }
}
