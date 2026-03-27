const RuntimeModule = {
  updatePreview() {
    const iframe = document.getElementById('preview-iframe');
    const code = EditorModule.instance.getValue();
    const consoleEl = document.getElementById('fake-console');
    
    // Script para interceptar o console do iframe
    const consoleScript = `
            <script>
                const _log = console.log;
                console.log = function(...args) {
                    window.parent.postMessage({ type: 'LOG', content: args.join(' ') }, '*');
                    _log.apply(console, args);
                };
            <\/script>
        `;
    
    // Monta o conteúdo (Assume HTML por padrão no preview)
    const blob = new Blob([consoleScript + code], { type: 'text/html' });
    iframe.src = URL.createObjectURL(blob);
  },
  
  initConsoleListener() {
    const consoleEl = document.getElementById('fake-console');
    window.addEventListener('message', (event) => {
      if (event.data.type === 'LOG') {
        const div = document.createElement('div');
        div.className = 'log-item';
        div.innerText = `> ${event.data.content}`;
        consoleEl.appendChild(div);
        consoleEl.scrollTop = consoleEl.scrollHeight;
      }
    });
  }
};
