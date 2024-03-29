import { GenMatrix } from "../data/GenMatrix";
import { Queue } from "../data/Queue";
import { Bitmap, Color, Core, Debug, Random, Util, Vector2 } from "../lib";
import { D8, Direction } from "../math/Directions";
import { TileAtlas } from "./TileAtlas";


/**
 * Implementation of the famous and fascinating WaveFunctionCollapse algorithm
 * https://github.com/mxgmn/WaveFunctionCollapse
 *
 * Some video's
 * https://www.youtube.com/watch?v=DOQTr2Xmlz0
 * https://www.youtube.com/watch?v=fnFj3dOKcIQ
 *
 * Terminology
 * Tile:
 * Prototype: A pairing between a tile and adjacency information. One tile can occur in multiple prototypes, due to rotation
 * Cell: a spot in the output image
 *
 *
 */
export class TileSolver {

    private constructor(
        private cells: GenMatrix<Uint8Array>, // sometimes called 'wave'. every uint8 represents a 'present' flag for one of 'atlas''s prototypes
        public atlas: TileAtlas,
        private random: Random,
    ) {}

    static new(atlas: TileAtlas, width: number, height: number) {

        // init all cells containing all options
        let maxOptions = atlas.prototypes.length;
        let cells = GenMatrix.new<Uint8Array>(width, height);
        for (let i = 0; i < cells.data.length; i++) {

            // add the indices of all options
            cells.data[i] = new Uint8Array(maxOptions);
            cells.data[i].fill(1);
            // cells.data[i] = Util.range(options.length);
        }

        return new TileSolver(cells, atlas, Random.fromRandom()) 
    }

    ///////////////////////////////////////////////////////////////////////////

    solve() {
        // after doing this, all cell lists should contain just a single pointer
        let maxIterations = 10000000 // we will never have to iterate more times than cells in the target image
        for (let i = 0; i < maxIterations; i++) {
            if (this.isCollapsed()) {
                return true;
            }
            this.solveStep();
        }
        
        console.error("max iteration reached in solve!");
        return false;
    }

    solveStep() {
        
        // pick a cell, and a choice for that cell 
        // let cells = this.getCellsWithLeastOptions();
        let cells = this.getCellsWithLeastEntrophy();
        // Debug.logOnce(cells, entr);

        let cell = cells[0];
        let cellChoicesBackup = new Uint8Array(this.cells.data[cell]);
        let choice = this.pickRandomOption(cell);
        
        // try to propagate this constraint
        // if this did not work: backtracking. 
        // revert the changes, and remove this choice from the possible choices
        let success = this.removeInvalidOptions(cell);
        if (!success) {
            console.count("backing up...");
            this.cells.data[cell] = cellChoicesBackup;
            this.removeOption(cell, choice);
        }
        return success;
    }

    pickRandomOption(cell: number) {
      
        // get choices + weights
        let data = this.cells.data[cell];
        let options: number[] = [];
        let weights: number[] = [];
        for (let i = 0; i < data.length; i++) {
            if (data[i] == 1) {
                options.push(i); 
                weights.push(this.atlas.prototypes[i].probability);
            } 
        }

        // now pick one
        let choice = this.random.choose(options);
        let choicew = this.random.chooseWeighted(options, weights);
        Debug.logTimes(10, {choice, choicew, options, weights})
        this.setOption(cell, choicew);
        return choice;
    }

    /**
     * The core
     */
    removeInvalidOptions(startCell: number, maxIterations = 10000000, debug=false) {
        let stack = new Array<number>();
        let visited = new Set<number>();
        let backup = new Array<[number, number]>();

        // use the backup to restore the original state if this state does not resolve
        let restoreState = () => {
            for (let entry of backup) {
                this.addOption(entry[0], entry[1]);
            }
        }

        stack.push(startCell);
        
        // protected while loop
        for (let i = 0; i < maxIterations; i++) {
            if (stack.length < 1) {
                return true;
            }

            // visit this cell
            let cell = stack.pop()!;
            visited.add(cell);

            // debug 
            if (debug) {
                console.log("-----------------")
                console.log("SOURCE:", cell, "|", this.getOptions(cell).length);
                this.atlas.printConcatConnections(this.getOptions(cell));
            }

            // per unvisited neighbor
            for (let neighbor of this.cells.getNbCells8(cell)) {
                if (visited.has(neighbor)) continue;
                
                let ops = this.getOptions(neighbor);
                let changed = this.removeInvalidOptionsOfNeighbor(cell, neighbor, backup, debug);

                // saveguard
                if (ops.length == 0) {

                    // console.info("All options were removed from node", neighbor, "!!");
                    restoreState();
                    return false;

                    // console.log("SOURCE:", cell, "|", this.getOptions(cell).length);
                    // console.log("TARGET TO THE", D8[this.cells.getDirectionFromDifference(neighbor - cell)!])
                    // this.atlas.printConcatConnections(this.getOptions(cell));
                    // console.log("ORIGINAL OPTIONS", ops);
                }

                if (changed) {
                    stack.push(neighbor);
                }   
            }

            // debug | return after one cycle
            // return false;
        }

        console.error("max iteration reached!");
        restoreState();
        return false;
    }

    private removeInvalidOptionsOfNeighbor(cell: number, neighbor: number, backup: Array<[number, number]>, debug=false) {

        let isTargetAllowed = (sourceOptions: number[], target: number, direction: D8) => {
            for (let source of sourceOptions) {
                if (this.atlas.canBeConnected(source, target, direction)) {
                    return true;
                }
            }
            return false;
        }

        let changed = false;

        // first, we require the direction
        let direction = this.cells.getDirectionFromDifference(neighbor - cell)!;

        // console.log("direction:", D8[direction], " means offset", offset);

        let sourceOptions = this.getOptions(cell);
        let targetOptions = this.getOptions(neighbor);
        let ogCount = targetOptions.length;

        // console.log("I have ", sourceOptions, "options");
        // console.log("target has", targetOptions, "options");

        // go over target options
        for (let target of targetOptions) {
            // if target matches NONE of the source options, it should be removed
            if (!isTargetAllowed(sourceOptions, target, direction)) {
                // console.log("incorrect!");
                this.removeOption(neighbor, target);
                backup.push([neighbor, target]);
                changed = true;
            } 
        }

        // debug
        if (debug) {           
            let newCount = this.getOptions(neighbor).length;
    
            // debug
            console.log("NB", D8[direction], ":", neighbor, "|", ogCount, "->", newCount);
        }

        return changed;
    }



    isCollapsed(debug=false): boolean {
        for (let i = 0; i < this.cells.data.length; i++) {
            let options = this.getOptions(i);
            if (debug) {
                console.log(options);
            }
            if (options.length !== 1) {
                return false;
            }
        }
        return true;
    }

    getOptions(cell: number) {
        let ops: number[] = [];
        let flags = this.cells.data[cell];
        for (let i = 0; i < flags.length; i++) {
            if (flags[i] == 1) {
                ops.push(i);
            }
        }
        return ops;
    }

    getEntrophy(cell: number) {
        let entrophy = 0;

        let flags = this.cells.data[cell];
        for (let i = 0; i < flags.length; i++) {
            if (flags[i] == 1) {
                let p = this.atlas.prototypes[i].probability;
                entrophy += p * Math.log(p);
            }
        }
        return -entrophy;
    }

    setOption(cell: number, choice: number) {
        let data = this.cells.data[cell];
        data.fill(0);
        data[choice] = 1;
    }

    removeOption(cell: number, option: number) {
        this.cells.data[cell][option] = 0;
    }

    addOption(cell: number, option: number) {
        this.cells.data[cell][option] = 1;
    }

    getTileOptions(cell: number) {
        return this.getOptions(cell).map(i => this.atlas.tiles[this.atlas.prototypes[i].tile]);
    }

    /**
     * or 'minimum entrophy', if you wanna be all fancy
     */
    private getCellsWithLeastOptions() {
        let least: number[] = [];
        let leastOptions = Infinity;
        for (let i = 0; i < this.cells.data.length; i++) {

            let options = this.getOptions(i);
            if (options.length == 1) {
                continue;
            }

            if (options.length == leastOptions) {
                least.push(i);
            } else if (options.length < leastOptions) {
                least = [];
                least.push(i);
                leastOptions = options.length;
            }
        }
        // console.log("least options", leastOptions)
        // console.log("least", least)
        return least;
    }

    private getCellsWithLeastEntrophy() {
        let least: number[] = [];
        let leastEntrophy = Infinity;
        for (let i = 0; i < this.cells.data.length; i++) {

            let options = this.getOptions(i);
            let entrophy = this.getEntrophy(i);

            // console.log(options);
            if (options.length == 1) {
                continue;
            }

            if (entrophy == leastEntrophy) {
                least.push(i);
            } else if (entrophy < leastEntrophy) {
                least = [];
                least.push(i);
                leastEntrophy = entrophy;
            }
        }
        // console.log("least options", leastOptions)
        // console.log("least", least)
        return least;
    }

    ///////////////////////////////////////////////////////////////////////////

    renderResult(): Bitmap {
        let image = Bitmap.new(this.cells.width, this.cells.height);
        for (let i = 0; i < image.pixelCount; i++) {
            // get average pixel
            let options = this.getTileOptions(i);
            if (options.length == 0) {
                console.warn("optionless cell encountered!");
                image.setWithIndex(i, [255,0,0,255]);
            } else {
                image.setWithIndex(i, getAverageCenterPixel(options));
            }
        }
        return image;
    }
}

function getAverageCenterPixel(imageSeries: Bitmap[]) {
    let pixel = [0,0,0,0];
    let count = imageSeries.length;
    let oneOverCount = 1 / count;
    let k = Math.floor(imageSeries[0].width / 2);
    // k = 1;
    for (let image of imageSeries) {
        let newPixel = image.get(k, k);
        for (let i = 0; i < 4; i++) {
            pixel[i] += newPixel[i] * oneOverCount;
        }
    }
    return pixel;
}


