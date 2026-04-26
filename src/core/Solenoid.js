// by UnManuel.com

import RAPIER from 'https://cdn.skypack.dev/@dimforge/rapier3d-compat';
import * as THREE from 'https://unpkg.com/three@0.124.0/build/three.module.js';

import CamController from './CamController.js';
import MeshAsset from '../library/MeshAsset.js';
import Tweener from './Tweener.js';

export default class Solenoid
{
    constructor(antialiasing = true, shadowsEnabled = true, clearColor = 0x00679c, ambientLightColor = 0xffffff, ambientLightIntensity = 0.8)
    {
        this.isMobile = /Mobi|Android|iPhone|iPad|iPod|BlackBerry|Windows Phone/i.test(navigator.userAgent);
        
        this.three = THREE;
        this.rapier = null;

        this.scene = new THREE.Scene();
        this.world = null;

        this.renderer = new THREE.WebGLRenderer({ antialias: antialiasing });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setClearColor(clearColor);
        this.renderer.shadowMap.enabled = shadowsEnabled;

        this.renderer.domElement.style.position = 'absolute';
        this.renderer.domElement.style.zIndex = 0;
        this.renderer.domElement.style.touchAction = "none"; 
        
        //if(!this.isMobile)
        //    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

        this.currentSize = new THREE.Vector2(window.innerWidth, window.innerHeight);
        this.aspectRatio = 1;

        this.camCon = new CamController(THREE);

        this.ambientLight = new THREE.AmbientLight(ambientLightColor, ambientLightIntensity);
        this.scene.add(this.ambientLight);

        this.tweener = new Tweener();

        this.lastTime = performance.now();
        this.clampedDelta = 1 / 60;
        this.accumulator = 0;

        this.dragEnabled = true;
        this.dragTarget = null;
        this.dragTargetUp = new this.three.Vector3(0, 1, 0);
        this.targetUp = new this.three.Vector3();
        this.dragMask = 0xFFFFFFFF;
        this.dragIgnoreMask = 0b0010;
        this.prevX = -1;
        this.prevY = -1;

        this.onDragStart = null;
        this.onDrag = null;
        this.onDragEnd = null;
        
        this.targetPoint = new this.three.Vector3();
        this.targetQuaternion = new this.three.Quaternion();
        this.touchPivot = new this.three.Vector2();

        this.raycaster = new THREE.Raycaster();
        this.dragPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0));
        this.dragPlane.constant = -10;

        this.meshes = [];
        this.controllers = [];

        this.currentState = null;

        this.playing = false;

        this.cover = document.getElementById("cover");

        this.onCollisionEnter = null;
        this.onCollisionExit = null;
    }

    async initPhysics(gravityScale = 1)
    {
        if(this.rapier == null)
        {
            this.rapier = RAPIER;

            await RAPIER.init();

            if(this.world == null)
            {
                this.world = new RAPIER.World(new RAPIER.Vector3(0, -9.81 * gravityScale, 0));
                
                this.world.integrationParameters.erp = 0.8;
                this.world.integrationParameters.allowed_linear_error = 0.001;
                this.world.integrationParameters.num_solver_iterations = 8;
                this.world.integrationParameters.num_additional_friction_iterations = 4;
                this.world.integrationParameters.max_linear_correction = 100;
                this.world.integrationParameters.max_velocity_iterations = 8;
                this.world.integrationParameters.max_position_iterations = 4;

                this.eventQueue = new RAPIER.EventQueue(true);
            }
        }
    }

    start()
    {
        document.body.appendChild(this.renderer.domElement); 

        this.renderer.domElement.addEventListener('pointerdown', this.dragStart.bind(this));
        this.renderer.domElement.addEventListener('pointermove', this.drag.bind(this));
        this.renderer.domElement.addEventListener('pointerup', this.dragEnd.bind(this));

        window.addEventListener('resize', this.refreshOrientation.bind(this));
        this.refreshOrientation();

        if(this.cover != null)
            this.cover.style.visibility = "hidden";

        this.playing = true;
    }

    setState(nextState = null)
    {
        if(nextState == null || nextState != null && typeof nextState.update === 'function')
        {
            if(this.currentState != null && typeof this.currentState.end === 'function')
                this.currentState.end();

            this.currentState = nextState;

            if(this.currentState != null)
            {
                if(typeof this.currentState.start === 'function')
                    this.currentState.start();
                
                if(typeof this.currentState.refreshOrientation === 'function')
                    this.currentState.refreshOrientation();
            }
        }
    }

    update()
    {
        if(this.playing)
        {
            const now = performance.now();
            
            const deltaTime = (now - this.lastTime) / 1000;
            
            this.lastTime = now;
            this.accumulator += deltaTime;

            while(this.accumulator >= this.clampedDelta)
            {
                this.world.step(this.eventQueue);
                this.accumulator -= this.clampedDelta;
            }

            if(this.onCollisionEnter != null || this.onCollisionExit != null)
                this.eventQueue.drainCollisionEvents((handleA, handleB, started) => {
                    if(started)
                    {
                        if(this.onCollisionEnter != null)
                        {
                            const meshA = this.world.getCollider(handleA).mesh;
                            const meshB = this.world.getCollider(handleB).mesh;

                            this.onCollisionEnter(meshA, meshB);
                        }
                    }
                    else
                        if(this.onCollisionExit != null)
                        {
                            const meshA = this.world.getCollider(handleA).mesh;
                            const meshB = this.world.getCollider(handleB).mesh;

                            this.onCollisionExit(meshA, meshB);
                        }
                });

            this.camCon.update(deltaTime);

            for(let i = 0; i < this.meshes.length; ++i)
            {
                if(!this.meshes[i].alive)
                    this.meshes.splice(i--, 1);
                else
                    this.meshes[i].update(deltaTime);
            }

            this.tweener.update(deltaTime);

            for(let i = 0; i < this.controllers.length; ++i)
            {
                const con = this.controllers[i];
            
                if(!con.alive)
                {
                    if(typeof con.end === 'function')
                        con.end();

                    this.controllers.splice(i--, 1);
                }
                else
                {
                    if(!con.awake)
                    {
                        con.awake = true;

                        if(typeof con.start === 'function')
                            con.start();
                    }

                    con.update(deltaTime);
                }
            }

            if(this.currentState != null)
                this.currentState.update(deltaTime);

            this.renderer.render(this.scene, this.camCon.cam);
        }
    }

    addMesh(mesh)
    {
        if(mesh instanceof MeshAsset)
        {
            mesh.alive = true;
            this.meshes.push(mesh);
            mesh.addToScene(this.scene);
        }
    }

    addSolid(meshNode, isSensor = false, layerMask = 0xFFFFFFFF, fixed = false, density = 1, kinematicType = 0, continuous = false)
    {
        if(this.world != null && meshNode.asset != null)
            meshNode.asset.addCollider(meshNode, this.world, isSensor, layerMask, fixed, density, kinematicType, continuous);
    }

    addSolidChildren(meshNode, isSensor = false, layerMask = 0xFFFFFFFF, fixed = false, density = 1, kinematicType = 0, continuous = false)
    {
        if(this.world != null && meshNode.asset != null)
        {
            meshNode.children.forEach(child => {
                if(child.isMesh)
                    meshNode.asset.addCollider(child, this.world, isSensor, layerMask, fixed, density, kinematicType, continuous);
            });
        }
    }

    removeSolid(meshNode)
    {
        if(meshNode.asset != null)
            meshNode.asset.removeCollider(meshNode);
    }

    setChildSolid(meshNode, parentNode = null)
    {
        if(meshNode.asset != null)
            meshNode.asset.setParentCollider(meshNode, parentNode);
    }

    intersects(solidA, solidB)
    {
        return this.world != null && this.world.narrowPhase.intersectionPair(solidA.collider.handle, solidB.collider.handle) === true;
    }

    addController(controller)
    {
        if(typeof controller.update === 'function')
        {
            controller.alive = true;
            controller.awake = false;
            this.controllers.push(controller);
        }
    }

    clearControllers()
    {
        this.controllers.length = 0;
    }

    clearMeshes()
    {
        this.meshes.length = 0;
    }

    clearWorld()
    {
        const bodies = [];
        this.world.bodies.forEach((body) => bodies.push(body));
        
        for(const body of bodies)
            this.world.removeRigidBody(body);

        const colliders = [];
        this.world.colliders.forEach((collider) => colliders.push(collider));
        
        for(const collider of colliders)
            this.world.removeCollider(collider, true);

        const joints = [];
        this.world.impulseJoints.forEach((joint) => joints.push(joint));
        
        for(const joint of joints)
            this.world.removeImpulseJoint(joint);

        const multibodyJoints = [];
        this.world.multibodyJoints.forEach((joint) => multibodyJoints.push(joint));
        
        for(const joint of multibodyJoints)
            this.world.removeMultibodyJoint(joint);
    }

    clearScene()
    {
        this.scene.clear();
    }

    clearAnimations()
    {
        this.tweener.clear();
    }

    clear()
    {
        this.clearControllers();
        this.clearMeshes();
        this.clearWorld();
        this.clearScene();
        this.clearAnimations();
        this.setState();
    }

    refreshOrientation()
    {
        this.renderer.setSize(window.innerWidth, window.innerHeight);

        this.camCon.cam.aspect = window.innerWidth / window.innerHeight;
        this.camCon.cam.updateProjectionMatrix();

        if(this.currentState != null && typeof this.currentState.refreshOrientation === 'function')
            this.currentState.refreshOrientation();
    }

    dragStart(event)
    {
        if(this.dragEnabled && this.dragTarget == null)
        {
            this.calcTargetPoint(event);

            const ray = new RAPIER.Ray(this.raycaster.ray.origin, this.raycaster.ray.direction);
            const maxToi = 500;
            const solid = true;

            const hit = this.world.castRay(ray, maxToi, solid, null, ~0b0001 & ~this.dragIgnoreMask & this.dragMask);

            if(hit != null && hit.collider != null && hit.collider.mesh != null && hit.collider.mesh.draggable)
            {
                event.preventDefault();
                this.renderer.domElement.setPointerCapture(event.pointerId);
                
                this.dragTarget = hit.collider.mesh;
                this.targetUp.copy(this.dragTarget.up);

                this.prevX = -1;
                this.prevY = -1;

                if(this.onDragStart != null)
                    this.onDragStart(this.dragTarget);

                this.dragTarget.asset.freeze(this.dragTarget);

                this.drag(event);
            }
        }
    }

    drag(event)
    {
        if(this.dragTarget != null)
        {
            this.calcTargetPoint(event);

            if(this.prevX != this.touchPivot.x || this.prevY != this.touchPivot.y)
            {
                this.dragTarget.asset.setTranslation(this.dragTarget, this.targetPoint.x, this.targetPoint.y, this.targetPoint.z);
                
                this.targetPoint.subVectors(this.camCon.cam.position, this.dragTarget.position)
                  .normalize();

                this.targetQuaternion.setFromUnitVectors(this.dragTargetUp, this.targetPoint);

                this.dragTarget.quaternion.copy(this.targetQuaternion);

                this.prevX = this.touchPivot.x;
                this.prevY = this.touchPivot.y;

                if(this.onDrag != null)
                    this.onDrag(this.dragTarget);
            }
        }
    }

    dragEnd(event)
    {
        if(this.dragTarget != null)
        {
            event.preventDefault();
            this.renderer.domElement.releasePointerCapture(event.pointerId);

            this.dragTarget.asset.unfreeze(this.dragTarget);
            this.dragTarget.up.copy(this.targetUp);

            this.prevX = -1;
            this.prevY = -1;

            if(this.onDragEnd != null)
                this.onDragEnd(this.dragTarget);

            this.dragTarget = null;
        }
    }

    calcTargetPoint(event)
    {
        const r = this.renderer.domElement.getBoundingClientRect();

        this.touchPivot.x = ((event.clientX - r.left) / r.width) * 2 - 1;
        this.touchPivot.y = -((event.clientY - r.top) / r.height) * 2 + 1;

        this.raycaster.setFromCamera(this.touchPivot, this.camCon.cam);
        this.raycaster.ray.intersectPlane(this.dragPlane, this.targetPoint);
    }
}
