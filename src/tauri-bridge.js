// Bridge entre o painel (index.html) e o backend Rust do Tauri.
// Só faz algo quando o app roda dentro do Tauri; em navegador normal, window.__TAURI__ não existe
// e o painel cai sozinho no fluxo antigo de download do .bat (ver saveOrRunScript no index.html).

window.dgerasRunScript = async function (scriptText) {
  const { invoke } = window.__TAURI__.core;
  // Escreve o conteúdo do .bat num arquivo temporário e executa elevado (UAC),
  // exatamente como aconteceria se o usuário baixasse e desse duplo-clique nele.
  return await invoke('run_bat_script', { scriptText });
};
