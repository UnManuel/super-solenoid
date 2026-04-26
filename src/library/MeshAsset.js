// by UnManuel.com

import { FBXLoader } from 'https://unpkg.com/three@0.124.0/examples/jsm/loaders/FBXLoader';
import { BufferGeometryUtils } from 'https://unpkg.com/three@0.124.0/examples/jsm/utils/BufferGeometryUtils.js';
import { SkeletonUtils } from 'https://unpkg.com/three@0.124.0/examples/jsm/utils/SkeletonUtils.js';

import Tween from '../core/Tween.js';

export default class MeshAsset
{
    constructor(three, rapier = null, material = null)
    {
        this.three = three;
        this.rapier = rapier;

        this.material = material;

        this.root = null;
        
        this.mesh = null;
        this.meshes = [];

        this.lights = [];
        this.light = null;
        this.lightByName = new Object();

        this.scene = null;
        this.world = null;

        this.pointStart = new this.three.Vector3();
        this.spinStart = new this.three.Quaternion();
        this.scaleStart = new this.three.Vector3();

        this.moveTime = 0;
        this.maxMoveTime = -1;
        this.moveEasing = Tween.linear;
        this.moveHandler = null;

        this.startPoint = null;
        this.finalPoint = new this.three.Vector3();
        this.currentPoint = new this.three.Vector3();

        this.spinTime = 0;
        this.maxSpinTime = -1;
        this.spinEasing = Tween.linear;
        this.spinHandler = null;

        this.startSpin = null;
        this.finalSpin = new this.three.Quaternion();

        this.scaleTime = 0;
        this.maxScaleTime = -1;
        this.scaleEasing = Tween.linear;
        this.scaleHandler = null;

        this.startScale = null;
        this.finalScale = new this.three.Vector3();
        this.currentScale = new this.three.Vector3();

        this.frozen = false;
        
        this.point = new this.three.Vector3();
        this.rotation = new this.three.Euler();
        this.quaternion = new this.three.Quaternion();
        this.worldPosition = new this.three.Vector3();
        this.worldQuaternion = new this.three.Quaternion();

        this.alive = true;

        this.onSuccess = null;
    }

    update(deltaTime)
    {
        let tweening = false;

        if(this.moveTime < this.maxMoveTime)
        {
            this.moveTime += deltaTime;

            if(this.moveTime >= 0)
            {
                if(this.startPoint == null)
                {
                    this.startPoint = this.pointStart;
                    this.startPoint.copy(this.root.position);
                }

                if(this.moveTime > this.maxMoveTime)
                    this.moveTime = this.maxMoveTime;

                this.currentPoint.copy(this.startPoint).lerp(this.finalPoint, this.moveEasing(this.moveTime / this.maxMoveTime));

                this.translate(this.currentPoint.x, this.currentPoint.y, this.currentPoint.z, false);
            
                if(this.moveTime == this.maxMoveTime)
                {
                    this.refreshColliderTranslations();

                    if(this.moveHandler != null)
                        this.moveHandler();
                }

                tweening = true;
            }
        }

        if(this.spinTime < this.maxSpinTime)
        {
            this.spinTime += deltaTime;

            if(this.spinTime >= 0)
            {
                if(this.startSpin == null)
                {
                    this.startSpin = this.spinStart;
                    this.startSpin.copy(this.root.quaternion);
                }

                if(this.spinTime > this.maxSpinTime)
                    this.spinTime = this.maxSpinTime;

                this.quaternion.copy(this.startSpin).slerp(this.finalSpin, this.spinEasing(this.spinTime / this.maxSpinTime));
                this.rotation.setFromQuaternion(this.quaternion);

                this.rotate(this.rotation.x, this.rotation.y, this.rotation.z, false);
                
                if(this.spinTime == this.maxSpinTime)
                {
                    this.refreshColliders();
                    
                    if(this.spinHandler != null)
                        this.spinHandler();
                }

                tweening = true;
            }
        }

        if(this.scaleTime < this.maxScaleTime)
        {
            this.scaleTime += deltaTime;

            if(this.scaleTime >= 0)
            {
                if(this.startScale == null)
                {
                    this.startScale = this.scaleStart;
                    this.startScale.copy(this.root.scale);
                }

                if(this.scaleTime > this.maxScaleTime)
                    this.scaleTime = this.maxScaleTime;

                this.currentScale.copy(this.startScale).lerp(this.finalScale, this.scaleEasing(this.scaleTime / this.maxScaleTime));

                this.scale(this.currentScale.x, this.currentScale.y, this.currentScale.z, false);
                
                if(this.scaleTime == this.maxScaleTime)
                {
                    this.refreshColliderTranslations();

                    if(this.scaleHandler != null)
                        this.scaleHandler();
                }

                tweening = true;
            }
        }

        if(!tweening)
        {
            this.unfreezeAll();

            for(let i = 0; i < this.meshes.length; ++i)
            {
                const mesh = this.meshes[i];

                if(mesh.collider != null && mesh.collider.parent != null)
                    this.refreshChildCollider(mesh);
                else
                    this.refreshMesh(mesh);
            }
        }
    }

    refreshMesh(mesh)
    {
        if(mesh.body != null && mesh.physicsEnabled)
        {
            const t = mesh.body.translation();
            this.point.set(t.x, t.y, t.z);
            
            const p = mesh.parent.worldToLocal(this.point);
            mesh.position.copy(p);

            const r = mesh.body.rotation();
            this.quaternion.set(r.x, r.y, r.z, r.w);

            mesh.parent.getWorldQuaternion(this.worldQuaternion);
                
            const q = this.quaternion.premultiply(this.worldQuaternion.invert());
            mesh.quaternion.copy(q);
        }
    }

    refreshChildCollider(mesh)
    {
        mesh.collider.parent.mesh.getWorldPosition(this.worldPosition);
        this.worldPosition.add(mesh.collider.positionOffset);

        const p = mesh.parent.worldToLocal(this.worldPosition);
        mesh.position.copy(p);

        this.refreshColliderTranslation(mesh);

        mesh.collider.parent.mesh.getWorldQuaternion(this.worldQuaternion);
            
        const q = this.worldQuaternion.multiply(mesh.collider.rotationOffset);
        mesh.quaternion.copy(q);

        this.refreshColliderRotation(mesh);
    }

    refreshCollider(mesh)
    {
        this.refreshColliderTranslation(mesh);
        this.refreshColliderRotation(mesh);
    }

    refreshColliders()
    {
        this.refreshColliderTranslations();
        this.refreshColliderRotations();
    }

    refreshColliderTranslations()
    {
        for(let i = 0; i < this.meshes.length; ++i)
            this.refreshColliderTranslation(this.meshes[i]);
    }

    refreshColliderRotations()
    {
        for(let i = 0; i < this.meshes.length; ++i)
            this.refreshColliderRotation(this.meshes[i]);
    }

    refreshColliderTranslation(mesh)
    {
        mesh.getWorldPosition(this.point);
        mesh.body.resetForces(true);
        mesh.body.setLinvel({ x: 0, y: 0, z: 0 }, true);
        mesh.body.setTranslation({ x: this.point.x, y: this.point.y, z: this.point.z }, true);
    }

    refreshColliderRotation(mesh)
    {
        mesh.getWorldQuaternion(this.quaternion);
        mesh.body.resetTorques(true);
        mesh.body.setAngvel({ x: 0, y: 0, z: 0 }, true);
        mesh.body.setRotation({ x: this.quaternion.x, y: this.quaternion.y, z: this.quaternion.z, w: this.quaternion.w }, true);
    }

    addCircle(mesh, meshNode = null)
    {
        mesh.type = 'circle';
        this.registerMesh(mesh, meshNode);
    }

    addCuboid(mesh, meshNode = null)
    {
        mesh.type = 'cuboid';
        this.registerMesh(mesh, meshNode);
    }

    addSphere(mesh, meshNode = null)
    {
        mesh.type = 'sphere';
        this.registerMesh(mesh, meshNode);
    }

    addMesh(mesh, meshNode = null)
    {
        mesh.type = 'none';

        if(mesh.vertices == null)
            this.addVertices(mesh);

        this.registerMesh(mesh, meshNode);
    }

    registerMesh(mesh, meshNode = null)
    {
        if(this.meshes.push(mesh) == 1)
            this.mesh = mesh;

        const index = this.meshes.length - 1;
        mesh.index = index;
        mesh.asset = this;

        if(meshNode == null)
        {
            if(this.root == null)
            {
                this.root = new this.three.Group();
                this.root.asset = this;
            }

            this.root.add(mesh);
        }
        else
            meshNode.add(mesh);
    }

    addToScene(scene)
    {
        if(this.root != null)
        {
            this.removeFromScene();
            scene.add(this.root);
            this.scene = scene;
        }
    }

    removeFromScene()
    {
        if(this.scene != null)
        {
            this.scene.remove(this.root);
            this.scene = null;
        }
    }

    addCollider(mesh, world, isSensor = false, layerMask = 0xFFFFFFFF, fixed = false, density = 1, kinematicType = 0, continuous = false)
    {
        if(mesh.collider == null)
        {
            if(mesh.shape == null)
            {
                if(mesh.type == 'cuboid')
                    mesh.shape = this.rapier.ColliderDesc.cuboid(mesh.geometry.parameters.width, mesh.geometry.parameters.height, mesh.geometry.parameters.depth);
                else
                    if(mesh.type == 'sphere')
                        mesh.shape = this.rapier.ColliderDesc.ball(mesh.geometry.parameters.radius);
                    else
                        mesh.shape = this.rapier.ColliderDesc.trimesh(mesh.vertices, mesh.indices);
            }

            mesh.shape.setDensity(density);
            mesh.shape.setRestitution(0);
            mesh.shape.setFriction(0.5);

            if(isSensor)
            {
                mesh.shape.setSensor(true);
                mesh.shape.setActiveEvents(this.rapier.ActiveEvents.COLLISION_EVENTS);
            }

            const body = world.createRigidBody(fixed ? this.rapier.RigidBodyDesc.fixed() : kinematicType > 0 ? (kinematicType > 1 ? this.rapier.RigidBodyDesc.kinematicPositionBased() : this.rapier.RigidBodyDesc.kinematicVelocityBased()).setCanSleep(true) : this.rapier.RigidBodyDesc.dynamic().setCcdEnabled(continuous));
            
            mesh.collider = world.createCollider(mesh.shape, body);
            mesh.collider.setCollisionGroups(layerMask);
            mesh.collider.mesh = mesh;
            mesh.collider.parent = null;
            mesh.collider.positionOffset = new this.three.Vector3();
            mesh.collider.rotationOffset = new this.three.Quaternion();

            if(mesh.draggable == null)
                mesh.draggable = true;

            mesh.physicsEnabled = true;
            mesh.frozenDepth = 0;

            mesh.body = body;
            mesh.world = world;
            mesh.layerMask = layerMask;

            this.refreshCollider(mesh);
        }
    }

    removeCollider(mesh)
    {
        if(mesh.collider != null)
        {
            mesh.world.removeCollider(mesh.collider, true);
            mesh.world.removeRigidBody(mesh.body);
            mesh.collider = null;
            mesh.body = null;
            mesh.world = null;
        }
    }

    setParentCollider(mesh, parentMesh = null)
    {
        if(mesh.collider != null)
        {
            if(parentMesh == null)
                mesh.collider.parent = null;
            else
                if(parentMesh.collider != null)
                {
                    mesh.collider.parent = parentMesh.collider;

                    mesh.getWorldPosition(mesh.collider.positionOffset);
                    mesh.getWorldQuaternion(mesh.collider.rotationOffset);
                    
                    parentMesh.getWorldPosition(this.worldPosition);
                    parentMesh.getWorldQuaternion(this.worldQuaternion);
                    
                    mesh.collider.positionOffset.sub(this.worldPosition);
                    mesh.collider.rotationOffset.invert().multiply(this.worldQuaternion);
                }
        }
    }

    enablePhysics(mesh)
    {
        if(mesh.collider != null && !mesh.physicsEnabled)
        {
            mesh.collider.setCollisionGroups(mesh.layerMask);
            mesh.physicsEnabled = true;
            this.refreshCollider(mesh);
        }
    }

    disablePhysics(mesh)
    {
        if(mesh.collider != null && mesh.physicsEnabled)
        {
            mesh.collider.setCollisionGroups(0);
            mesh.physicsEnabled = false;
        }
    }

    freeze(mesh)
    {
        if(mesh.collider != null)
        {
            if(mesh.frozenDepth == 0)
            {
                if(mesh.physicsEnabled)
                {
                    this.disablePhysics(mesh);
                    mesh.frozenDepth = -1;
                }
            }
            else
                --mesh.frozenDepth;    
        }
    }

    unfreeze(mesh)
    {
        if(mesh.collider != null)
        {
            if(mesh.frozenDepth < 0)
                if(++mesh.frozenDepth == 0)
                    this.enablePhysics(mesh);
        }
    }

    freezeAll()
    {
        if(!this.frozen)
        {
            for(let i = 0; i < this.meshes.length; ++i)
                this.freeze(this.meshes[i]);

            this.frozen = true;
        }
    }

    unfreezeAll()
    {
        if(this.frozen)
        {
            for(let i = 0; i < this.meshes.length; ++i)
                this.unfreeze(this.meshes[i]);

            this.frozen = false;
        }
    }

    addVertices(mesh)
    {
        if(mesh.geometry != null)
        {
            let geometry = new this.three.BufferGeometry().fromGeometry(mesh.geometry);
            geometry = BufferGeometryUtils.mergeVertices(geometry);

            const positionAttr = geometry.attributes.position;
            
            mesh.vertices = new Float32Array(positionAttr.count * 3);

            for(let i = 0; i < positionAttr.count; ++i)
            {
                const v = new this.three.Vector3();

                v.fromBufferAttribute(positionAttr, i);
                v.applyMatrix4(mesh.matrixWorld);

                mesh.vertices[i * 3 + 0] = v.x;
                mesh.vertices[i * 3 + 1] = v.y;
                mesh.vertices[i * 3 + 2] = v.z;
            }

            if(geometry.index)
                mesh.indices = geometry.index.array;
            else
            {
                mesh.indices = new Uint32Array(positionAttr.count);

                for(let i = 0; i < positionAttr.count; ++i)
                    mesh.indices[i] = i;
            }
        }
    }

    translate(x = 0, y = 0, z = 0, refreshColliders = true)
    {
        if(this.root != null)
        {
            this.root.position.set(x, y, z);

            if(refreshColliders)
                this.refreshColliderTranslations();
        }
    }

    rotate(rx = 0, ry = 0, rz = 0, refreshColliders = true)
    {
        if(this.root != null)
        {
            this.root.rotation.set(rx, ry, rz);

            if(refreshColliders)
                this.refreshColliders();
        }
    }

    scale(x = 0, y = 0, z = 0, refreshColliders = true)
    {
        if(this.root != null)
        {
            this.root.scale.set(x, y, z);

            if(refreshColliders)
                this.refreshColliderTranslations();
        }
    }

    moveTo(point, maxTime = 1, easeFunc = Tween.linear, handler = null, preTime = 0)
    {
        if(this.root != null)
        {
            this.startPoint = null;
            this.finalPoint.copy(point);

            this.moveTime = -Math.abs(preTime);
            this.maxMoveTime = maxTime <= 0 ? 1 : maxTime;
            this.moveEasing = easeFunc;
            this.moveHandler = handler;

            this.freezeAll();
        }
    }

    rotateTo(euler, maxTime = 1, easeFunc = Tween.linear, handler = null, preTime = 0)
    {
        if(this.root != null)
        {
            this.startSpin = null;
            this.finalSpin.setFromEuler(euler);

            this.spinTime = -Math.abs(preTime);
            this.maxSpinTime = maxTime <= 0 ? 1 : maxTime;
            this.spinEasing = easeFunc;
            this.spinHandler = handler;

            this.freezeAll();
        }
    }

    scaleTo(scale, maxTime = 1, easeFunc = Tween.linear, handler = null, preTime = 0)
    {
        if(this.root != null)
        {
            this.startScale = null;
            this.finalScale.copy(scale);

            this.scaleTime = -Math.abs(preTime);
            this.maxScaleTime = maxTime <= 0 ? 1 : maxTime;
            this.scaleEasing = easeFunc;
            this.scaleHandler = handler;

            this.freezeAll();
        }
    }

    stop()
    {
        this.stopMoving(false);
        this.stopScaling(false);
        this.stopRotating();
        this.unfreezeAll();
    }

    stopMoving(refreshColliders = true)
    {
        if(this.moveTime < this.maxMoveTime)
        {
            this.moveHandler = null;
            this.moveTime = this.maxMoveTime;

            if(refreshColliders)
                this.refreshColliderTranslations();
        }
    }

    stopRotating(refreshColliders = true)
    {
        if(this.spinTime < this.maxSpinTime)
        {
            this.spinHandler = null;
            this.spinTime = this.maxSpinTime;

            if(refreshColliders)
                this.refreshColliders();
        }
    }

    stopScaling(refreshColliders = true)
    {
        if(this.scaleTime < this.maxScaleTime)
        {
            this.scaleHandler = null;
            this.scaleTime = this.maxScaleTime;

            if(refreshColliders)
                this.refreshColliderTranslations();
        }
    }

    setVisible(visible = true)
    {
        if(this.root != null)
            this.root.visible = visible;
    }

    setTranslation(meshNode = null, px = 0, py = 0, pz = 0)
    {
        const mesh = meshNode == null ? this.mesh : meshNode;

        if(mesh != null)
        {
            mesh.position.set(px, py, pz);

            if(mesh.body != null)
            {
                mesh.body.resetForces(true);
                mesh.body.setLinvel({ x: 0, y: 0, z: 0 }, true);
                mesh.body.setTranslation({ x: px, y: py, z: pz }, true);
            }
        }
    }

    setRotation(meshNode = null, rx = 0, ry = 0, rz = 0)
    {
        const mesh = meshNode == null ? this.mesh : meshNode;

        if(mesh != null)
        {
            mesh.rotation.set(rx, ry, rz);

            if(mesh.body != null)
            {
                mesh.body.resetTorques(true);
                mesh.body.setAngvel({ x: 0, y: 0, z: 0 }, true);
                mesh.body.setRotation({ x: mesh.quaternion.x, y: mesh.quaternion.y, z: mesh.quaternion.z, w: mesh.quaternion.w }, true);
            }
        }
    }

    setScale(meshNode = null, sx = 1, sy = 1, sz = 1)
    {
        const mesh = meshNode == null ? this.mesh : meshNode;

        if(mesh != null)
            mesh.geometry.scale(sx, sy, sz);
    }

    setSpeed(meshNode = null, speed = 1, wakeUp = true)
    {
        const mesh = meshNode == null ? this.mesh : meshNode;

        if(mesh != null && mesh.body != null)
            mesh.body.setAngvel(speed, wakeUp);
    }

    center(meshNode = null)
    {
        const mesh = meshNode == null ? this.mesh : meshNode;

        if(mesh != null)
            mesh.geometry.center();
    }

    bakePivot(meshNode = null)
    {
        const mesh = meshNode == null ? this.mesh : meshNode;

        if(mesh != null)
        {
            mesh.geometry.translate(mesh.position.x / mesh.scale.x, mesh.position.y / mesh.scale.y, mesh.position.z / mesh.scale.z);
            mesh.position.set(0, 0, 0);
        }
    }

    bakePivots()
    {
        for(let i = 0; i < this.meshes.length; ++i)
            this.bakePivot(this.meshes[i]);
    }

    setMaterial(material, name = "")
    {
        if(name == "")
            this.material = material;

        for(let i = 0; i < this.meshes.length; ++i)
        {
            if(Array.isArray(this.meshes[i].material))
            {
                for(let j = 0; j < this.meshes[i].material.length; ++j)
                    if(name == "" || name != "" && name == this.meshes[i].material[j].name)
                        this.meshes[i].material[j] = material;
            }
            else
                this.meshes[i].material = material;
        }
    }

    clone()
    {
        const asset = new MeshAsset(this.three, this.material);

        if(this.root != null)
        {
            asset.root = SkeletonUtils.clone(this.root);
            asset.root.animations = [].concat(this.root.animations);

            asset.root.traverse(this.traverseObject.bind(asset));
        }

        // asset.mesh
        // asset.meshes
        // mesh by name

        // asset.light
        // asset.lights
        // asset.lightByName

        return asset;
    }

    load(path, successHandler = null)
    {
        this.loadFromFBX(path, successHandler);
    }

    loadFromFBX(path, successHandler = null)
    {
        this.onSuccess = successHandler;

        const loader = new FBXLoader();

        loader.load(path, this.FBXLoaded.bind(this));
    }

    FBXLoaded(fbx)
    {
        this.removeFromScene();

        // this.dispose();

        this.root = fbx;
        
        this.root.traverse(this.traverseObject.bind(this));

        if(this.onSuccess != null)
            this.onSuccess(this);
    }

    traverseObject(obj)
    {
        if(obj.isMesh || obj.isSkinnedMesh)
        {
            if(obj.material)
            {
                if(this.material != null)
                    obj.material = this.material;
                else
                    if(Array.isArray(obj.material))
                        obj.material = [].concat(obj.material);
            }

            obj.castShadow = true;
            obj.receiveShadow = true;

            if(this.meshes.length == 0)
                this.mesh = obj;

            this.meshes.push(obj);
            this[obj.name] = obj;
            
            const index = this.meshes.length - 1;
            obj.index = index;
            obj.asset = this;
        }
        else
            if(obj.isLight)
            {
                obj.castShadow = true;

                if(this.lights.length == 0)
                    this.light = obj;

                this.lights.push(obj);
                this.lightByName[obj.name] = obj;
            }
    }
}
