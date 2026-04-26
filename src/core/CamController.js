// by UnManuel.com

import Tween from './Tween.js';

export default class CamController
{
    constructor(three)
    {
        this.three = three;

        this.cam = new this.three.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 5000);
        
        this.audioListener = new this.three.AudioListener();
        this.cam.add(this.audioListener);

        this.paused = false;
        this.target = null;
        this.smoothRotation = true;

        this.orbitSpeed = 0.02;
        this.orbitDirection = 1;

        this.followStiffness = 50;
        this.rotationStiffness = 50;

        this.followDamping = 50;
        this.rotationDamping = 50;
        
        this.velocity = new this.three.Vector3();
        this.rotationVelocity = new this.three.Vector3();
        this.velocityCopy = new this.three.Vector3();
        
        this.startPoint = new this.three.Vector3();
        this.prevPoint = null;
        
        this.orbit = false;
        this.point = null;
        this.curve = null;

        this.time = 1;
        this.maxTime = 1;
        this.easing = Tween.linear;

        this.onFinish = null;

        this.pivot = new this.three.Vector3(0, 160, 0);
        this.smoothTarget = new this.three.Vector3();

        this.cam.position.copy(this.pivot);
        this.cam.lookAt(this.smoothTarget);
    }

    setPosition(point)
    {
        this.stop();
        this.pivot.copy(point);
        this.cam.position.copy(point);
    }

    setTarget(target = null)
    {
        this.target = target;

        if(this.target != null)
        {
            this.smoothTarget.copy(this.target);
            this.cam.lookAt(this.smoothTarget);
        }
    }

    goto(point)
    {
        this.pivot.copy(point);
    }

    gotoAndOrbit(point, leftTheta = 0, rightTheta = 0)
    {
        if(this.target != null)
        {
            this.pivot.copy(point);

            this.offset = new this.three.Vector3().subVectors(this.pivot, this.target);
            this.radius = Math.sqrt(this.offset.x ** 2 + this.offset.z ** 2);
            this.height = this.offset.y;

            this.angle = Math.atan2(this.offset.z, this.offset.x);
            this.angleStart = this.angle - leftTheta * (Math.PI / 180);
            this.angleEnd = this.angle + rightTheta * (Math.PI / 180);

            this.orbit = true;
            this.point = null;
            this.curve = null;
        }
    }

    moveTo(point, maxTime = 1, easeFunc = Tween.linear, finishHandler = null, preTime = 0)
    {
        this.prevPoint = null;
        this.point = point;
        this.onFinish = finishHandler;

        this.time = -Math.abs(preTime);
        this.maxTime = maxTime <= 0 ? 1 : maxTime;
        this.easing = easeFunc;

        this.orbit = false;
        this.curve = null;
    }

    moveThru(curve, maxTime = 1, easeFunc = Tween.linear, finishHandler = null, preTime = 0)
    {
        this.curve = curve;
        this.onFinish = finishHandler;

        this.time = -Math.abs(preTime);
        this.maxTime = maxTime <= 0 ? 1 : maxTime;
        this.easing = easeFunc;

        this.orbit = false;
        this.point = null;
    }

    stop()
    {
        this.orbit = false;
        this.point = null;
        this.curve = null;

        this.pivot.copy(this.cam.position);
    }

    update(deltaTime)
    {
        if(!this.paused)
        {
            if(this.orbit && this.target != null)
            {
                this.angle += this.orbitDirection * this.orbitSpeed * deltaTime;

                if(this.angle < this.angleStart || this.angle > this.angleEnd)
                {
                    this.orbitDirection *= -1;
                    this.angle = this.clamp(this.angle, this.angleStart, this.angleEnd);
                }

                this.pivot.set(this.target.x + this.radius * Math.cos(this.angle), this.target.y + this.height, this.target.z + this.radius * Math.sin(this.angle));
            }

            if(this.point == null && this.curve == null)
                this.updateCamPosition(deltaTime);

            if(this.point != null)
            {
                this.time += deltaTime;

                if(this.time >= 0)
                {
                    if(this.prevPoint == null)
                    {
                        this.prevPoint = this.startPoint;
                        this.prevPoint.copy(this.cam.position);
                    }

                    if(this.time > this.maxTime)
                        this.time = this.maxTime;

                    this.pivot.copy(this.prevPoint).lerp(this.point, this.easing(this.time / this.maxTime));
                    this.cam.position.copy(this.pivot);

                    if(this.time == this.maxTime)
                    {
                        this.point = null;

                        if(this.onFinish != null)
                            this.onFinish();
                    }
                }
            }

            if(this.curve != null)
            {
                this.time += deltaTime;

                if(this.time >= 0)
                {
                    if(this.time > this.maxTime)
                        this.time = this.maxTime;

                    this.pivot = this.curve.getPointAt(this.easing(this.time / this.maxTime));
                    this.cam.position.copy(this.pivot);

                    if(this.time == this.maxTime)
                    {
                        this.curve = null;

                        if(this.onFinish != null)
                            this.onFinish();
                    }
                }
            }

            if(this.target != null)
            {
                if(this.smoothRotation)
                    this.updateCamRotation(deltaTime);
                else
                {
                    this.smoothTarget.copy(this.target);
                    this.cam.lookAt(this.smoothTarget);
                }
            }
        }
    }

    updateCamPosition(deltaTime)
    {
        const toTarget = new this.three.Vector3().subVectors(this.pivot, this.cam.position);
        const acceleration = toTarget.multiplyScalar(this.followStiffness);

        this.velocityCopy.copy(this.velocity);
        const drag = this.velocityCopy.multiplyScalar(this.followDamping);
        acceleration.sub(drag);

        this.velocity.add(acceleration.multiplyScalar(deltaTime));
        
        this.velocityCopy.copy(this.velocity);
        this.cam.position.add(this.velocityCopy.multiplyScalar(deltaTime));
    }

    updateCamRotation(deltaTime)
    {
        const toTarget = new this.three.Vector3().subVectors(this.target, this.smoothTarget);
        const acceleration = toTarget.multiplyScalar(this.rotationStiffness);

        this.velocityCopy.copy(this.rotationVelocity);
        const drag = this.velocityCopy.multiplyScalar(this.rotationDamping);
        acceleration.sub(drag);

        this.rotationVelocity.add(acceleration.multiplyScalar(deltaTime));
        
        this.velocityCopy.copy(this.rotationVelocity);
        this.smoothTarget.add(this.velocityCopy.multiplyScalar(deltaTime));

        this.cam.lookAt(this.smoothTarget);
    }

    clamp(num, a, b)
    {
        return Math.max(Math.min(num, Math.max(a, b)), Math.min(a, b));
    }
}
