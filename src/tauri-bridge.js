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
      position:fixed;top:0;left:0;right:0;z-index:99999;
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
});
