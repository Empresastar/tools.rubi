function createTrain() {
    train = new THREE.Group();
    const body = new THREE.Mesh(new THREE.BoxGeometry(3, 2, 8), new THREE.MeshStandardMaterial({ color: 0x111111 }));
    body.position.y = 1.2;
    train.add(body);
    const chimney = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.4, 1.5), new THREE.MeshStandardMaterial({ color: 0x222222 }));
    chimney.position.set(0, 2.5, -2);
    train.add(chimney);
    scene.add(train);
}

function updateTrainPhysics(delta) {
    if(steam > 0) {
        trainSpeed = THREE.MathUtils.lerp(trainSpeed, throttle * (steam/100) * 2, 0.05);
        steam -= (0.1 + throttle * 4) * delta;
    } else {
        trainSpeed *= 0.98;
        throttle = 0;
    }
    train.position.z -= trainSpeed;
}
