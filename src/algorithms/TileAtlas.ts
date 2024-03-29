import { Bitmap, Vector2, Color, COLOR } from "../lib";
import { D8, Direction } from "../math/Directions";

type Connection = {
    from: number, // prototype index
    to: number, // prototype index
    dir: D8
};

// make sure we can do mirrors & rotations
type Prototype = {
    tile: number,
    rotation: number,
    mirrored: boolean,
    probability: number,
};

/**
 * Contains all tiles, and connectivity data between different tiles
 * 
 * TODO create an interface for making this work with meshes and stuff
 */
export class TileAtlas {

    private constructor(
        public readonly tiles: Bitmap[],
        public readonly prototypes: Prototype[],
        public readonly connections: Connection[],
        public readonly connectionHash: Set<string>, 
        ) {}

    static fromPeriodicSourceImage(input: Bitmap, kernelSize: number) {

        // generate tiles themselves from the source image 
        let tiles: Bitmap[] = [];
        let weights: number[] = [];
        let total = 0;
        for (let y = 0; y < input.height; y++) {
            for (let x = 0; x < input.width; x++) {
                
                // trim periodically, so that the tile pattern will be repeated
                let tile = input.periodicTrim(x, y, x + kernelSize, y + kernelSize);
                // for (let tile of [cutout, cutout.rot90(), cutout.rot180(), cutout.rot270()]) {
                    
                let overlapTileId = tiles.findIndex(((t) => doImagesOverlap(t, tile)));
            
                if (overlapTileId == -1) {
                    weights.push(1);
                    tiles.push(tile);
                } else {
                    weights[overlapTileId] += 1;
                }
                total += 1;
                // }
            }
        }

        // generate prototypes
        let prototypes: Prototype[] = [];
        for (let i = 0; i < tiles.length; i++) {
            prototypes.push({tile: i, rotation: 0, mirrored: false, probability: weights[i] / total})
        }

        // calculate connections based on correct image overlap
        let connections: Connection[] = [];
        for (let i = 0; i < prototypes.length; i++) {
            let tileA = tiles[prototypes[i].tile];

            for (let j = 0; j < prototypes.length; j++) {
                // if (i == j) continue;
                if (i > j) continue; // dont do double checks, we dont need to
                let tileB = tiles[prototypes[j].tile];

                for (let dir of Direction.Eight) {
                    let offset = Direction.D8ToVector(dir);
                
                    if (doImagesOverlap(tileA, tileB, offset)) {
                        connections.push({from: i, to: j, dir});
                        connections.push({from: j, to: i, dir: Direction.opposite(dir)});
                    }
                }
            }   
        }

        // because js is stupid and has no tuple set, we need to to the hashing by calling json.stringify...
        let connectionHash = new Set<string>();
        for (let con of connections) {
            connectionHash.add(JSON.stringify(con));
        }

        return new TileAtlas(tiles, prototypes, connections, connectionHash);        
    }

    // static fromSourceImageBetter(input: Bitmap, kernelSize: number) {

    //     // generate tiles themselves from the source image 
    //     let tiles: Bitmap[] = [];
    //     let tileOGID = new Array<number>();
    //     let idMapper = new Map<number, number>();
    //     let frequency = new Array<number>();
    //     let frequencies: number[] = [];

    //     let i = 0;
    //     for (let y = 0; y < input.height; y++) {
    //         for (let x = 0; x < input.width; x++) {
    //             // trim periodically, so that the tile pattern will be repeated
    //             let tile = input.periodicTrim(x, y, x + kernelSize, y + kernelSize);

                

    //             // // deal with indices
    //             // let overlapTileId = tiles.findIndex(((tile) => doImagesOverlap(tile, tile)));
    //             // let index;
    //             // if (overlapTileId == -1) {
    //             //     // new tile
    //             //     index = tiles.length;
    //             //     tiles.push(tile);
    //             //     frequencies.push(1);
    //             //     idMapper.set(i, i);
    //             // } else {
    //             //     // existing tile 
    //             //     // increase frequency, and add an index to point back to this other tile
    //             //     index = overlapTileId
    //             //     frequencies[overlapTileId] += 1;
    //             // }
    //             // idMapper.set(i, index);
    //             // i++

    //             // deal with connections
    //             for (let dir of Direction.Four) {
    //                 let offset = Direction.D8ToVector(dir);
    //                 // nbIndex = 

    //                 // if (doImagesOverlap(tileA, tileB, offset)) {
    //                 //     connections.push({from: i, to: j, dir});
    //                 //     connections.push({from: j, to: i, dir: Direction.opposite(dir)});
    //                 // }
    //             }
    //         }
    //     }
    //     console.log(idMapper);

    //     let prototypes = new Array<Prototype>();
    //     let connections = new Array<Connection>();
    //     let connectionHash = new Set<string>();
    //     for (let con of connections) {
    //         connectionHash.add(JSON.stringify(con));
    //     }
    //     return new TileAtlas(tiles, prototypes, connections, connectionHash)
    // }

    getConcatConnections(ptts: number[]) {
        let data: any = {};
        for (let dir of Direction.Four) {
            data[D8[dir]] = [];
        }

        for (let con of this.connections) {
            if (ptts.includes(con.from)) {
                if (!data[D8[con.dir]].includes(con.to)) {
                    data[D8[con.dir]].push(con.to);
                }
            }
        }
        return data;
    }
    
    printConcatConnections(ptts: number[]) {
        console.log("connections of tiles ", ptts, ":");
        console.log(this.getConcatConnections(ptts));
    }

    printConnections(ptt: number) {
        console.log("connections of tile ", ptt, ":");
        let data: any = {};
        for (let dir of Direction.Four) {
            data[D8[dir]] = [];
        }

        for (let con of this.connections) {
            if (con.from == ptt) {
                // console.log(con);
                data[D8[con.dir]].push(con.to);
            }
        }
        console.log(data);
    }

    /**
     * ask if 'to', which is to the 'dir' of 'from', is allowed to be there, due to connectivity constraints
     */
    canBeConnected(from: number, to: number, dir: D8, ) {
        return this.connectionHash.has(JSON.stringify({from, to, dir}));
    }

    
    printAllConnections() {
        for (let ptt of this.prototypes) {
            this.printConnections(ptt.tile);
        }
    }
}

export function doImagesOverlap(a: Bitmap, b: Bitmap, offset=Vector2.zero(), debug=false) : boolean {

    let aoff = Vector2.zero();
    if (offset.x > 0) aoff.x += offset.x;
    if (offset.y > 0) aoff.y += offset.y;

    let boff = Vector2.zero();
    if (offset.x < 0) boff.x += offset.x * -1;
    if (offset.y < 0) boff.y += offset.y * -1;

    for (let y = 0; y < a.height - Math.abs(offset.y); y++) {
        for (let x = 0; x < a.width - Math.abs(offset.x); x++) {
            if (debug) {
                console.log("a_coords", x + aoff.x, y + aoff.y);
                console.log("b_coords", x + boff.x, y + boff.y);
                let colorA = a.get(x + aoff.x, y + aoff.y);
                let colorB = b.get(x + boff.x, y + boff.y);
                console.log("a", colorA, "b", colorB, "same", Color.isTheSame(colorA, colorB));

            }
            if (!Color.isTheSame(a.get(x + aoff.x, y + aoff.y), b.get(x + boff.x, y + boff.y))) {
                return false
            }
        }
    }

    if (debug) {
        for (let y = 0; y < a.height; y++) {
            for (let x = 0; x < a.width; x++) {
                let colorA = a.get(x, y);
                let colorB = b.get(x, y);
                console.log("a", colorA);
            }
        }
    }

    return true;
}