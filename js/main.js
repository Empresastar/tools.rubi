/**
 * DEADLY RAILS - Engine Principal
 * Este arquivo deve ser o ÚLTIMO a ser carregado no index.html
 */

// 1. Definição de Variáveis Globais (Acessíveis por todos os arquivos)
var scene, camera, renderer, clock;
var player, train;
var throttle = 0, trainSpeed = 0, steam = 50, money = 0;
var isRiding = false, inventory = [];
var yaw = 0, pitch = 0;
var keys = {};

// 2. Inicialização do Motor
function init() {
    // Cenário e Renderização
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x87CEEB); // Céu azul
    scene.fog = new THREE.Fog(0x87CEEB, 20, 500);

    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 2000);
    clock = new THREE.Clock();

    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    document.body.appendChild(renderer.domElement);

    // Iluminação
    const ambient = new THREE.AmbientLight(0xffffff, 0.7);
    scene.add(ambient);
    const sun = new THREE.DirectionalLight(0xffffff, 1.0);
    sun.position.set(100, 200, 100);
    scene.add(sun);

    // 3. Chamada dos Módulos Externos (Scripts divididos)
    // Usamos verificações de tipo para evitar erros se o arquivo falhar no carregamento
    if (typeof setupWorld === "function") {
        setupWorld();
    } else {
        console.error("Erro: world.js não foi carregado corretamente.");
    }

    if (typeof createTrain === "function") {
        createTrain();
    } else {
        console.error("Erro: train.js não foi carregado corretamente.");
    }

    if (typeof createPlayer === "function") {
        createPlayer();
    } else {
        console.error("Erro: player.js não foi carregado corretamente.");
    }

    // 4. Configuração de Controles (Mouse e Teclado)
    setupControls();

    // 5. Iniciar Loop de Animação
    animate();
}

// Configuração de Inputs
function setupControls() {
    // Trava do Mouse (Pointer Lock)
    document.addEventListener('mousedown', () => {
        if (!document.pointerLockElement) {
            renderer.domElement.requestPointerLock();
        }
    });

    // Movimento da Câmera
    document.addEventListener('mousemove', (e) => {
        if (document.pointerLockElement) {
            yaw -= e.movementX * 0.002;
            pitch -= e.movementY * 0.002;
            pitch = Math.max(-1.5, Math.min(1.5, pitch)); // Limita olhar para cima/baixo
        }
    });

    // Teclado
    window.addEventListener('keydown', (e) => {
        keys[e.code] = true;
        
        // Interação (Tecla E)
        if (e.code === 'KeyE') {
            if (typeof handleInteractions === "function") handleInteractions();
        }

        // Entrar/Sair do Trem (Tecla Q)
        if (e.code === 'KeyQ') {
            if (player && train) {
                const dist = player.position.distanceTo(train.position);
                if (dist < 10) isRiding = !isRiding;
            }
        }
    });

    window.addEventListener('keyup', (e) => {
        keys[e.code] = false;
    });

    // Suporte para Celular (Toque simples interage)
    renderer.domElement.addEventListener('touchstart', () => {
        if (typeof handleInteractions === "function") handleInteractions();
    }, false);

    // Redimensionamento de Tela
    window.addEventListener('resize', () => {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    });
}

// 6. Loop Principal (Frames)
function animate() {
    requestAnimationFrame(animate);
    const delta = clock.getDelta();

    // Lógica de Movimento
    if (player) {
        if (!isRiding) {
            // Movimento a pé
            const moveSpeed = 15 * delta;
            if (keys['KeyW']) {
                player.position.x -= Math.sin(yaw) * moveSpeed;
                player.position.z -= Math.cos(yaw) * moveSpeed;
            }
            if (keys['KeyS']) {
                player.position.x += Math.sin(yaw) * moveSpeed;
                player.position.z += Math.cos(yaw) * moveSpeed;
            }
            if (keys['KeyA']) {
                player.position.x -= Math.cos(yaw) * moveSpeed;
                player.position.z += Math.sin(yaw) * moveSpeed;
            }
            if (keys['KeyD']) {
                player.position.x += Math.cos(yaw) * moveSpeed;
                player.position.z -= Math.sin(yaw) * moveSpeed;
            }
        } else if (train) {
            // Movimento no Trem
            player.position.copy(train.position);
            player.position.y += 3.5; // Altura da cabine
            
            // Controle de Aceleração (W acelera, S freia)
            if (keys['KeyW'] && steam > 0) {
                throttle = Math.min(1, throttle + delta * 0.5);
            } else {
                throttle = Math.max(0, throttle - delta * 1.0);
            }
        }

        // Atualiza a Câmera para seguir o Jogador
        camera.position.copy(player.position);
        camera.quaternion.setFromEuler(new THREE.Euler(pitch, yaw, 0, 'YXZ'));
    }

    // Física do Trem (Vem do train.js)
    if (typeof updateTrainPhysics === "function") {
        updateTrainPhysics(delta);
    }

    // 7. Atualização da Interface (UI)
    updateGameUI();

    // Renderizar Cena
    renderer.render(scene, camera);
}

// Atualiza os elementos de texto e barras na tela
function updateGameUI() {
    // Velocidade
    const speedEl = document.getElementById('speed');
    if (speedEl) speedEl.innerText = Math.round(trainSpeed * 150);

    // Barra de Vapor
    const steamEl = document.getElementById('steamFill');
    if (steamEl) steamEl.style.width = Math.max(0, steam) + "%";

    // Dinheiro e Inventário (atualizados via player.js ou aqui)
    const moneyEl = document.getElementById('moneyText');
    if (moneyEl) moneyEl.innerText = money;

    // Prompt de Interação
    const promptEl = document.getElementById('prompt');
    if (promptEl && player && train) {
        const distTrain = player.position.distanceTo(train.position);
        
        // Verifica se há itens perto (worldItems vem do world.js)
        const nearItem = (typeof worldItems !== "undefined") ? 
            worldItems.find(i => player.position.distanceTo(i.position) < 5) : null;

        if (nearItem) {
            promptEl.innerText = "[E] COLETAR ITEM";
            promptEl.style.display = "block";
        } else if (distTrain < 8) {
            promptEl.innerText = isRiding ? "[Q] SAIR DO TREM" : "[Q] CONDUZIR / [E] ABASTECER";
            promptEl.style.display = "block";
        } else {
            promptEl.style.display = "none";
        }
    }
}

// Início Real
window.addEventListener('load', init);
