const P2PModule = {
    peer: null,
    connection: null,
    init(onDataReceived) {
        this.peer = new Peer();
        this.peer.on('open', (id) => document.getElementById('display-id').innerText = id);
        this.peer.on('connection', (conn) => this.setupConn(conn, onDataReceived));
    },
    connect(targetId, onDataReceived) {
        const conn = this.peer.connect(targetId);
        this.setupConn(conn, onDataReceived);
    },
    setupConn(conn, onDataReceived) {
        this.connection = conn;
        conn.on('open', () => {
            document.getElementById('sync-status').innerText = "🟢 Conectado";
            // Se o Host já tiver uma pasta aberta, ele pode reenviar a lista aqui
        });
        conn.on('data', (data) => onDataReceived(data));
    },
    send(data) {
        if (this.connection && this.connection.open) this.connection.send(data);
    }
};
