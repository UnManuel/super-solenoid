// by UnManuel.com

export default class PlayerController
{
    constructor(state, placementPivot, avatarBox, name = "David Bowman", index = 0, orientation = true)
    {
        this.state = state;

        this.playerName = name;
        this.playerIndex = index;
        this.score = 0;

        this.placementPivot = placementPivot;
        this.orientation = orientation;

        this.avatarBox = avatarBox;
        this.selector = avatarBox.querySelector("#selector");
        this.nameLabel = avatarBox.querySelector("#label");
        this.nameLabel.innerHTML = name;

        this.dominoes = [];
        this.rowSize = 7;
        this.handSize = 7;

        this.dominoOffsetH = 8;
        this.dominoOffsetV = 10;
    }

    start()
    {
        if(this.canMove())
            this.setDominoesEnabled();
        else
            this.state.main.s2.tweener.wait(1, this.state.relinquishTurn.bind(this.state));
    }

    end()
    {
        this.setDominoesEnabled(false);
    }

    update(deltaTime)
    {
        
    }

    pickDominoes(dominoes)
    {
        for(let i = 0; i < this.handSize; ++i)
        {
            const domino = dominoes.pop();

            domino.handIndex = i;
            domino.draggable = this.playerIndex == 0;

            delete domino.side;
            delete domino.moveType;

            domino.visible = true;
            domino.asset.enablePhysics(domino);

            this.dominoes.push(domino);
            
            this.returnDomino(domino);
        }
    }

    returnDomino(domino)
    {
        if(this.orientation)
        {
            domino.asset.setTranslation(domino, this.placementPivot.x + (domino.handIndex % this.rowSize) * this.dominoOffsetH, this.placementPivot.y, this.placementPivot.z + Math.floor(domino.handIndex / this.rowSize) * this.dominoOffsetV * (this.placementPivot.z < 0 ? -1 : 1));
            domino.asset.setRotation(domino, 0, 0, this.playerIndex == 0 ? 0 : Math.PI);
        }
        else
        {
            domino.asset.setTranslation(domino, this.placementPivot.x + Math.floor(domino.handIndex / this.rowSize) * this.dominoOffsetV * (this.placementPivot.x < 0 ? -1 : 1), this.placementPivot.y, this.placementPivot.z + (domino.handIndex % this.rowSize) * this.dominoOffsetH);
            domino.asset.setRotation(domino, 0, Math.PI / 2, this.playerIndex == 0 ? 0 : Math.PI);
        }
    }

    removeDomino(domino)
    {
        for(let i = 0; i < this.dominoes.length; ++i)
            if(this.dominoes[i] == domino)
            {
                this.dominoes.splice(i, 1);
                domino.draggable = false;
                return;
            }
    }

    setDominoesEnabled(enabled = true)
    {
        for(let i = 0; i < this.dominoes.length; ++i)
            this.dominoes[i].draggable = enabled;
    }

    canMove()
    {
        if(this.state.dominoSnake.length == 0)
            return true;

        for(let i = 0; i < this.dominoes.length; ++i)
        {
            if(this.state.evalMove(this.dominoes[i], this.state.main.headSensor) < 2)
                return true;

            if(this.state.main.tailSensor.physicsEnabled && this.state.evalMove(this.dominoes[i], this.state.main.tailSensor) < 2)
                return true;
        }

        return false;
    }

    retrieveDominoes()
    {
        const dominoes = [];

        dominoes.push(...this.dominoes);
        this.dominoes.length = 0;

        return dominoes;
    }

    dominoRest()
    {
        return this.dominoes.length;
    }
}
