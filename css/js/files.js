const FilesModule = {
    folderHandle: null,
    currentFileHandle: null,

    async openFolder() {
        try {
            this.folderHandle = await window.showDirectoryPicker();
            const files = await this.getFilesList();
            this.renderFileList(files);
            P2PModule.send({ type: 'FOLDER_SYNC', files: files });
        } catch (err) { console.warn("Acesso negado."); }
    },

    async getFilesList() {
        const files = [];
        for await (const entry of this.folderHandle.values()) {
            if (entry.kind === 'file') files.push(entry.name);
        }
        return files;
    },

    renderFileList(files) {
        const listUI = document.getElementById('file-list');
        if (!listUI) return;
        listUI.innerHTML = "";
        files.forEach(fileName => {
            const li = document.createElement('li');
            li.innerText = "📄 " + fileName;
            li.onclick = () => this.loadFileByName(fileName);
            listUI.appendChild(li);
        });
    },

    async saveCurrentFile() {
        if (!this.currentFileHandle) return;
        try {
            const writable = await this.currentFileHandle.createWritable();
            await writable.write(EditorModule.instance.getValue());
            await writable.close();
        } catch (err) { console.error("Erro ao salvar:", err); }
    },

    async loadFileByName(fileName) {
        if (!this.folderHandle) return;
        await this.saveCurrentFile();
        try {
            this.currentFileHandle = await this.folderHandle.getFileHandle(fileName);
            const file = await this.currentFileHandle.getFile();
            const content = await file.text();
            EditorModule.instance.setValue(content);
            EditorModule.setLanguage(fileName);
            document.getElementById('active-filename').innerText = fileName;
            P2PModule.send({ type: 'FILE', name: fileName, content: content });
        } catch (err) { console.error(err); }
    },

    async createFile() {
        if (!this.folderHandle) return alert("Abra uma pasta primeiro!");
        const fileName = prompt("Nome do arquivo:");
        if (!fileName) return;
        try {
            await this.folderHandle.getFileHandle(fileName, { create: true });
            const files = await this.getFilesList();
            this.renderFileList(files);
            P2PModule.send({ type: 'FOLDER_SYNC', files: files });
        } catch (err) { console.error(err); }
    }
};
