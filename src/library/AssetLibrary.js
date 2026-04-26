// by UnManuel.com

import MeshAsset from './MeshAsset.js';
import TextureAsset from './TextureAsset.js';
import CubemapAsset from './CubemapAsset.js';
import FontAsset from './FontAsset.js';
import SoundAsset from './SoundAsset.js';

export default class AssetLibrary
{
    constructor(three, rapier = null)
    {
        this.three = three;
        this.rapier = rapier;

        this.assets = [];
        this.assetIndex = 0;
    }

    loadMesh(path, assetId = '', successHandler = null, material = null)
    {
        const asset = new MeshAsset(this.three, this.rapier, material);

        this.loadAsset(asset, path, assetId, successHandler);
    }

    loadTexture(path, assetId = '', successHandler = null)
    {
        const asset = new TextureAsset(this.three);

        this.loadAsset(asset, path, assetId, successHandler);
    }

    loadCubemap(path, imageFiles, assetId = '', successHandler = null)
    {
        const asset = new CubemapAsset(this.three, imageFiles);

        this.loadAsset(asset, path, assetId, successHandler);
    }

    loadFont(path, fontName = '', assetId = '', successHandler = null)
    {
        const asset = new FontAsset(this.three, fontName);

        this.loadAsset(asset, path, assetId, successHandler);
    }

    loadSound(path, audioListener, assetId = '', successHandler = null)
    {
        const asset = new SoundAsset(this.three, audioListener);

        this.loadAsset(asset, path, assetId, successHandler);
    }

    loadAsset(asset, path, assetId = '', successHandler = null)
    {
        asset.path = path;
        asset.assetId = assetId;
        asset.handler = successHandler;

        this.assets.push(asset);

        if(this.assetIndex == this.assets.length - 1)
            asset.load(path, this.assetLoaded.bind(this));
    }

    assetLoaded(asset)
    {
        if(asset.assetId != '')
            this[asset.assetId] = asset;

        if(asset.handler != null)
            asset.handler(asset);

        if(++this.assetIndex < this.assets.length)
        {
            const nextAsset = this.assets[this.assetIndex];

            nextAsset.load(nextAsset.path, this.assetLoaded.bind(this));  
        }
    }
}
