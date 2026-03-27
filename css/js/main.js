window.onload = async () => {
    let isRemoteUpdate = false;
    let previewTimeout;

    await EditorModule.init('monaco-editor').catch(() => console.error("Erro Editor"));

    const updatePreview = () => {
        const iframe = document.getElementById('preview-iframe');
        const consoleEl = document.getElementById('fake-console');
        if(!iframe || !consoleEl) return;
        
        consoleEl.innerHTML = ""; 
        const code = EditorModule.instance.getValue();

        const inject = `
            <script>
                const _log = console.log;
                console.log = (...args) => {
                    window.parent.postMessage({ type: 'LOG', content: args.join(' ') }, '*');
                    _log.apply(console, args);
                };
                window.onerror = (m) => window.parent.postMessage({ type: 'LOG', content: 'ERR: '+m }, '*');
            </script>
        `;
        const blob = new Blob([inject + code], { type: 'text/html' });
        iframe.src = URL.createObjectURL(blob);
    };

    window.addEventListener('message', (e) => {
        if (e.data.type === 'LOG') {
            const div = document.createElement('div');
            div.className = 'log-item';
            div.innerText = "> " + e.data.content;
            document.getElementById('fake-console').appendChild(div);
        }
    });

    const handleData = (data) => {
        if (data.type === 'FOLDER_SYNC') FilesModule.renderFileList(data.files);
        if (data.type === 'SYNC' || data.type === 'FILE') {
            isRemoteUpdate = true;
            if (data.type === 'FILE') {
                EditorModule.setLanguage(data.name);
                document.getElementById('active-filename').innerText = data.name;
            }
            EditorModule.instance.setValue(data.content);
            updatePreview();
            setTimeout(() => { isRemoteUpdate = false; }, 50);
        }
    };

    P2PModule.init(handleData);

    document.getElementById('open-folder-btn').onclick = () => FilesModule.openFolder();
    document.getElementById('create-file-btn').onclick = () => FilesModule.createFile();
    document.getElementById('connect-btn').onclick = () => {
        const id = document.getElementById('peer-id-input').value;
        if(id) P2PModule.connect(id, handleData);
    };

    EditorModule.instance.onDidChangeModelContent(() => {
        if (!isRemoteUpdate) {
            P2PModule.send({ type: 'SYNC', content: EditorModule.instance.getValue() });
        }
        clearTimeout(previewTimeout);
        previewTimeout = setTimeout(updatePreview, 800);
    });
};
