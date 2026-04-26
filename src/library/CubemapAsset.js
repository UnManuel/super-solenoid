// by UnManuel.com

export default class CubemapAsset
{
    constructor(three, imageFiles)
    {
        this.three = three;

        this.imageFiles = imageFiles;

        this.map = null;

        this.onSuccess = null;
    }

    load(path, successHandler = null)
    {
        this.onSuccess = successHandler;

        const cubemapLoader = new this.three.CubeTextureLoader();

        this.map = cubemapLoader.setPath(path).load(this.imageFiles, this.cubemapLoaded.bind(this));
    }

    cubemapLoaded()
    {
        if(this.onSuccess != null)
            this.onSuccess(this);
    }
}
