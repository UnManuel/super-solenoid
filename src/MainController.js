// by UnManuel.com

import Solenoid from './core/Solenoid.js';
import AssetLibrary from './library/AssetLibrary.js';
import MeshAsset from './library/MeshAsset.js';
import StateGameplay from './domino/StateGameplay.js';

export default class MainController
{
    constructor()
    {
        this.s2 = new Solenoid();
        
        this.assets = null;

        this.debugMaterialR = new this.s2.three.MeshStandardMaterial({
            color: 0xFF4E50,
            transparent: true,
            opacity: 0.5,
        });

        this.debugMaterialG = new this.s2.three.MeshStandardMaterial({
            color: 0x7CFF6B,
            transparent: true,
            opacity: 0.5,
        });

        this.debugMaterialB = new this.s2.three.MeshStandardMaterial({
            color: 0x4DA6FF,
            transparent: true,
            opacity: 0.5,
        });

        this.debugMaterialC = new this.s2.three.MeshStandardMaterial({
            color: 0x56FFE7,
            transparent: true,
            opacity: 0.5,
        });

        this.debugMaterialY = new this.s2.three.MeshStandardMaterial({
            color: 0xFFEA70,
            transparent: true,
            opacity: 0.5,
        });
    }

    async init()
    {
        await this.s2.initPhysics(20);
    }

    loadAssets()
    {
        if(this.assets == null)
        {
            this.assets = new AssetLibrary(this.s2.three);

            const chairMat = new this.s2.three.MeshPhongMaterial({
                color: 0xF7A7C0,
                reflectivity: 1.0
            });

            this.assets.loadFont('', '64px BaseFont');
            this.assets.loadFont('', '64px BaseFontComp');
            this.assets.loadTexture('./assets/checkerboard.png', 'floorTex');
            this.assets.loadMesh('./assets/monobloc.fbx', 'monobloc', this.setup.bind(this), chairMat);
        }
    }

    setup(chair)
    {
        const light = new this.s2.three.DirectionalLight(0xffffff, 0.3);
        light.castShadow = true;
        light.position.set(0, 100, 50);

        this.s2.scene.add(light.target);
        this.s2.scene.add(light);

        chair.root.position.y = -75;

        this.chairTop = chair;
        this.chairBottom = this.chairTop.clone();
        this.chairBottom.root.position.z = 50;

        this.chairTop.root.position.z = -50;

        this.chairTop.root.rotation.y = 0.04;
        this.chairBottom.root.rotation.y = Math.PI - 0.2;

        this.s2.addMesh(this.chairTop);
        this.s2.addMesh(this.chairBottom);

        const floorMat = new this.s2.three.MeshPhongMaterial({
            map: this.assets.floorTex.texture,
            reflectivity: 1.0
        });

        const floorGeom = new this.s2.three.PlaneGeometry(360, 260);
        const floor = new this.s2.three.Mesh(floorGeom, floorMat);
        floor.rotation.x = -Math.PI / 2;
        floor.rotation.z = Math.PI / 8;
        floor.position.y = -40;
        this.s2.scene.add(floor);

        const deskMat = new this.s2.three.MeshPhongMaterial({
            color: 0x7CCACC,
            reflectivity: 1.0
        });

        const deskGeom = new this.s2.three.CylinderGeometry(50, 50, 4, 64);
        
        const desk = new this.s2.three.Mesh(deskGeom, deskMat);
        //desk.castShadow = true;
        //desk.receiveShadow = true;
        desk.draggable = false;
        desk.position.y = -2;
        
        const dominoContainer = this.createPipe();
        dominoContainer.draggable = false;
        dominoContainer.position.x = 32;

        const sensorGeom = new this.s2.three.BoxGeometry(4.1, 2.1, 8.1);
        const playerSensorGeom = new this.s2.three.BoxGeometry(4.1, 20, 8.1);

        this.playerSensor = new this.s2.three.Mesh(playerSensorGeom, this.debugMaterialG);
        this.playerSensor.position.y = 50;

        this.headSensor = new this.s2.three.Mesh(sensorGeom, this.debugMaterialR);
        this.headSensor.position.x = -5;
        this.headSensor.position.y = -0.5;
        this.headSensor.position.z = 30;

        this.tailSensor = new this.s2.three.Mesh(sensorGeom, this.debugMaterialB);
        this.tailSensor.position.x = 5;
        this.tailSensor.position.y = -0.5;
        this.tailSensor.position.z = 30;

        const startSensorGeom = new this.s2.three.CylinderGeometry(16, 16, 16, 16);
        
        this.startSensor = new this.s2.three.Mesh(startSensorGeom, this.debugMaterialY);
        this.startSensor.draggable = false;
        this.startSensor.position.y = 8;

        this.room = new MeshAsset(this.s2.three, this.s2.rapier);
        this.room.addMesh(desk);
        //this.room.addMesh(dominoContainer);
        this.room.addMesh(this.playerSensor);
        this.room.addMesh(this.startSensor);
        this.room.addMesh(this.headSensor);
        this.room.addMesh(this.tailSensor);
        this.s2.addMesh(this.room);

        this.s2.addSolid(desk, false, 0b0100 | 0b0100 << 16, true);
        this.s2.addSolid(dominoContainer, false, 0b0100 | 0b0100 << 16, true);
        this.s2.addSolid(this.playerSensor, true, 0b0010 | 0b0010 << 16);
        this.s2.addSolid(this.startSensor, true, 0b0010 | 0b0010 << 16, true);
        this.s2.addSolid(this.headSensor, true, 0b0010 | 0b0010 << 16, true);
        this.s2.addSolid(this.tailSensor, true, 0b0010 | 0b0010 << 16, true);
        
        this.dominoSet = new MeshAsset(this.s2.three, this.s2.rapier);
        
        this.dominoWidth = 4;
        this.dominoDepth = 1;
        this.dominoHeight = 8;
        this.dominoGeometry = new this.s2.three.BoxGeometry(this.dominoWidth, this.dominoDepth, this.dominoHeight);
        
        this.sideMaterial = new this.s2.three.MeshPhongMaterial({
            color: 0x444444,
            reflectivity: 1.0
        });

        this.dominoes = [];

        for(let top = 0; top <= 6; ++top)
            for(let bottom = top; bottom <= 6; ++bottom)
                this.dominoes.push(this.createDomino(top, bottom));

        this.shuffleDominoes();

        this.s2.addMesh(this.dominoSet);
        this.s2.addSolidChildren(this.dominoSet.root, false, 0b0100 | 0b0100 << 16);

        const r = 7;
        const c = 4;
        const sx = 8;
        const sz = 12;
        const hx = (r - 1) * sx / 2;
        const hz = (c - 1) * sz / 2;

        for(let z = 0, i = 0; z < c; ++z)
            for(let x = 0; x < r; ++x, ++i)
                this.dominoSet.setTranslation(this.dominoes[i], x * sx - hx, 150, z * sz - hz);

        this.messageLabel = document.getElementById("message_label");
        this.replayButton = document.getElementById("replay_button");

        this.stateGameplay = new StateGameplay(this);

        this.s2.setState(this.stateGameplay);
        this.s2.start();
    }

    createDomino(topValue, bottomValue)
    {
        const domMats = [
            this.sideMaterial,
            this.sideMaterial,
            new this.s2.three.MeshBasicMaterial({ color: 0xffffff, map: new this.s2.three.CanvasTexture(this.createDominoTexture(topValue, bottomValue)) }),
            this.sideMaterial,
            this.sideMaterial,
            this.sideMaterial
        ];
        
        const domino = new this.s2.three.Mesh(this.dominoGeometry, domMats);
        domino.castShadow = true;
        domino.receiveShadow = true;
        domino.topValue = topValue;
        domino.bottomValue = bottomValue;

        this.dominoSet.addMesh(domino);
        this.dominoSet.setRotation(domino, 0, 0, Math.PI);

        return domino;
    }

    createDominoTexture(topValue = 6, bottomValue = 6, color = '#ffffff', dotColor = '#000000')
    {
        const dominoTexture = document.createElement('canvas');
        dominoTexture.width = 256;
        dominoTexture.height = 512;

        const ctx = dominoTexture.getContext('2d');
        ctx.fillStyle = color;
        ctx.fillRect(0, 0, dominoTexture.width, dominoTexture.height);

        ctx.fillStyle = dotColor;
        ctx.lineWidth = 8;
        ctx.beginPath();
        ctx.moveTo(16, 256);
        ctx.lineTo(240, 256);
        ctx.stroke();

        this.drawDominoDots(ctx, topValue, 128, 128, dotColor);
        this.drawDominoDots(ctx, bottomValue, 128, 384, dotColor);
    
        return dominoTexture;
    }

    drawDominoDots(ctx, amount = 6, px = 0, py = 0, color = '#000000', radius = 26, distance = 80)
    {
        if(amount == 1 || amount == 3 || amount == 5)
            this.drawDominoDot(ctx, px, py, radius, color);

        if(amount > 1)
        {
            this.drawDominoDot(ctx, px - distance, py - distance, radius, color);
            this.drawDominoDot(ctx, px + distance, py + distance, radius, color);
        }

        if(amount > 3)
        {
            this.drawDominoDot(ctx, px - distance, py + distance, radius, color);
            this.drawDominoDot(ctx, px + distance, py - distance, radius, color);
        }

        if(amount > 5)
        {
            this.drawDominoDot(ctx, px - distance, py, radius, color);
            this.drawDominoDot(ctx, px + distance, py, radius, color);
        }
    }

    drawDominoDot(ctx, px, py, radius, color)
    {
        ctx.beginPath();
        ctx.fillStyle = color;
        ctx.arc(px, py, radius, 0, Math.PI * 2);
        ctx.fill();
    }

    createPipe(radius = 12, width = 1, depth = 8, segments = 32)
    {
        const pipeShape = new this.s2.three.Shape();

        pipeShape.moveTo(radius, 0);
        pipeShape.absarc(0, 0, radius, 0, Math.PI * 2, false);
        
        const pipeHole = new this.s2.three.Path();
        pipeHole.absarc(0, 0, radius - width, 0, Math.PI * 2, false);

        pipeShape.holes.push(pipeHole);

        const pipeSetup = {
            curveSegments: segments,
            steps: 1,
            depth: depth,
            bevelEnabled: false,
            bevelThickness: 1,
            bevelSize: 1,
            bevelOffset: 0,
            bevelSegments: 1
        };

        const pipeGeom = new this.s2.three.ExtrudeGeometry(pipeShape, pipeSetup);

        const pipe = new this.s2.three.Mesh(pipeGeom, this.debugMaterialC);
        pipe.position.y = depth / 2;
        pipe.rotation.x = -Math.PI / 2;

        return pipe;
    }

    shuffleDominoes()
    {
        this.shuffleArray(this.dominoes);
    }

    shuffleArray(array)
    {    
        for(let i = array.length - 1; i > 0; --i)
        {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
        
        return array;
    }

    update()
    {
        this.s2.update();
    }
}
