// by UnManuel.com

import Tween from '../core/Tween.js';
import PlayerController from './PlayerController.js';
import AIPlayerController from './AIPlayerController.js';

export default class StateGameplay
{
    constructor(main)
    {
        this.main = main;

        this.camPoint = new this.main.s2.three.Vector3(0, 200, 0);

        this.bottomPivot = new this.main.s2.three.Vector3(-25, 0.5, 25);
        this.topPivot = new this.main.s2.three.Vector3(-25, 0.5, -25);
        this.leftPivot = new this.main.s2.three.Vector3(-25, 0.5, -25);
        this.rightPivot = new this.main.s2.three.Vector3(25, 0.5, -25);

        this.minEdge = new this.main.s2.three.Vector2();
        this.maxEdge = new this.main.s2.three.Vector2();

        this.headSpin = 0;
        this.tailSpin = 0;

        this.headDirection = new this.main.s2.three.Vector3(-1, 0, 0);
        this.tailDirection = new this.main.s2.three.Vector3(1, 0, 0);
        this.direction = new this.main.s2.three.Vector3();
        this.dominoRotation = new this.main.s2.three.Euler();

        this.movePoints = [];
        this.movePoints.push(new this.main.s2.three.Vector3());
        this.movePoints.push(new this.main.s2.three.Vector3());
        this.movePoints.push(new this.main.s2.three.Vector3());

        this.currentDomino = null;
        this.selectedDomino = null;
        this.targetSensor = null;

        this.currentPlayerIndex = -1;
        this.players = [];
    
        this.gameMode = "local";
        this.playerCount = 2;

        this.dominoAmount = 28;
        this.dominoSnake = [];
        this.dominoRest = [];
    }

    start()
    {
        if(this.gameMode == "local" && this.playerCount == 2)
        {
            this.players.length = this.playerCount;

            this.players[0] = new PlayerController(this, this.bottomPivot, document.getElementById("avatar_box_0"), "Asuka");
            this.players[1] = new AIPlayerController(this, this.topPivot, document.getElementById("avatar_box_1"), "MAGI", 1);
        }

        this.main.s2.onDragStart = this.dragStart.bind(this);
        this.main.s2.onDragEnd = this.dragEnd.bind(this);

        this.main.s2.onCollisionEnter = this.sensorEnter.bind(this);
        this.main.s2.onCollisionExit = this.sensorExit.bind(this);

        this.main.replayButton.addEventListener('click', this.replay.bind(this));
    
        this.restart();
    }

    restart()
    {
        this.main.shuffleDominoes();

        for(let i = 0; i < this.playerCount; ++i)
            this.players[i].pickDominoes(this.main.dominoes);

        this.storeRemainingDominoes();

        this.setSensorEnabled(this.main.playerSensor, false);
        this.setSensorEnabled(this.main.startSensor);
        this.setSensorEnabled(this.main.headSensor, false);
        this.setSensorEnabled(this.main.tailSensor, false);

        this.headDirection.x = -1;
        this.headDirection.z = 0;

        this.tailDirection.x = 1;
        this.tailDirection.z = 0;

        this.headSpin = 0;
        this.tailSpin = 0;

        this.minEdge.x = -40;
        this.minEdge.y = -14;

        this.maxEdge.x = 40;
        this.maxEdge.y = 14;

        if(this.currentPlayerIndex != -1)
            this.players[this.currentPlayerIndex].selector.className = "";

        this.currentPlayerIndex = 0;
        
        this.players[this.currentPlayerIndex].selector.className = "selector";

        this.main.s2.addController(this.players[this.currentPlayerIndex]);
    }

    update(deltaTime)
    {

    }

    replay()
    {
        this.main.messageLabel.innerHTML = "";
        this.main.replayButton.style.visibility = "hidden";

        this.main.dominoes.push(...this.dominoSnake);
        this.dominoSnake.length = 0;

        for(let i = 0; i < this.playerCount; ++i)
            this.main.dominoes.push(...this.players[i].retrieveDominoes());
    
        this.main.dominoes.push(...this.dominoRest);
        this.dominoRest.length = 0;

        this.restart();
        this.setAvatarBoxesVisible();
    }

    storeRemainingDominoes()
    {
        let y = 0;
    
        while(this.main.dominoes.length > 0)
        {
            const domino = this.main.dominoes.pop();

            domino.visible = false;
            domino.asset.disablePhysics(domino);

            //domino.asset.setTranslation(domino, 32, y, 0);
            //domino.asset.setRotation(domino, 0, 0, Math.PI);

            y += 2;

            this.dominoRest.push(domino);
        }
    }

    firstMove(domino)
    {
        this.setSensorEnabled(this.main.startSensor, false);

        domino.moveType = domino.topValue == domino.bottomValue ? 0 : -1;
        
        this.direction.x = 0;
        this.direction.y = this.main.dominoDepth / 2;
        this.direction.z = 0;

        this.dominoRotation.x = 0;
        this.dominoRotation.y = domino.topValue == domino.bottomValue ? 0 : Math.PI / 2;
        this.dominoRotation.z = 0;

        const moveTime = 0.4;
        const tweenType = Tween.easeInCubic;

        domino.asset.disablePhysics(domino);

        this.main.s2.tweener.rotateTo(this.dominoRotation, domino, moveTime, tweenType);
        this.main.s2.tweener.moveTo(this.direction, domino, moveTime, tweenType, this.firstMoveEnd.bind(this));
    }

    firstMoveEnd(tween)
    {
        const domino = tween.target;

        this.dominoSnake.push(domino);

        this.placeSensor();

        this.nextTurn();
    }

    placeSensor(side = false)
    {
        const sensor = side ? this.main.tailSensor : this.main.headSensor;
        const domino = this.dominoSnake[side ? this.dominoSnake.length - 1 : 0];
        
        this.setSensorEnabled(sensor);

        sensor.asset.setTranslation(sensor, domino.position.x, domino.position.y, domino.position.z);
        sensor.asset.setRotation(sensor, domino.rotation.x, domino.rotation.y, domino.rotation.z);
        
        this.main.s2.setChildSolid(sensor, domino);
    }

    evalMove(domino, endpoint)
    {
        if(endpoint == this.main.headSensor)
        {
            const targetDomino = endpoint.collider.parent.mesh;

            domino.side = false;
            const leftMove = this.evalSide(domino, targetDomino);
            
            if(leftMove == 2 && this.dominoSnake.length == 1)
            {
                domino.side = true;
                return this.evalSide(domino, targetDomino);
            }
            else
                return leftMove;
        }

        if(endpoint == this.main.tailSensor)
        {
            domino.side = true;
            return this.evalSide(domino, endpoint.collider.parent.mesh);
        }
        
        return 2;
    }

    evalSide(domino, targetDomino)
    {
        const targetValue = (domino.side ? 1 : -1) * targetDomino.moveType > 0 ? targetDomino.topValue : targetDomino.bottomValue;
        
        domino.moveType = 2;

        if(domino.bottomValue == targetValue)
            domino.moveType = domino.topValue == domino.bottomValue ? 0 : (domino.side ? 1 : -1);
        else
            if(domino.topValue == targetValue)
                domino.moveType = domino.topValue == domino.bottomValue ? 0 : (domino.side ? -1 : 1);
    
        return domino.moveType;
    }

    makeMove(domino)
    {
        const endpoint = domino.side && this.dominoSnake.length > 1 ? this.main.tailSensor : this.main.headSensor;
        
        const dominoDistance = (domino.moveType == 0 ? this.main.dominoWidth : this.main.dominoHeight) / 2;
        const targetDomino = endpoint.collider.parent.mesh;
        const targetDominoDistance = (targetDomino.moveType == 0 ? this.main.dominoWidth : this.main.dominoHeight) / 2;
        
        const distance = dominoDistance + targetDominoDistance;
        this.direction.copy(domino.side ? this.tailDirection : this.headDirection);
        this.direction.multiplyScalar(distance).add(targetDomino.position);
        this.direction.y = this.main.dominoDepth / 2;

        this.adjustDirection(domino);

        this.dominoRotation.x = 0;
        this.dominoRotation.y = (domino.side ? this.tailSpin : this.headSpin) + Math.PI * (targetDomino.moveType == 0 ? 1 : targetDomino.moveType) - Math.PI / 2 * domino.moveType + Math.PI * (domino.side ? 1 : -1);
        this.dominoRotation.z = 0;

        domino.asset.disablePhysics(domino);

        if(this.currentPlayerIndex == 0)
        {
            this.main.s2.tweener.rotateTo(this.dominoRotation, domino, 0.4, Tween.easeInCubic);
            this.main.s2.tweener.moveTo(this.direction, domino, 0.4, Tween.easeInCubic, this.moveEnd.bind(this));
        }
        else
        {
            this.movePoints[0].copy(domino.position);

            this.movePoints[1].set(0, 0, 0).addVectors(domino.position, this.direction).multiplyScalar(0.5);
            this.movePoints[1].y += 50;

            this.movePoints[2].copy(this.direction);

            this.main.s2.tweener.rotateTo(this.dominoRotation, domino, 1, Tween.easeInQuad);
            this.main.s2.tweener.moveThru(this.movePoints, domino, 1, Tween.easeInQuad, this.moveEnd.bind(this));
        }
    }

    adjustDirection(domino)
    {
        if(this.direction.x > this.maxEdge.x)
        {
            const prevDomino = domino.side ? this.main.tailSensor.collider.parent.mesh : this.main.headSensor.collider.parent.mesh;

            this.direction.x = prevDomino.position.x;
            this.direction.z = prevDomino.position.z;

            if(prevDomino.topValue == prevDomino.bottomValue)
                this.direction.z += this.main.dominoHeight;
            else
            {
                this.direction.x += this.main.dominoWidth / 2;
                this.direction.z += this.main.dominoWidth;

                if(domino.topValue != domino.bottomValue)
                    this.direction.z += this.main.dominoWidth / 2;
            }

            if(domino.side)
            {
                this.tailDirection.x = 0;
                this.tailDirection.z = 1;
                this.tailSpin -= Math.PI / 2;
            }
            else
            {
                this.headDirection.x = 0;
                this.headDirection.z = 1;
                this.headSpin -= Math.PI / 2;
            }

            this.maxEdge.x = this.direction.x + this.main.dominoWidth;
        }
        
        if(this.direction.z > this.maxEdge.y)
        {
            const prevDomino = domino.side ? this.main.tailSensor.collider.parent.mesh : this.main.headSensor.collider.parent.mesh;

            this.direction.x = prevDomino.position.x;
            this.direction.z = prevDomino.position.z;

            if(prevDomino.topValue == prevDomino.bottomValue)
                this.direction.x -= this.main.dominoHeight;
            else
            {
                this.direction.z += this.main.dominoWidth / 2;
                this.direction.x -= this.main.dominoWidth;

                if(domino.topValue != domino.bottomValue)
                    this.direction.x -= this.main.dominoWidth / 2;
            }

            if(domino.side)
            {
                this.tailDirection.x = -1;
                this.tailDirection.z = 0;
                this.tailSpin -= Math.PI / 2;
            }
            else
            {
                this.headDirection.x = -1;
                this.headDirection.z = 0;
                this.headSpin -= Math.PI / 2;
            }

            this.maxEdge.y = this.direction.z + this.main.dominoWidth;
        }
        
        if(this.direction.x < this.minEdge.x)
        {
            const prevDomino = domino.side ? this.main.tailSensor.collider.parent.mesh : this.main.headSensor.collider.parent.mesh;

            this.direction.x = prevDomino.position.x;
            this.direction.z = prevDomino.position.z;

            if(prevDomino.topValue == prevDomino.bottomValue)
                this.direction.z -= this.main.dominoHeight;
            else
            {
                this.direction.x -= this.main.dominoWidth / 2;
                this.direction.z -= this.main.dominoWidth;

                if(domino.topValue != domino.bottomValue)
                    this.direction.z -= this.main.dominoWidth / 2;
            }

            if(domino.side)
            {
                this.tailDirection.x = 0;
                this.tailDirection.z = -1;
                this.tailSpin -= Math.PI / 2;
            }
            else
            {
                this.headDirection.x = 0;
                this.headDirection.z = -1;
                this.headSpin -= Math.PI / 2;
            }

            this.minEdge.x = this.direction.x - this.main.dominoWidth;
        }
            
        if(this.direction.z < this.minEdge.y)
        {
            const prevDomino = domino.side ? this.main.tailSensor.collider.parent.mesh : this.main.headSensor.collider.parent.mesh;

            this.direction.x = prevDomino.position.x;
            this.direction.z = prevDomino.position.z;

            if(prevDomino.topValue == prevDomino.bottomValue)
                this.direction.x += this.main.dominoHeight;
            else
            {
                this.direction.z -= this.main.dominoWidth / 2;
                this.direction.x += this.main.dominoWidth;

                if(domino.topValue != domino.bottomValue)
                    this.direction.x += this.main.dominoWidth / 2;
            }

            if(domino.side)
            {
                this.tailDirection.x = 1;
                this.tailDirection.z = 0;
                this.tailSpin -= Math.PI / 2;
            }
            else
            {
                this.headDirection.x = 1;
                this.headDirection.z = 0;
                this.headSpin -= Math.PI / 2;
            }

            this.minEdge.y = this.direction.z - this.main.dominoWidth;
        }
    }

    moveEnd(tween)
    {
        const domino = tween.target;

        if(domino.side)
        {
            this.dominoSnake.push(domino);
            this.placeSensor(true);

            if(this.dominoSnake.length == 2)
                this.placeSensor();
        }
        else
        {
            this.dominoSnake.unshift(domino);
            this.placeSensor();

            if(this.dominoSnake.length == 2)
                this.placeSensor(true);
        }

        this.nextTurn();
    }

    nextTurn()
    {
        this.players[this.currentPlayerIndex].alive = false;

        if(this.players[this.currentPlayerIndex].dominoRest() == 0)
            this.main.s2.tweener.wait(1, this.announceWinner.bind(this));
        else
        {
            const nextPlayerIndex = this.getNextPlayerIndex();

            if(nextPlayerIndex == -1)
                this.main.s2.tweener.wait(1, this.stallGame.bind(this));
            else
            {
                this.players[this.currentPlayerIndex].selector.className = "";

                if(++this.currentPlayerIndex == this.playerCount)
                    this.currentPlayerIndex = 0;

                this.players[this.currentPlayerIndex].selector.className = "selector";

                this.main.s2.addController(this.players[this.currentPlayerIndex]);
            }
        }
    }

    relinquishTurn()
    {
        this.main.messageLabel.innerHTML = this.players[this.currentPlayerIndex].playerName + "<br>Pasa";
        this.main.messageLabel.style.color = "#FFF6C2";

        this.main.s2.tweener.wait(2, this.pass.bind(this));
    }

    pass()
    {
        this.main.messageLabel.innerHTML = "";
        this.nextTurn();
    }

    announceWinner()
    {
        if(this.currentPlayerIndex == 0)
        {
            this.main.messageLabel.innerHTML = "¡GANASTE!";
            this.main.messageLabel.style.color = "#EBCB63";
        }
        else
        {
            this.main.messageLabel.innerHTML = this.players[this.currentPlayerIndex].playerName + "<br>Gana";
            this.main.messageLabel.style.color = "#FF7EB5";
        }

        this.main.replayButton.style.visibility = "visible";
        this.setAvatarBoxesVisible(false);
    }

    getNextPlayerIndex()
    {
        let i = this.currentPlayerIndex;

        do
        {
            if(++i == this.playerCount)
                i = 0;

            if(this.players[i].canMove())
                return i;
        
        } while(this.currentPlayerIndex != i);

        return -1;
    }

    stallGame()
    {
        this.main.messageLabel.innerHTML = "¡PARTIDA<br>TRANCADA!";
        this.main.messageLabel.style.color = "#FF7EB5";

        this.main.replayButton.style.visibility = "visible";
        this.setAvatarBoxesVisible(false);
    }

    setSensorEnabled(sensor, value = true)
    {
        //sensor.visible = value;
        sensor.visible = false;

        if(value)
            sensor.asset.enablePhysics(sensor);
        else
            sensor.asset.disablePhysics(sensor);
    }

    setAvatarBoxesVisible(visible = true)
    {
        for(let i = 0; i < this.players.length; ++i)
            this.players[i].avatarBox.style.visibility = visible ? "visible" : "hidden";
    }

    dragStart(target)
    {
        this.players[0].setDominoesEnabled(false);

        this.setSensorEnabled(this.main.playerSensor);
        this.main.playerSensor.asset.setRotation(this.main.playerSensor, target.rotation.x, target.rotation.y, target.rotation.z);
        this.main.playerSensor.asset.setTranslation(this.main.playerSensor, target.position.x, target.position.y, target.position.z);
        this.main.s2.setChildSolid(this.main.playerSensor, target);

        this.currentDomino = target;
    }

    dragEnd(target)
    {
        this.main.s2.setChildSolid(this.main.playerSensor);
        this.setSensorEnabled(this.main.playerSensor, false);

        if(this.selectedDomino != null)
        {
            this.players[0].removeDomino(this.selectedDomino);
            
            if(this.dominoSnake.length == 0)
                this.firstMove(this.selectedDomino);
            else
                this.makeMove(this.selectedDomino);

            this.selectedDomino = null;
        }
        else
        {
            this.players[0].setDominoesEnabled();
            this.players[0].returnDomino(this.currentDomino);
        }

        this.currentDomino = null;
    }

    sensorEnter(sensorA, sensorB)
    {
        if(sensorA == this.main.playerSensor)
        {
            if(this.selectedDomino == null)
            {
                if(sensorB == this.main.startSensor)
                    this.selectedDomino = this.currentDomino;
                else
                    if(sensorB == this.main.headSensor || sensorB == this.main.tailSensor)
                    {
                        if(this.evalMove(this.currentDomino, sensorB) < 2)
                        {
                            this.selectedDomino = this.currentDomino;
                            this.targetSensor = sensorB;
                        }
                    }
            }
        }
    }

    sensorExit(sensorA, sensorB)
    {
        if(sensorA == this.main.playerSensor && this.selectedDomino != null)
        {
            if(sensorB == this.main.startSensor)
                this.selectedDomino = null;
            else
                if((sensorB == this.main.headSensor || sensorB == this.main.tailSensor) && sensorB == this.targetSensor)
                {
                    this.selectedDomino = null;
                    this.targetSensor = null;
                }
        }
    }

    refreshOrientation()
    {
        const h = this.main.s2.camCon.cam.aspect > this.main.s2.aspectRatio;

        this.camPoint.y = h ? 100 : 200;
        
        this.main.s2.camCon.setPosition(this.camPoint);
    }
}
