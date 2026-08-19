// Bridge entre o painel (index.html) e o backend Rust do Tauri.
// Só faz algo quando o app roda dentro do Tauri; em navegador normal, window.__TAURI__ não existe
// e o painel cai sozinho no fluxo antigo de download do .bat (ver saveOrRunScript no index.html).

window.dgerasRunScript = async function (scriptText) {
  const { invoke } = window.__TAURI__.core;
  // Escreve o conteúdo do .bat num arquivo temporário e executa elevado (UAC),
  // exatamente como aconteceria se o usuário baixasse e desse duplo-clique nele.
  return await invoke('run_bat_script', { scriptText });
};

// ===== Checagem automática de atualização =====
// Roda toda vez que o app abre. Se tiver versão nova publicada no GitHub Releases,
// baixa e pergunta ao usuário se quer reiniciar pra aplicar.
async function checkForAppUpdate() {
  if (!window.__TAURI__) return; // só roda dentro do app nativo, não no navegador
  try {
    const { check } = window.__TAURI__.updater;
    const { relaunch } = window.__TAURI__.process;

    const update = await check();
    if (update) {
      const querAtualizar = confirm(
        `Nova versão disponível: ${update.version}\n\nDeseja baixar e instalar agora? O app vai reiniciar sozinho ao terminar.`
      );
      if (querAtualizar) {
        await update.downloadAndInstall();
        await relaunch();
      }
    }
  } catch (err) {
    console.log('Checagem de atualização falhou (sem internet ou sem releases ainda):', err);
  }
}

window.addEventListener('DOMContentLoaded', () => {
  checkForAppUpdate();
});

