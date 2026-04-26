// by UnManuel.com

import PlayerController from './PlayerController.js';

export default class AIPlayerController extends PlayerController
{
    constructor(state, placementPivot, name = "HAL 9000", index = 1, orientation = true)
    {
        super(state, placementPivot, name, index, orientation);

        this.time = 0;
        this.maxTime = 1;

        this.minThinkTime = 1;
        this.maxThinkTime = 3;
    }

    start()
    {
        this.time = 0;
        this.maxTime = this.minThinkTime + Math.random() * (this.maxThinkTime - this.minThinkTime);
    }

    update(deltaTime)
    {
        if(this.time < this.maxTime)
        {
            this.time += deltaTime;

            if(this.time >= this.maxTime)
                this.tryMove();
        }
    }

    tryMove()
    {
        for(let i = 0; i < this.dominoes.length; ++i)
        {
            if(this.state.evalMove(this.dominoes[i], this.state.main.headSensor) < 2)
            {
                this.state.makeMove(this.dominoes[i]);
                this.dominoes.splice(i, 1);
                return;
            }

            if(this.state.main.tailSensor.physicsEnabled && this.state.evalMove(this.dominoes[i], this.state.main.tailSensor) < 2)
            {
                this.state.makeMove(this.dominoes[i]);
                this.dominoes.splice(i, 1);
                return;
            }
        }

        this.state.relinquishTurn();
    }
}
