// image.ts
// author: Jos Feenstra
// purpose: wrapper around the ImageData class,
// - in order to get more functionality out of it
//
// note: named GeonImage to not collide with Image classes.

import { Domain2 } from "../math/domain";
import { FloatMatrix } from "../data/float-matrix";

// TODO : x and y are not the same as i and j, and used inconsistently. fix this.
// TODO : now that GEON is a package, we can use G.Image. the Geon suffix is not needed anymore is not needed anymore!
const acceptedKernels: number[] = [3, 5, 7, 9];
export class GeonImage {
    private data: Uint8ClampedArray;
    public readonly width: number;
    public readonly height: number;
    public readonly pixelSize: number;

    constructor(width: number, height: number, pixelSize: number = 4) {
        this.width = width;
        this.height = height;
        this.pixelSize = pixelSize;
        this.data = new Uint8ClampedArray(this.width * this.height * this.pixelSize);
        this.data.fill(0);
    }

    static fromImageData(id: ImageData): GeonImage {
        let image = new GeonImage(id.width, id.height);
        image.setData(id.data);
        return image;
    }

    toImageData(): ImageData {
        // imagedata requires pixelsize of 4.
        if (this.pixelSize != 4) throw "pixelsize must be 4 for toImageData to work";
        return new ImageData(this.data, this.width, this.height);
    }

    setData(data: Uint8ClampedArray) {
        if (data.length != this.height * this.width * this.pixelSize)
            throw "data.length does not match width * height ";

        this.data = data;
    }

    clone() {
        let image = new GeonImage(this.width, this.height, this.pixelSize);
        image.setData(this.data);
        return image;
    }

    fill(pixel: number[]): GeonImage {
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

    flipHor(): GeonImage {
        let image = new GeonImage(this.width, this.height, this.pixelSize);
        for (let i = 0; i < this.height; i++) {
            for (let j = 0; j < this.width; j++) {
                let jMirror = this.width - 1 - j;
                image.set(j, i, this.get(jMirror, i));
            }
        }
        return image;
    }

    flipVer(): GeonImage {
        let image = new GeonImage(this.width, this.height, this.pixelSize);
        for (let i = 0; i < this.height; i++) {
            let iMirror = this.height - 1 - i;
            for (let j = 0; j < this.width; j++) {
                image.set(j, i, this.get(j, iMirror));
            }
        }
        return image;
    }

    public applyKernel(kernel: FloatMatrix): GeonImage {
        // determine kernel size
        let size = kernel.count();
        let radius = size / 2 - 0.5;
        let image = new GeonImage(this.width - radius * 2, this.height - radius * 2, this.pixelSize);

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

    apply(filler: Function): GeonImage {
        let copy = new GeonImage(this.width, this.height, this.pixelSize);

        for (let y = 0; y < this.height; y++) {
            for (let x = 0; x < this.width; x++) {
                copy.set(x, y, filler(x, y));
            }
        }
        return copy;
    }

    applyNMS(): GeonImage {
        // determine kernel size
        let size = 3;
        let radius = size / 2 - 0.5;
        let copy = new GeonImage(this.width - radius * 2, this.height - radius * 2, this.pixelSize);

        // old image space
        for (let i = radius; i < this.width - radius; i++) {
            for (let j = radius; j < this.height - radius; j++) {
                // let pixel = this.getWithKernel(i, j, kernel, radius)
                // copy.set(i-radius, j-radius, pixel);
            }
        }

        // img.eachPixel(3, function(x, y, c, n) {
        //     if (n[1][1] > n[0][1] && n[1][1] > n[2][1]) {
        //         copy.data[x][y] = n[1][1];
        //     } else {
        //         copy.data[x][y] = 0;
        //     }
        //     if (n[1][1] > n[0][2] && n[1][1] > n[2][0]) {
        //         copy.data[x][y] = n[1][1];
        //     } else {
        //         copy.data[x][y] = 0;
        //     }
        //     if (n[1][1] > n[1][0] && n[1][1] > n[1][2]) {
        //         copy.data[x][y] = n[1][1];
        //     } else {
        //         copy.data[x][y] = 0;
        //     }
        //     if (n[1][1] > n[0][0] && n[1][1] > n[2][2]) {
        //         return copy.data[x][y] = n[1][1];
        //     } else {
        //         return copy.data[x][y] = 0;
        //     }
        // });
        return copy;
    }

    private getWithKernel(i: number, j: number, kernel: FloatMatrix, radius: number): number[] {
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

    scale(scaleX: number, scaleY: number): GeonImage {
        // scale the image to a new width and height, using nearest neighbour
        return this.resize(Math.round(this.width * scaleX), Math.round(this.height * scaleY));
    }

    resize(width: number, height: number): GeonImage {
        // resize the image to a new width and height, using nearest neighbour
        const image = new GeonImage(width, height, this.pixelSize);
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
    buffer(width: number, height: number): GeonImage {
        // resize the image to a new width and height, using nearest neighbour
        const image = new GeonImage(width, height, this.pixelSize);
        const old = this;

        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                // console.log(x, y);
                let pixel = old.includes(x, y) ? old.get(x, y) : [0, 0, 0, 255];
                image.set(x, y, pixel);
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

    trim(x1: number, y1: number, x2: number, y2: number): GeonImage {
        // return a hardcopy of this particular window
        const imageWidth = x2 - x1;
        const imageHeight = y2 - y1;

        const image = new GeonImage(imageWidth, imageHeight, this.pixelSize);

        for (let y = 0; y < imageHeight; y++) {
            for (let x = 0; x < imageWidth; x++) {
                let pixel = this.get(x + x1, y + y1);
                image.set(x, y, pixel);
            }
        }

        return image;
    }

    toGreyscale(): GeonImage {
        if (this.pixelSize != 4) throw "please, only use this when pixelsize is 4";

        let image = new GeonImage(this.width, this.height, 4);
        for (let y = 0; y < this.height; y++) {
            for (let x = 0; x < this.width; x++) {
                let pixel = this.get(x, y);
                let avg = (pixel[0] + pixel[1] + pixel[2]) / 3;
                image.set(x, y, [avg, avg, avg, 255]);
            }
        }
        return image;
    }

    toRGBA(): GeonImage {
        // if (this.pixelSize != 1) throw "please, only use this when pixelsize is 1"

        return this;

        // let image = new GeonImage(this.width, this.height, 4);
        // for (let y = 0; y < this.height; y++) {
        //     for (let x = 0; x < this.width; x++) {
        //         let pixel = this.get(x,y);
        //         let val = pixel[0];
        //         image.set(x, y, [val, val, val, 255]);
        //     }
        // }
        // return image;
    }
}
