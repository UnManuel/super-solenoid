// by UnManuel.com

import Tween from './Tween.js';

export default class Tweener
{
    constructor(timeScale = 1)
    {
        this.timeScale = timeScale;
        
        this.tweenCount = 0;
        this.tweenData = {};
        
        this.startFuncs = [ this.moveStart, this.rotateStart, this.scaleStart, this.interpolateStart ];
        this.tweenFuncs = [ this.move, this.rotate, this.scale, this.interpolate ];
    }

    update(deltaTime)
    {
        const scaledDeltaTime = deltaTime * this.timeScale;

        const ids = Object.keys(this.tweenData);

        for(const id of ids)
        {
            const tween = this.tweenData[id];

            tween.time += scaledDeltaTime;

            if(tween.time >= 0)
            {
                if(tween.time > tween.maxTime)
                    tween.time = tween.maxTime;

                tween.t = tween.easeFunc(tween.time / tween.maxTime);

                if(!tween.tweening)
                {
                    if(tween.type != -1)
                        this.startFuncs[tween.type](tween);

                    tween.tweening = true;

                    if(tween.target != null && tween.target.collider != null)
                        tween.target.asset.freeze(tween.target);
                    
                    if(tween.startFunc != null)
                        tween.startFunc(tween);
                }

                if(tween.type != -1)
                    this.tweenFuncs[tween.type](tween);

                if(tween.updateFunc != null)
                    tween.updateFunc(tween, scaledDeltaTime);

                if(tween.time == tween.maxTime)
                {
                    if(tween.endFunc != null)
                        tween.endFunc(tween);

                    if(tween.target != null && tween.target.collider != null)
                        tween.target.asset.unfreeze(tween.target);

                    delete this.tweenData[id];
                }
            }
        }
    }

    moveStart(tween)
    {
        tween.start = tween.target.position.clone();
    }

    rotateStart(tween)
    {
        tween.start = tween.target.quaternion.clone();
    }

    scaleStart(tween)
    {
        tween.start = tween.target.scale.clone();
    }

    interpolateStart(tween)
    {
        
    }

    move(tween)
    {
        tween.target.position.copy(tween.start).lerp(tween.end, tween.t);
    }

    rotate(tween)
    {
        tween.target.quaternion.copy(tween.start).slerp(tween.end, tween.t);
    }

    scale(tween)
    {
        tween.target.scale.copy(tween.start).lerp(tween.end, tween.t);
    }

    interpolate(tween)
    {
        tween.target.position.copy(Tween.interpolatePoint(tween.points, tween.t));
    }

    moveTo(finalPosition, target, maxTime = 1, easeFunc = Tween.linear, endFunc = null, preTime = 0, startFunc = null, updateFunc = null, id = '')
    {
        id = this.fixTweenId(id);

        const tween = {
            t: 0,
            id: id,
            type: 0,
            target: target,
            start: null,
            end: finalPosition.clone(),
            tweening: false,
            time: -Math.abs(preTime),
            maxTime: maxTime <= 0 ? 1 : maxTime,
            easeFunc: easeFunc,
            startFunc: startFunc,
            updateFunc: updateFunc,
            endFunc: endFunc
        };

        this.tweenData[id] = tween;

        return tween;
    }

    rotateTo(finalRotation, target, maxTime = 1, easeFunc = Tween.linear, endFunc = null, preTime = 0, startFunc = null, updateFunc = null, id = '')
    {
        id = this.fixTweenId(id);

        const tween = {
            t: 0,
            id: id,
            type: 1,
            target: target,
            start: null,
            end: target.quaternion.clone().setFromEuler(finalRotation),
            tweening: false,
            time: -Math.abs(preTime),
            maxTime: maxTime <= 0 ? 1 : maxTime,
            easeFunc: easeFunc,
            startFunc: startFunc,
            updateFunc: updateFunc,
            endFunc: endFunc
        };

        this.tweenData[id] = tween;

        return tween;
    }

    scaleTo(finalScale, target, maxTime = 1, easeFunc = Tween.linear, endFunc = null, preTime = 0, startFunc = null, updateFunc = null, id = '')
    {
        id = this.fixTweenId(id);

        const tween = {
            t: 0,
            id: id,
            type: 2,
            target: target,
            start: null,
            end: finalScale.clone(),
            tweening: false,
            time: -Math.abs(preTime),
            maxTime: maxTime <= 0 ? 1 : maxTime,
            easeFunc: easeFunc,
            startFunc: startFunc,
            updateFunc: updateFunc,
            endFunc: endFunc
        };

        this.tweenData[id] = tween;

        return tween;
    }

    moveThru(points, target, maxTime = 1, easeFunc = Tween.linear, endFunc = null, preTime = 0, startFunc = null, updateFunc = null, id = '')
    {
        id = this.fixTweenId(id);

        const pointsClone = [];

        for(let i = 0; i < points.length; ++i)
            pointsClone.push(points[i].clone());

        const tween = {
            t: 0,
            id: id,
            type: 3,
            target: target,
            points: pointsClone,
            tweening: false,
            time: -Math.abs(preTime),
            maxTime: maxTime <= 0 ? 1 : maxTime,
            easeFunc: easeFunc,
            startFunc: startFunc,
            updateFunc: updateFunc,
            endFunc: endFunc
        };

        this.tweenData[id] = tween;

        return tween;
    }

    wait(maxTime = 1, endFunc = null, preTime = 0, startFunc = null, updateFunc = null, easeFunc = Tween.linear, id = '')
    {
        id = this.fixTweenId(id);

        const tween = {
            t: 0,
            id: id,
            type: -1,
            tweening: false,
            time: -Math.abs(preTime),
            maxTime: maxTime <= 0 ? 1 : maxTime,
            easeFunc: easeFunc,
            startFunc: startFunc,
            updateFunc: updateFunc,
            endFunc: endFunc
        };

        this.tweenData[id] = tween;

        return tween;
    }

    getTween(id)
    {
        return this.tweenData[id];
    }

    clear()
    {
        this.tweenData = {};
    }

    fixTweenId(id)
    {
        if(id == '' || id in this.tweenData)
        {
            id = 'tween_' + this.tweenCount;
            ++this.tweenCount;
        }

        return id;
    }
}
