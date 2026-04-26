// by UnManuel.com

export default class Toggle
{
    constructor(button)
    {
        this.button = button;
        this.knob = button.querySelector("#knob");

        this.value = false;

        this.alive = true;

        this.onToggle = null;

        this.button.addEventListener('click', this.toggleValue.bind(this));
    }

    toggleValue()
    {
        this.value = !this.value;
        this.refresh();

        if(this.onToggle != null)
            this.onToggle();
    }

    setValue(value)
    {
        const v = this.value;

        this.value = value;
        this.refresh();

        if(v != value && this.onToggle != null)
            this.onToggle();
    }

    refresh()
    {
        this.button.classList.replace(this.value ? "toggle-off" : "toggle-on", this.value ? "toggle-on" : "toggle-off");
        this.knob.classList.replace(this.value ? "toggle-knob-off" : "toggle-knob-on", this.value ? "toggle-knob-on" : "toggle-knob-off");
    }
}
