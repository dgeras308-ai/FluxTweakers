# By Dgeras — App Desktop (Tauri)

Esse projeto empacota o painel `dgeras` como um `.exe` instalável de verdade. A build final
precisa rodar na sua máquina Windows (esse é o único ponto que não dá pra fazer aqui).

## O que mudou em relação ao HTML puro

- `src/index.html` — o mesmo painel, com um único trecho novo: a função `saveOrRunScript()`.
  Quando o app roda dentro do Tauri, ela chama `window.dgerasRunScript()` (via `tauri-bridge.js`)
  em vez de baixar o `.bat`. Fora do Tauri (se você abrir o HTML direto no navegador), continua
  baixando o `.bat` normalmente — nada quebrou.
- `src-tauri/src/main.rs` — comando Rust `run_bat_script`: grava o `.bat` gerado pelo painel
  num arquivo temporário e executa via `start`, disparando o próprio fluxo de UAC que já existe
  dentro do `.bat` (o `goto UACPrompt` que você já tinha).

## Pré-requisitos (Windows)

1. **Rust**: instale via https://rustup.rs (padrão, sem configuração extra)
2. **Node.js** (LTS): https://nodejs.org
3. **Microsoft C++ Build Tools**: instale o "Desktop development with C++" pelo
   Visual Studio Installer (necessário pro Rust compilar no Windows)
4. **WebView2**: já vem instalado por padrão no Windows 10/11 atualizado

## Passo a passo

```powershell
cd dgeras-tauri
npm install
npm run tauri icon caminho\para\seu\logo.png   # gera todos os tamanhos de ícone a partir de 1 imagem (PNG 1024x1024 ideal)
npm run dev                                     # roda em modo desenvolvimento pra testar
npm run build                                   # gera o .exe instalável final
```

O instalador final (`.msi` e `.exe` via NSIS) fica em:
`src-tauri/target/release/bundle/`

## Testando o fluxo de execução direta

1. Rode `npm run dev`
2. Marque alguns ajustes e clique em "Gerar e baixar .bat"
3. Em vez de baixar, o app agora pede UAC e executa direto — mesma lógica de sempre,
   só sem o passo manual de abrir a pasta de downloads

## Próximos passos possíveis (não incluídos ainda)

- Ícone da bandeja do sistema (system tray)
- Autoupdate (Tauri tem suporte nativo via `tauri-plugin-updater`)
- Assinatura de código pro Windows não bloquear o `.exe` como "não reconhecido"
  (sem isso, o SmartScreen vai avisar na primeira execução — normal pra apps novos)
