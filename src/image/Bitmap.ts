// image.ts
// author: Jos Feenstra
// purpose: wrapper around the ImageData class,
// - in order to get more functionality out of it
//
// note: named Texture to not collide with Image classes.

// PROBLEM: this should be just a normal 2d uint16 matrix or something. 
// troubles occur with sobel operators, which go negative.
// its too many layers, this image abstraction should not be needed.  

import { Domain2 } from "../math/Domain";
import { FloatMatrix } from "../data/FloatMatrix";
import { ImageProcessing } from "./ImageProcessing";
import { BiSurface, DepthMeshShader, Vector2 } from "../lib";
import { Color } from "./Color";

// TODO : x and y are not the same as i and j, and used inconsistently. fix this.
// TODO : now that GEON is a package, we can use G.Image. the Geon suffix is not needed anymore is not needed anymore!



/**
 * A class representing an image, meant to actually edit the image.
 */
export class Bitmap {
    public data: Uint8ClampedArray;
    public readonly width: number;
    public readonly height: number;
    public readonly depth: number;

    public readonly pixelCount: number;

    constructor(width: number, height: number, depth: number = 4, data?: Uint8ClampedArray) {
        
        this.width = width;
        this.height = height;
        this.depth = depth;

        this.pixelCount = width * height;

        if (data) {
            this.data = data;
        } else {
            this.data = new Uint8ClampedArray(this.width * this.height * this.depth);
        }
    }

    get pixelSize() {

        return this.depth;
    }

    get fullSize() {
        return this.data.length;
    }

    static new(width: number, height: number, depth=4) {
        return new Bitmap(width, height, depth);
    }

    static fromImageData(id: ImageData): Bitmap {
        let image = new Bitmap(id.width, id.height, undefined, id.data);
        return image;
    }

    toImageData(): ImageData {
        // imagedata requires pixelsize of 4.
        if (this.pixelSize == 1) {
            console.log("conferting to rgba...");
            return ImageProcessing.imagedataFromTrueGreyscale(this);
        } else if (this.pixelSize != 4) {
            throw "pixelsize must be 4 for toImageData to work";
        }
        return new ImageData(this.data, this.width, this.height);
    }

    setData(data: Uint8ClampedArray) {
        if (data.length != this.height * this.width * this.pixelSize)
            throw "data.length does not match width * height ";

        this.data = data;
    }

    clone() {
        let image = new Bitmap(this.width, this.height, this.pixelSize);
        image.setData(this.data);
        return image;
    }

    fillWithColors(colors: number[][]) {
        for (let i = 0; i < this.pixelCount; i++) {
            this.setWithIndex(i, colors[i]);
        }
    }

    fill(pixel: number[]): Bitmap {
        for (let i = 0; i < this.height; i++) {
            for (let j = 0; j < this.width; j++) {
                this.set(j, i, pixel);
            }
        }
        return this;
    }

    fillEvery(filler: Function) {
        for (let i = 0; i < this.height; i++) {
            for (let j = 0; j < this.width; j++) {
                this.set(j, i, filler());
            }
        }
        return this;
    }

    forEach(filler: (x: number, y: number) => number[]) {
        for (let i = 0; i < this.height; i++) {
            for (let j = 0; j < this.width; j++) {
                this.set(j, i, filler(j, i));
            }
        }
    }

    /**
     * Perform an operation to every pixel of an image
     */
    forEachPixel(operation: (pixel: number[], i: number, j: number) => number[]) {
        let result = new Bitmap(this.width, this.height, this.pixelSize);
        for (let i = 0; i < this.width; i++) {
            for (let j = 0; j < this.height; j++) {
                let pixel = this.get(i, j);
                pixel = operation(pixel, i, j);
                result.set(i, j, pixel);
            }
        }
        return result;
    }

    /**
     * Perform an operation to every pixel of a 'greyscale' image
     */
    forEachGreyscalePixel(operation: (val: number, i: number, j: number) => number) {
        let result = new Bitmap(this.width, this.height, this.pixelSize);
        for (let i = 0; i < this.width; i++) {
            for (let j = 0; j < this.height; j++) {
                let val = this.get(i, j)[0];
                val = operation(val, i, j);
                result.set(i, j, [val, val, val, 255]);
            }
        }
        return result;
    }

    includes(x: number, y: number): boolean {
        return x < this.width && x >= 0 && y < this.height && y >= 0;
    }

    set(i: number, j: number, pixel: number[]) {
        this.data[4 * (j * this.width + i)] = pixel[0];
        this.data[4 * (j * this.width + i) + 1] = pixel[1];
        this.data[4 * (j * this.width + i) + 2] = pixel[2];
        this.data[4 * (j * this.width + i) + 3] = pixel[3];
    }

    get(i: number, j: number): number[] {
        return [
            this.data[4 * (j * this.width + i)],
            this.data[4 * (j * this.width + i) + 1],
            this.data[4 * (j * this.width + i) + 2],
            this.data[4 * (j * this.width + i) + 3],
        ];
    }

    getWithIndex(index: number) {
        return [
            this.data[4 * index],
            this.data[4 * index + 1],
            this.data[4 * index + 2],
            this.data[4 * index + 3],
        ];
    }

    setWithIndex(index: number, value: number[]) {
        this.data[4 * index] = value[0];
        this.data[4 * index + 1] = value[1];
        this.data[4 * index + 2] = value[2];
        this.data[4 * index + 3] = value[3];
    }

    // NOTE: this should be fixed on the level of an nD array

    vecToIndex(x: number, y: number) {
        return  y * this.width + x;
    }

    indexToVec(index: number) {
        let base = Math.floor(index / this.width);
        let left = index - base * this.width;
        return Vector2.new(left, base);
    }

    getNbIndices(index: number) {
        let nbs = new Array<number>();

        if (index >= this.width * this.height) return nbs;

        // make sure we dont add out of bound dudes
        if (index % this.width != 0) nbs.push(index - 1);
        if ((index+1) % this.width != 0) nbs.push(index + 1);
        if (index - this.width > 0) nbs.push(index - this.width);
        if (index + this.width < this.width * this.height) nbs.push(index + this.width);

        return nbs;
    }

    getNbIndices8(index: number) {
        let nbs = new Array<number>();
        let size = this.width * this.height;
        if (index >= size) return nbs;

        let hasLeft = index % this.width != 0;
        let hasRight = (index+1) % this.width != 0;
        let hasTop = index - this.width > 0;
        let hasBot = index + this.width < size;

        if (hasLeft) nbs.push(index - 1);
        if (hasRight) nbs.push(index + 1);
        if (hasTop) nbs.push(index - this.width);
        if (hasBot) nbs.push(index + this.width);

        if (hasTop && hasLeft)  nbs.push(index - this.width - 1);
        if (hasTop && hasRight)  nbs.push(index - this.width + 1);
        if (hasBot && hasLeft) nbs.push(index + this.width - 1);
        if (hasBot && hasRight) nbs.push(index + this.width + 1);

        return nbs;
    }

    flipHor(): Bitmap {
        let image = new Bitmap(this.width, this.height, this.pixelSize);
        for (let i = 0; i < this.height; i++) {
            for (let j = 0; j < this.width; j++) {
                let jMirror = this.width - 1 - j;
                image.set(j, i, this.get(jMirror, i));
            }
        }
        return image;
    }

    flipVer(): Bitmap {
        let image = new Bitmap(this.width, this.height, this.pixelSize);
        for (let i = 0; i < this.height; i++) {
            let iMirror = this.height - 1 - i;
            for (let j = 0; j < this.width; j++) {
                image.set(j, i, this.get(j, iMirror));
            }
        }
        return image;
    }

    rot90(): Bitmap {
        let image = new Bitmap(this.height, this.width, this.pixelSize);
        for (let oldy = 0; oldy < this.height; oldy++) {
            for (let oldx = 0; oldx < this.width; oldx++) {
                let x = this.width - 1 - oldy;
                let y = oldx;
                image.set(x, y, this.get(oldx, oldy));
            }
        }
        return image;
    }

    rot180(): Bitmap {
        let image = new Bitmap(this.width, this.height, this.pixelSize);
        for (let oldy = 0; oldy < this.height; oldy++) {
            for (let oldx = 0; oldx < this.width; oldx++) {
                let x = this.width - 1 - oldx;
                let y = this.height - 1 - oldy;
                image.set(x, y, this.get(oldx, oldy));
            }
        }
        return image;
    }

    rot270(): Bitmap {
        let image = new Bitmap(this.height, this.width, this.pixelSize);
        for (let oldy = 0; oldy < this.height; oldy++) {
            for (let oldx = 0; oldx < this.width; oldx++) {
                let x = oldy;
                let y = this.width - 1 - oldx;
                image.set(x, y, this.get(oldx, oldy));
            }
        }
        return image;
    }

    applyKernel(kernel: FloatMatrix): Bitmap {
        // determine kernel size
        let size = kernel.count();
        let radius = size / 2 - 0.5;
        let image = new Bitmap(
            this.width - radius * 2,
            this.height - radius * 2,
            this.pixelSize,
        );

        // old image space
        for (let i = radius; i < this.width - radius; i++) {
            for (let j = radius; j < this.height - radius; j++) {
                let pixel = this.getWithKernel(i, j, kernel, radius);
                image.set(i - radius, j - radius, pixel);
            }
        }

        return image; // succes
    }

    getMinMax(): [number, number] {
        // get the minimum and maximum pixel value
        // assumes pixelsize = 1

        let min = Infinity;
        let max = 0;

        for (let i = 0; i < this.data.length; i++) {
            if (this.data[i] < min) {
                min = this.data[i];
            } else if (this.data[i] > max) {
                max = this.data[i];
            }
        }

        return [min, max];
    }

    applyThreshold(lower: number, upper: number) {
        return this.apply((x: number, y: number) => {
            let pixel = this.get(x, y);

            if (pixel[0] < lower) {
                return [0, 0, 0, 0];
            } else if (pixel[0] > upper) {
                return [255, 255, 255, 255];
            } else {
                return pixel;
            }
        });
    }

    apply(filler: Function): Bitmap {
        let copy = new Bitmap(this.width, this.height, this.pixelSize);

        for (let y = 0; y < this.height; y++) {
            for (let x = 0; x < this.width; x++) {
                copy.set(x, y, filler(x, y));
            }
        }
        return copy;
    }

    getWithKernel(i: number, j: number, kernel: FloatMatrix, radius: number): number[] {
        // kernel space
        let sum = [0, 0, 0, 255];
        let [dimx, dimy] = kernel.getDimensions();
        for (let ki = 0; ki < dimx; ki++) {
            for (let kj = 0; kj < dimy; kj++) {
                let weight = kernel.get(ki, kj);
                let pixel = this.get(i + ki - radius, j + kj - radius);

                for (let i = 0; i < 3; i++) {
                    sum[i] += pixel[i] * weight;
                }
            }
        }
        return sum;
    }

    setAplha(a: number) {
        for (let y = 0; y < this.height; y++) {
            for (let x = 0; x < this.width; x++) {
                let pixel = this.get(x, y);
                this.set(x, y, [pixel[0], pixel[1], pixel[2], a]);
            }
        }
        return this;
    }

    scale(scaleX: number, scaleY: number): Bitmap {
        // scale the image to a new width and height, using nearest neighbour
        return this.resize(Math.round(this.width * scaleX), Math.round(this.height * scaleY));
    }

    resize(width: number, height: number): Bitmap {
        // resize the image to a new width and height, using nearest neighbour
        const image = new Bitmap(width, height, this.pixelSize);
        const old = this;

        const x_factor = (1 / image.width) * old.width;
        const y_factor = (1 / image.height) * old.height;

        for (let y = 0; y < image.height; y++) {
            for (let x = 0; x < image.width; x++) {
                let pixel = old.get(Math.round(x * x_factor), Math.round(y * y_factor));
                image.set(x, y, pixel);
            }
        }

        return image;
    }

    // add borders till this size is achieved
    buffer(width: number, height: number): Bitmap {
        const image = new Bitmap(width, height, this.pixelSize);
        const old = this;

        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                // console.log(x, y);
                if (old.includes(x, y)) {
                    image.set(x, y, old.get(x, y));
                }
            }
        }

        // for (let y = 0; y < height; y++) {
        //     for (let x = 0; x < width; x++) {
        //         image.set(x, y, [x,0,0,255]);
        //     }
        // }

        // build some simple image instead to test
        // for (let i = 0; i < image.data.length / 4; i++) {
        //     image.data[i*4 + 0] = i % 255;
        //     image.data[i*4 + 1] = 0;
        //     image.data[i*4 + 2] = 0;
        //     image.data[i*4 + 3] = 255;
        // }

        return image;
    }

    trimWithDomain(dom: Domain2) {
        const x1 = Math.round(dom.x.t0);
        const x2 = Math.round(dom.x.t1);
        const y1 = Math.round(dom.y.t0);
        const y2 = Math.round(dom.y.t1);

        return this.trim(x1, y1, x2, y2);
    }

    trim(x1: number, y1: number, x2: number, y2: number): Bitmap {
        // return a hardcopy of this particular window
        const imageWidth = x2 - x1;
        const imageHeight = y2 - y1;

        const image = new Bitmap(imageWidth, imageHeight, this.pixelSize);

        for (let y = 0; y < imageHeight; y++) {
            for (let x = 0; x < imageWidth; x++) {
                let pixel = this.get(x + x1, y + y1);
                image.set(x, y, pixel);
            }
        }

        return image;
    }

    periodicTrim(x1: number, y1: number, x2: number, y2: number): Bitmap {
        // return a hardcopy of this particular window
        const imageWidth = x2 - x1;
        const imageHeight = y2 - y1;

        const image = new Bitmap(imageWidth, imageHeight, this.pixelSize);

        for (let y = 0; y < imageHeight; y++) {
            for (let x = 0; x < imageWidth; x++) {
                let pixel = this.get((x + x1) % this.width, (y + y1) % this.height);
                image.set(x, y, pixel);
            }
        }

        return image;
    }

    toGreyscale(): Bitmap {
        if (this.pixelSize != 4) throw "please, only use this when pixelsize is 4";

        let image = new Bitmap(this.width, this.height, 4);
        for (let y = 0; y < this.height; y++) {
            for (let x = 0; x < this.width; x++) {
                let pixel = this.get(x, y);
                let avg = (pixel[0] + pixel[1] + pixel[2]) / 3;
                image.set(x, y, [avg, avg, avg, 255]);
            }
        }
        return image;
    }

    toRGBA(): Bitmap {
        // if (this.pixelSize != 1) throw "please, only use this when pixelsize is 1"

        return this;

        // let image = new Texture(this.width, this.height, 4);
        // for (let y = 0; y < this.height; y++) {
        //     for (let x = 0; x < this.width; x++) {
        //         let pixel = this.get(x,y);
        //         let val = pixel[0];
        //         image.set(x, y, [val, val, val, 255]);
        //     }
        // }
        // return image;
    }

    /**
     * Do a bucketfill (like the ms-paint tool)
     */
    bucketFill(start: Vector2, color: Color, diagonals = false) : void {

        let startColor = this.get(start.x, start.y);
        let fillColor = color.toInt();

        let visitCondition = (val: number) : boolean => {
            let color = this.getWithIndex(val);
            return color[0] == startColor[0] && color[1] == startColor[1] && color[2] == startColor[2] && color[3] == startColor[3];
        }

        let visitAction = (val: number) => {
            this.setWithIndex(val, fillColor);
        }

        let getNeighbors: (val: number) => Array<number>;

        if (diagonals) {
            getNeighbors = this.getNbIndices8.bind(this)
        } else {
            getNeighbors = this.getNbIndices.bind(this)
        }

        this.bucketFillCustom(start, visitCondition, visitAction, getNeighbors);
    }


    /**
     * Do a custom bucketfill (like the ms-paint tool)
     * @param image 
     * @param start 
     * @param visitCondition if this returns true, we should visit the pixel with this index 
     * @param visitAction what to do at a visit
     * @param getNeighbors how to get the neighoring indices
     */
    bucketFillCustom(
        start: Vector2, 
        visitCondition: (index: number) => boolean, 
        visitAction: (index: number) => void, 
        getNeighbors: (val: number) => Array<number>) {

        let checked = new Set<number>();
        let toVisit = new Array<number>();

        let startIndex = this.vecToIndex(start.x, start.y); 

        toVisit.push(startIndex);
        checked.add(startIndex);

        while (toVisit.length > 0) {
            let cursor = toVisit.pop()!;
            
            visitAction(cursor);

            for (let nb of getNeighbors(cursor)) {
                if (checked.has(nb)) continue;
                checked.add(nb);
                if (!visitCondition(nb)) continue;
                toVisit.push(nb);
            }
        }
    }
}
