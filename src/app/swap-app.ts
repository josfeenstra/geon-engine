// name:    swap-app
// author:  Jos Feenstra
// purpose: swap between different apps.
//          - factory for initiazing these apps
//          - making sure core deletes old apps

import { Core } from "../system/core";
import { InputState } from "../system/input-state";
import { EnumParameter, UI } from "../system/ui";
import { App } from "./app";

export class SwapApp extends App {
    possibleApps: any[];
    core: Core;
    currentAppIndex: number = -1;
    isuihidden = false;
    param?: EnumParameter;

    constructor(gl: WebGLRenderingContext, core: Core, possibleApps: any[]) {
        super(gl);
        this.core = core;
        this.possibleApps = possibleApps;
    }

    getAppNames() {
        let names: string[] = [];
        let count = this.possibleApps.length;
        for (let i = 0; i < count; i++) {
            names.push(this.possibleApps[i].name.replace("App", ""));
        }
        return names;
    }

    ui(ui: UI) {
        let names = this.getAppNames();

        this.param = EnumParameter.new("apps", 0, names);
        ui.addDropdown(this.param, (i) => {
            this.swap(i);
        });
    }

    swapFromUrl(hash: string, ifnot: number) {
        // select one of the apps based on an url
        let test = hash.substr(1);

        let names = this.getAppNames();
        for (let i = 0; i < names.length; i++) {
            if (names[i].toLowerCase() === test) {
                this.swap(i);
                return;
            }
        }

        // no match
        console.log("no hash match, defaulting...");
        this.swap(ifnot);
    }

    swap(index: number) {
        // todo do some range checking
        let AppType = this.possibleApps[index];
        if (this.currentAppIndex > -1) {
            let PreviousType = this.possibleApps[this.currentAppIndex];
            console.log("removing", PreviousType.name);
            this.core.removeApp(PreviousType.name);
        }
        console.log("constructing", AppType.name);
        this.currentAppIndex = index;

        let app = new AppType(this.gl);

        location.hash = "#" + AppType.name.replace("App", "").toLowerCase();

        this.core.addApp(app);
    }

    update(state: InputState) {
        if (state.IsKeyPressed("m")) {
            // simple toggle
            this.core.ui.toggleVisibility();
        }
    }
}
