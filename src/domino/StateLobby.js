// by UnManuel.com

export default class StateLobby
{
    constructor(main)
    {
        this.main = main;

        this.camPoint = new this.main.s2.three.Vector3(0, 150, 0);
    }

    update(deltaTime)
    {
        
    }

    refreshOrientation()
    {
        const h = this.main.s2.camCon.cam.aspect > this.main.s2.aspectRatio;

        this.camPoint.y = h ? 100 : 150;
        
        this.main.s2.camCon.setPosition(this.camPoint);
    }
}
