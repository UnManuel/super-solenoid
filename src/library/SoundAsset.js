// by UnManuel.com

export default class SoundAsset
{
    constructor(three, audioListener)
    {
        this.three = three;

        this.sound = new this.three.Audio(audioListener);
        this.buffer = null;

        this.onSuccess = null;
    }

    load(path, successHandler = null)
    {
        this.onSuccess = successHandler;

        const loader = new this.three.AudioLoader();

        loader.load(path, this.soundLoaded.bind(this));
    }

    soundLoaded(buffer)
    {
        this.sound.setBuffer(buffer);
        this.buffer = buffer;

        if(this.onSuccess != null)
            this.onSuccess(this);
    }

    clone()
    {
        const asset = new SoundAsset(this.three, this.sound.listener);

        asset.sound.setBuffer(this.buffer);
        asset.buffer = this.buffer;

        return asset;
    }
}
