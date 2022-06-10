// name:    ui.js
// author:  Jos Feenstra
// purpose: lets create the UI using html & dom api, because why the hell not

import { Domain } from "../math/domain";
import { GeonMath } from "../math/math";

export class UI {
    readonly globalContext: HTMLDivElement;
    currentContext!: HTMLDivElement;

    constructor(frame: HTMLDivElement) {
        this.globalContext = frame;
        this.currentContext = frame;
    }

    static new(frame: HTMLDivElement) {
        return new UI(frame);
    }

    // the context system makes sure that ui additions appear under the currently active,
    // selected app, and that these ui elements are removed when switching to another app.

    toggleVisibility() {
        // simple toggle
        if (this.globalContext.hidden) {
            this.show();
        } else {
            this.hide();
        }
    }

    clear() {
        let context = this.currentContext;
        while (context.hasChildNodes()) {
            context.removeChild(context.lastChild!);
        }
    }

    hide() {
        this.globalContext.hidden = true;
    }

    show() {
        this.globalContext.hidden = false;
    }

    addContext(appName: string) {
        this.currentContext = this.globalContext;
        let appDiv = this.addDiv(appName + " app-interface");
        this.currentContext = appDiv;
    }

    setContext(appName: string) {
        this.globalContext.getElementsByClassName(appName);
    }

    removeContext(appName: string) {
        this.setContext(appName);
        let count = this.currentContext.childElementCount;
        for (let i = count - 1; i >= 0; i -= 1) {
            this.currentContext.removeChild(this.currentContext.children.item(i)!);
        }

        let temp = this.currentContext;
        this.currentContext = this.globalContext;
        this.currentContext.removeChild(temp);
    }

    addElement(element: string, className: string = ""): HTMLElement {
        let el = document.createElement(element);
        el.className = className;
        this.currentContext.appendChild(el);
        return el;
    }

    addDiv(classname: string, items: HTMLElement[] = []): HTMLDivElement {
        let div = this.addElement("div", classname) as HTMLDivElement;
        items.forEach((item) => {
            div.appendChild(item);
        });
        return div;
    }

    addBooleanParameter(param: Parameter, onInput: (v: number) => void = () => {}) {
        // create hacky button
        // <label class="check-container">
        //   <input type="checkbox" checked="checked">
        //   <span class="checkmark"></span>
        // </label>

        let checkbox = this.addElement("input", "checkbox") as HTMLInputElement;
        checkbox.type = "checkbox";
        checkbox.addEventListener("change", () => {
            let state = checkbox.checked;
            param.set(state ? 1 : 0);

            onInput(checkbox.valueAsNumber);
            text1.innerText = param.name;
        });
        checkbox.checked = param.get() == 1;

        // this needs to be done to make css happy
        let checkcontainer = this.addElement("label", "check-container");
        let checkmark = this.addElement("span", "checkmark");
        checkcontainer.appendChild(checkbox);
        checkcontainer.appendChild(checkmark);

        // text
        let text1 = this.addElement("p", "control-text");
        text1.innerText = param.name;

        // TODO update beyond our control
        // param.onset = () => {
        //     // console.log("TODO");
        // };

        this.addDiv("control", [text1, checkcontainer]);

        return checkbox;
    }

    addParameter(param: Parameter | EnumParameter, onInput: (v: number) => void = () => {}) {
        let p: Parameter;
        if (param instanceof EnumParameter) {
            p = param.p;
        } else {
            p = param;
        }

        // create slider itself
        let slider = this.addRangeInput(p, onInput);

        // create slider title
        let text1 = this.addElement("p", "control-text");
        text1.innerText = p.name;

        // create slider value indicator
        let text2 = this.addElement("p", "control-value");
        if (param instanceof EnumParameter) {
            text2.innerText = param.getName();
        } else {
            text2.innerText = slider.value;
        }

        // put them all together
        this.addDiv("control", [text1, slider, text2]);

        // on reverse update
        param.setSliderAndText(slider, text2);

        // on update by user
        slider.oninput = () => {
            p.set(slider.valueAsNumber, false);
            onInput(slider.valueAsNumber);
            if (param instanceof EnumParameter) {
                text2.innerText = param.getName();
            } else {
                text2.innerText = slider.value;
            }
        };
        return slider;
    }

    addRangeInput(param: Parameter, onInput: (v: number) => void = () => {}) {
        // a slider looks like this : <input type="range" min="1" max="100" step="1" value="50">
        let slider = this.addElement("input", "control-slider") as HTMLInputElement;

        slider.type = "range";
        slider.min = param.min.toString();
        slider.max = param.max.toString();
        slider.valueAsNumber = param.state;
        slider.step = param.step.toString();

        return slider;
    }

    addText(text: string) {
        let p = this.addElement("p", "ui-text");
        p.innerText = text;
    }

    addButton(name: string, callback: () => void) {
        let button = this.addElement("button", "control-button");
        button.innerText = name;
        button.addEventListener("click", callback);

        let text1 = this.addElement("p", "control-text");
        let control = this.addDiv("control", [text1, button]);
        return control;
    }

    addDropdown(enumParam: EnumParameter, onchange: (v: number) => void): HTMLSelectElement {
        // <select>
        //  <option>Cappuccino</option>
        //  <option>Mocha</option>
        // </select>

        let count = enumParam.values.length;

        let dropdownSelector = this.addElement(
            "select",
            "enum-selector dropdown-select",
        ) as HTMLSelectElement;
        for (let i = 0; i < count; i++) {
            let o = this.addElement("option", "enum-item");
            o.innerText = enumParam.values[i];
            dropdownSelector.appendChild(o);
        }
        // console.log(e);

        dropdownSelector.addEventListener("change", (e: Event) => {
            let target = e.target as HTMLSelectElement;
            let i = target.selectedIndex;
            enumParam.set(i);
            onchange(i);
        });

        this.addDiv("dropdown-dark", [dropdownSelector]);

        return dropdownSelector;
    }
}

// a slider parameter
export class Parameter {
    name: string;
    state: number;
    min: number;
    max: number;
    step: number;

    constructor(name: string, state: number, min = -Infinity, max = Infinity, step = 0.1) {
        this.name = name;
        this.min = min;
        this.max = max;
        this.step = step;

        this.state = state;
        this.set(this.state);
    }

    static new(name: string, state: number, min = -Infinity, max = Infinity, step = 0.1) {
        return new Parameter(name, state, min, max, step);
    }

    static newBoolean(name: string, state: boolean) {
        return new Parameter(name, state ? 1 : 0, 0, 1, 1);
    }

    get(): number {
        return this.state;
    }

    getDomain() : Domain {
        return Domain.new(this.min, this.max);
    }

    set(state: number, activateOnSet = true) {
        // something is still wrong here...
        let clamped = GeonMath.clamp(state, this.min, this.max);
        let rest = state - this.min;
        let times = Math.round(rest / this.step);
        let stepped = this.min + this.step * times;
        this.state = GeonMath.clamp(stepped, this.min, this.max);
        if (activateOnSet) this.onset();
    }

    getNPermutations() {
        return Math.min((this.max - this.min) / this.step + 1);
    }

    // TODO make this less tied together

    private slider?: HTMLInputElement;
    private text?: HTMLElement;

    setSlider(slider: HTMLInputElement) {
        this.slider = slider;
    }

    setSliderAndText(slider: HTMLInputElement, text?: HTMLElement) {
        this.slider = slider;
        this.text = text;
    }

    private onset() {
        if (this.slider)
            this.slider.valueAsNumber = this.state;
        if (this.text)
            this.text.innerText = this.state.toString();
    }
}

// a parameter representing distinct states
export class EnumParameter {
    private constructor(public p: Parameter, public values: string[]) {}

    static new<T>(name: string, state: number, descriptions: string[]) {
        return new EnumParameter(
            new Parameter(name, state, 0, descriptions.length - 1, 1),
            descriptions,
        );
    }

    getName(): string {
        return this.values[this.get()];
    }

    // passthroughs

    get(): number {
        return this.p.get();
    }

    set(state: number) {
        return this.p.set(state);
    }

    getNPermutations() {
        return this.p.getNPermutations();
    }

    // TODO make this less tied together

    private slider?: HTMLInputElement;
    private text?: HTMLElement;

    setSlider(slider: HTMLInputElement) {
        this.slider = slider;
    }

    setSliderAndText(slider: HTMLInputElement, text?: HTMLElement) {
        this.slider = slider;
        this.text = text;
    }

    private onset() {
        if (this.slider)
            this.slider!.valueAsNumber = this.get();
        if (this.text)
            this.text!.innerText = this.getName();
    }
}
