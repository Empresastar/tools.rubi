window.onload = async () => {
    let isRemoteUpdate = false;
    let previewTimeout;

    // Inicializa Editor
    await EditorModule.init('monaco-editor').catch(() => console.error("Erro Editor"));

    // Função para renderizar Preview e Console
    const updatePreview = () => {
        const iframe = document.getElementById('preview-iframe');
        const code = EditorModule.instance.getValue();
        const consoleEl = document.getElementById('fake-console');
        consoleEl.innerHTML = ""; // Limpa console ao rodar novo código

        const consoleScript = `
            <script>
                const _log = console.log;
                console.log = function(...args) {
                    window.parent.postMessage({ type: 'LOG', content: args.join(' ') }, '*');
                    _log.apply(console, args);
                };
                window.onerror = function(msg) {
                    window.parent.postMessage({ type: 'LOG', content: 'ERROR: ' + msg }, '*');
                };
            <\/script>
        `;

        const blob = new Blob([consoleScript + code], { type: 'text/html' });
        iframe.src = URL.createObjectURL(blob);
    };

    // Listener para o Console Virtual
    window.addEventListener('message', (event) => {
        if (event.data.type === 'LOG') {
            const div = document.createElement('div');
            div.className = 'log-item';
            div.innerText = `> ${event.data.content}`;
            document.getElementById('fake-console').appendChild(div);
        }
    });

    // Handler de dados P2P
    const handleData = (data) => {
        if (data.type === 'FOLDER_SYNC') {
            FilesModule.renderFileList(data.files);
        }
        if (data.type === 'SYNC' || data.type === 'FILE') {
            isRemoteUpdate = true;
            if (data.type === 'FILE') {
                EditorModule.setLanguage(data.name);
                document.getElementById('active-filename').innerText = data.name;
            }
            const pos = EditorModule.instance.getPosition();
            EditorModule.instance.setValue(data.content);
            EditorModule.instance.setPosition(pos);
            updatePreview();
            setTimeout(() => { isRemoteUpdate = false; }, 50);
        }
    };

    P2PModule.init(handleData);

    // Eventos de Botões
    document.getElementById('open-folder-btn').onclick = () => FilesModule.openFolder();
    document.getElementById('create-file-btn').onclick = () => FilesModule.createFile();
    document.getElementById('connect-btn').onclick = () => {
        const id = document.getElementById('peer-id-input').value;
        if(id) P2PModule.connect(id, handleData);
    };

    // Atualização em Tempo Real
    EditorModule.instance.onDidChangeModelContent(() => {
        if (!isRemoteUpdate) {
            P2PModule.send({ type: 'SYNC', content: EditorModule.instance.getValue() });
        }
        clearTimeout(previewTimeout);
        previewTimeout = setTimeout(updatePreview, 800);
    });
};
