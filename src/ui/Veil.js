// by UnManuel.com

export default class Veil
{
    constructor(target)
    {
        this.target = target;

        this.fade = false;

        this.fadeTime = 0;
        this.maxFadeTime = 0;

        this.preTime = 0;
        this.maxPreTime = 0;

        this.alive = true;

        this.onFadeStart = null;
        this.onFadeEnd = null;
    }

    fadeIn(maxTime = 1, endHandler = null, maxPreTime = 0, startHandler = null)
    {
        this.fade = false;

        this.fadeTime = 0;
        this.maxFadeTime = maxTime;

        this.onFadeStart = startHandler;
        this.onFadeEnd = endHandler;

        this.preTime = 0;
        this.maxPreTime = maxPreTime;

        this.refreshAlpha(0);
    }

    fadeOut(maxTime = 1, endHandler = null, maxPreTime = 0, startHandler = null)
    {
        this.fade = true;

        this.fadeTime = 0;
        this.maxFadeTime = maxTime;

        this.onFadeStart = startHandler;
        this.onFadeEnd = endHandler;

        this.preTime = 0;
        this.maxPreTime = maxPreTime;

        this.refreshAlpha(0);
    }

    update(deltaTime)
    {
        if(this.fadeTime < this.maxFadeTime)
        {
            if(this.preTime < this.maxPreTime)
            {
                this.preTime += deltaTime;

                if(this.preTime >= this.maxPreTime && this.onFadeStart != null)
                    this.onFadeStart();
            }
            else
            {
                this.fadeTime += deltaTime;

                if(this.fadeTime > this.maxFadeTime)
                    this.fadeTime = this.maxFadeTime;

                this.refreshAlpha(this.fadeTime / this.maxFadeTime);

                if(this.fadeTime == this.maxFadeTime && this.onFadeEnd != null)
                    this.onFadeEnd();
            }
        }
    }

    refreshAlpha(alpha = 1)
    {
        this.target.style.opacity = this.fade ? 1 - alpha : alpha;
    }
}
