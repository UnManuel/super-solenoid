// by UnManuel.com

export default class TextureAsset
{
    constructor(three)
    {
        this.three = three;

        this.texture = null;

        this.onSuccess = null;
    }

    load(path, successHandler = null)
    {
        this.onSuccess = successHandler;

        const loader = new this.three.TextureLoader();

        loader.load(path, this.textureLoaded.bind(this));
    }

    textureLoaded(texture)
    {
        this.texture = texture;

        if(this.onSuccess != null)
            this.onSuccess(this);
    }
}
