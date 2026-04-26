// by UnManuel.com

export default class FontAsset
{
    constructor(three, fontName = "")
    {
        this.three = three;

        this.fontName = fontName;

        this.font = null;

        this.onSuccess = null;
    }

    load(path, successHandler = null)
    {
        this.onSuccess = successHandler;

        if(this.fontName != "")
        {
            Promise.race([
                document.fonts.load(this.fontName),
                new Promise((_, reject) => setTimeout(() => reject('Timeout'), 3000))
            ])
            .then((loadedFonts) => {

                if(this.onSuccess != null)
                    this.onSuccess(this);
                
                if(loadedFonts.length == 0)
                    console.log('Font ${this.fontName)} not found or not loaded');
                    
            })
            .catch(error => console.log("Font ${this.fontName)} loading error: ", error));
        }
        else
        {
            const loader = new this.three.FontLoader();

            loader.load(path, this.fontLoaded.bind(this));
        }
    }

    fontLoaded(font)
    {
        this.font = font;

        if(this.onSuccess != null)
            this.onSuccess(this);
    }
}
