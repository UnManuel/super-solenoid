// by UnManuel.com

export default class ScoreLabel
{
    constructor(three, element, valueName = "")
    {
        this.three = three;

        this.element = element;
        this.valueName = valueName;

        this.score = 0;
        this.prevScore = 0;

        this.maxAddTime = 0.01;
        this.addTime = this.maxAddTime;
        this.increment = 1;

        this.alive = true;
    }

    setValue(value)
    {
        this.prevScore = this.score = value;
        this.refresh();
    }

    add(amount, preTime = 0)
    {
        this.score += amount;
        this.increment = Math.sqrt(amount);

        this.addTime = preTime > 0 ? -preTime : this.maxAddTime;
    }

    update(deltaTime)
    {
        if(this.prevScore > this.score)
        {   
            this.addTime += deltaTime;

            if(this.addTime > this.maxAddTime)
            {
                this.prevScore = this.score;
                this.refresh();
            }
        }
        else
            if(this.prevScore < this.score)
            {
                this.addTime += deltaTime;

                if(this.addTime > this.maxAddTime)
                {
                    this.addTime -= this.maxAddTime;

                    this.prevScore += this.increment;

                    if(this.prevScore > this.score)
                        this.prevScore = this.score;

                    this.refresh();
                }
            }
    }

    refresh()
    {
        this.element.innerHTML = String(Math.ceil(this.prevScore)).padStart(3, '0') + " " + this.valueName;
    }
}
