// Bridge entre o painel (index.html) e o backend Rust do Tauri.
// Só faz algo quando o app roda dentro do Tauri; em navegador normal, window.__TAURI__ não existe
// e o painel cai sozinho no fluxo antigo de download do .bat (ver saveOrRunScript no index.html).

window.dgerasRunScript = async function (scriptText) {
  const { invoke } = window.__TAURI__.core;
  // Escreve o conteúdo do .bat num arquivo temporário e executa elevado (UAC),
  // exatamente como aconteceria se o usuário baixasse e desse duplo-clique nele.
  return await invoke('run_bat_script', { scriptText });
};

// ===== Checagem automática de atualização (estilo Discord) =====
// Roda toda vez que o app abre. Se tiver versão nova, baixa sozinho em segundo
// plano (sem perguntar nada) e reinicia automaticamente quando terminar.
async function checkForAppUpdate() {
  if (!window.__TAURI__) return; // só roda dentro do app nativo, não no navegador

  if (!window.__TAURI__.updater || !window.__TAURI__.process) {
    showUpdateBanner('⚠️ Plugin de atualização não carregado (verifique build)');
    setTimeout(() => hideUpdateBanner(), 6000);
    return;
  }

  try {
    const { check } = window.__TAURI__.updater;
    const { relaunch } = window.__TAURI__.process;

    const update = await check();
    if (!update) {
      showUpdateBanner('✓ Você já está na versão mais recente');
      setTimeout(() => hideUpdateBanner(), 3000);
      return;
    }

    showUpdateBanner(`Baixando atualização ${update.version}...`);

    let baixado = 0;
    let total = 0;

    await update.downloadAndInstall((event) => {
      if (event.event === 'Started') {
        total = event.data.contentLength || 0;
      } else if (event.event === 'Progress') {
        baixado += event.data.chunkLength || 0;
        if (total > 0) {
          const pct = Math.min(100, Math.round((baixado / total) * 100));
          showUpdateBanner(`Baixando atualização ${update.version}... ${pct}%`);
        }
      } else if (event.event === 'Finished') {
        showUpdateBanner('Atualização pronta! Reiniciando...');
      }
    });

    setTimeout(() => relaunch(), 1200);
  } catch (err) {
    showUpdateBanner('⚠️ Erro ao checar atualização: ' + (err?.message || err));
    setTimeout(() => hideUpdateBanner(), 8000);
  }
}

function hideUpdateBanner() {
  const el = document.getElementById('dgerasUpdateBanner');
  if (el) el.remove();
}

// Barra fina e discreta no topo da tela, sem interromper o uso do app —
// igual ao aviso de atualização do Discord.
function showUpdateBanner(text) {
  let el = document.getElementById('dgerasUpdateBanner');
  if (!el) {
    el = document.createElement('div');
    el.id = 'dgerasUpdateBanner';
    el.style.cssText = `
      position:fixed;top:40px;left:0;right:0;z-index:9998;
      background:linear-gradient(90deg, var(--accent,#f0b93c), var(--accent2,#ffcf6b));
      color:#1a1410;font:600 12.5px/1 var(--sans,sans-serif);
      padding:8px 16px;text-align:center;
      box-shadow:0 2px 12px rgba(0,0,0,.35);
    `;
    document.body.appendChild(el);
  }
  el.textContent = text;
}

window.addEventListener('DOMContentLoaded', () => {
  checkForAppUpdate();

  // Controles da barra de título customizada (minimizar/maximizar/fechar)
  if (window.__TAURI__){
    try{
      const { getCurrentWindow } = window.__TAURI__.window;
      const win = getCurrentWindow();
      document.getElementById('titlebarMin')?.addEventListener('click', ()=> win.minimize());
      document.getElementById('titlebarClose')?.addEventListener('click', ()=> win.close());

      const maxBtn = document.getElementById('titlebarMax');
      const RESTORE_ICON = '<svg viewBox="0 0 12 12"><rect x="3.4" y="1.6" width="6" height="6" rx=".5" fill="none" stroke="currentColor" stroke-width="1.1"/><path d="M2.6 4.4H2A.4.4 0 0 0 1.6 4.8v5.6c0 .22.18.4.4.4h5.6c.22 0 .4-.18.4-.4v-.6" fill="none" stroke="currentColor" stroke-width="1.1"/></svg>';
      const MAX_ICON = '<svg viewBox="0 0 12 12"><rect x="2.2" y="2.2" width="7.6" height="7.6" rx=".5" fill="none" stroke="currentColor" stroke-width="1.2"/></svg>';

      async function syncMaxIcon(){
        if (!maxBtn) return;
        const isFs = await win.isFullscreen();
        maxBtn.innerHTML = isFs ? RESTORE_ICON : MAX_ICON;
        maxBtn.setAttribute('aria-label', isFs ? 'Sair da tela cheia' : 'Tela cheia');
      }
      maxBtn?.addEventListener('click', async ()=>{
        const isFs = await win.isFullscreen();
        await win.setFullscreen(!isFs);
        syncMaxIcon();
      });
      document.getElementById('customTitlebar')?.addEventListener('dblclick', (e)=>{
        if (e.target.closest('.titlebar-controls')) return;
        win.isFullscreen().then(isFs => win.setFullscreen(!isFs)).then(syncMaxIcon);
      });
      win.onResized(()=> syncMaxIcon());
      syncMaxIcon();
    }catch(err){
      console.log('Controles de janela indisponíveis:', err);
    }
  }
});
