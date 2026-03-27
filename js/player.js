function createPlayer() {
    player = new THREE.Group();
    player.position.set(8, 1.7, 5);
    scene.add(player);
}

function handleInteractions() {
    const nearShop = shops.find(s => player.position.distanceTo(s.position) < 12);
    if(nearShop) {
        inventory.forEach(item => { money += item.value; });
        inventory = inventory.filter(item => item.value === 0);
        updateUI(); return;
    }
    if(player.position.distanceTo(train.position) < 8) {
        const coals = inventory.filter(i => i.steam > 0);
        coals.forEach(c => { steam = Math.min(100, steam + c.steam); });
        inventory = inventory.filter(i => i.steam === 0);
        updateUI(); return;
    }
    const itemIdx = worldItems.findIndex(i => player.position.distanceTo(i.position) < 4);
    if(itemIdx !== -1 && inventory.length < 6) {
        inventory.push(worldItems[itemIdx].userData.type);
        scene.remove(worldItems[itemIdx]);
        worldItems.splice(itemIdx, 1);
        updateUI();
    }
}

function updateUI() {
    document.getElementById('moneyText').innerText = money;
    document.getElementById('invText').innerText = inventory.length;
    const last = inventory[inventory.length-1];
    document.getElementById('itemDesc').innerText = last ? last.name : "Vazio";
}
