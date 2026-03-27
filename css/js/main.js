// VARIÁVEIS GLOBAIS
let scene, camera, renderer, clock;
let player, train;
let throttle = 0, trainSpeed = 0, steam = 50, money = 0;
let isRiding = false, inventory = [];
let yaw = 0, pitch = 0, keys = {};

function init() {
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x87CEEB);
    scene.fog = new THREE.Fog(0x87CEEB, 20, 400);

    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    clock = new THREE.Clock();

    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement);

    scene.add(new THREE.AmbientLight(0xffffff, 0.6));
    const sun = new THREE.DirectionalLight(0xffffff, 1);
    sun.position.set(50, 100, 50);
    scene.add(sun);

    // Inicia funções dos outros arquivos
    setupWorld();
    createTrain();
    createPlayer();

    document.addEventListener('mousedown', () => renderer.domElement.requestPointerLock());
    document.addEventListener('mousemove', (e) => {
        if(document.pointerLockElement) {
            yaw -= e.movementX * 0.002;
            pitch -= e.movementY * 0.002;
            pitch = Math.max(-1.5, Math.min(1.5, pitch));
        }
    });

    window.addEventListener('keydown', e => { 
        keys[e.code] = true;
        if(e.code === 'KeyE') handleInteractions();
        if(e.code === 'KeyQ' && player.position.distanceTo(train.position) < 8) isRiding = !isRiding;
    });
    window.addEventListener('keyup', e => keys[e.code] = false);

    animate();
}

function animate() {
    requestAnimationFrame(animate);
    const delta = clock.getDelta();

    if(!isRiding) {
        const speed = 12 * delta;
        if(keys['KeyW']) { player.position.x -= Math.sin(yaw) * speed; player.position.z -= Math.cos(yaw) * speed; }
        if(keys['KeyS']) { player.position.x += Math.sin(yaw) * speed; player.position.z += Math.cos(yaw) * speed; }
    } else {
        player.position.copy(train.position);
        player.position.y = 3.5;
        if(keys['KeyW'] && steam > 0) throttle = Math.min(1, throttle + delta);
        else throttle = Math.max(0, throttle - delta * 1.5);
    }

    updateTrainPhysics(delta);

    // Interface
    const prompt = document.getElementById('prompt');
    const nearItem = worldItems.find(i => player.position.distanceTo(i.position) < 4);
    if(nearItem) {
        prompt.innerText = "[E] PEGAR " + nearItem.userData.type.name.toUpperCase();
        prompt.style.display = "block";
    } else if(player.position.distanceTo(train.position) < 8) {
        prompt.innerText = isRiding ? "[Q] SAIR" : "[Q] CONDUZIR / [E] ABASTECER";
        prompt.style.display = "block";
    } else { prompt.style.display = "none"; }

    if(document.getElementById('speed')) document.getElementById('speed').innerText = Math.round(trainSpeed * 120);
    if(document.getElementById('steamFill')) document.getElementById('steamFill').style.width = steam + "%";

    camera.position.copy(player.position);
    camera.quaternion.setFromEuler(new THREE.Euler(pitch, yaw, 0, 'YXZ'));
    renderer.render(scene, camera);
}

window.onload = init;
