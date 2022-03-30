import { IO } from "./IO";

export namespace WebIO {
    export async function postJson(url: string, json: any): Promise<Response> {
        let res = await fetch(url, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(json),
        });
        return res;
    }

    /**
     * Shorthand
     * Fetch a url, and parse the response as json. will return empty object on encountering negative network responses
     */
    export async function getJson(url: string, headers = {}): Promise<any> {
        let res = await fetch(url, { headers });
        if (!res.ok) {
            return {};
        }
        let data = await res.json();
        return data;
    }

    /**
     * Shorthand
     * Fetch a url, and parse the response as text. will return empty string on encountering negative network responses
     */
    export async function getText(url: string): Promise<string> {
        let res = await fetch(url);
        if (!res.ok) {
            return "";
        }
        let data = await res.text();
        return data;
    }

    /**
     * Shorthand
     * Fetch a url, and parse the response as blobl. will return empty blob on encountering negative network responses
     */
    export async function getBlob(url: string): Promise<Blob> {
        let res = await fetch(url);
        if (!res.ok) {
            return new Blob();
        }
        let data = await res.blob();
        return data;
    }

    /**
     * Fetch a url as a blob, then process it to ImageData
     * DOES NOT HANDLE ERRORS
     *
     * @param url
     * @returns
     */
    export async function getImage(url: string): Promise<ImageData> {
        let blob = await getBlob(url);
        let res = loadImageFromBlob(blob).catch((e) => {
            return new ImageData(0, 0);
        });
        return res;
    }

    export async function readFileAsText(file: File): Promise<string | ArrayBuffer | null> {
        return new Promise((resolve, reject) => {
            var fr = new FileReader();
            fr.onload = () => {
                resolve(fr.result);
            };
            fr.onerror = reject;
            fr.readAsText(file);
        });
    }

    /**
     * A new approach, this might be faster
     */
    export async function getImageFast(
        url: string,
        signal?: AbortSignal,
    ): Promise<HTMLImageElement> {
        return new Promise((success, failure) => {
            fetch(url, { signal })
                .then((res) => {
                    return res.arrayBuffer();
                })
                .then((buffer) => {
                    let image = new Image();
                    image.src = "data:image/png;base64," + arrayBuffer2Base64(buffer);
                    image.onload = () => success(image);
                })
                .catch((e) => {
                    failure(e);
                });
        });
    }

    /////////////////////////////////////////////////////////////////////////// Private

    function loadImageFromBlob(blob: Blob): Promise<ImageData> {
        return new Promise((resolve, reject) => {
            let reader = new FileReader();
            reader.readAsDataURL(blob);
            reader.onload = () =>
                loadImageHelper1(reader).then(
                    (imageData) => resolve(imageData),
                    (error) => reject(error),
                );
        });
    }

    function loadImageHelper1(fileReader: FileReader): Promise<ImageData> {
        return new Promise(function (resolve, reject) {
            let img = document.createElement("img") as HTMLImageElement;
            img.src = fileReader.result as string;
            img.crossOrigin = "Anonymous";

            img.onload = () => resolve(loadImageHelper2(img));
            img.onerror = () => reject(new Error(`Script load error for ${img}`));
        });
    }

    function loadImageHelper2(image: HTMLImageElement): ImageData {
        // turn it into image data by building a complete canvas and sampling it
        let canvas = document.createElement("canvas")!;
        canvas.width = image.width;
        canvas.height = image.height;
        let ctx = canvas.getContext("2d")!;
        ctx.drawImage(image, 0, 0);
        let data = ctx.getImageData(0, 0, image.width, image.height);
        canvas.parentNode?.removeChild(canvas);
        return data;
    }
}

/**
 * For ways of putting data into the browser
 */
export namespace WebInput {
    export function askForFile(file: string, callback: (files: FileList | null) => void) {
        var e = document.createElement("input");
        e.setAttribute("type", "file");
        e.setAttribute("multiple", "");
        e.onchange = () => {
            callback(e.files);
        };
        document.body.appendChild(e);
        e.click();
        document.body.removeChild(e);
        e.remove();
    }
}

// from https://gist.github.com/jonleighton/958841
export function arrayBuffer2Base64(arrayBuffer: ArrayBuffer) {
    let base64 = "";
    const encodings = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";

    const bytes = new Uint8Array(arrayBuffer);
    const byteLength = bytes.byteLength;
    const byteRemainder = byteLength % 3;
    const mainLength = byteLength - byteRemainder;

    let a;
    let b;
    let c;
    let d;
    let chunk;

    // Main loop deals with bytes in chunks of 3
    for (let i = 0; i < mainLength; i += 3) {
        // Combine the three bytes into a single integer
        chunk = (bytes[i] << 16) | (bytes[i + 1] << 8) | bytes[i + 2];

        // Use bitmasks to extract 6-bit segments from the triplet
        a = (chunk & 16515072) >> 18; // 16515072 = (2^6 - 1) << 18
        b = (chunk & 258048) >> 12; // 258048   = (2^6 - 1) << 12
        c = (chunk & 4032) >> 6; // 4032     = (2^6 - 1) << 6
        d = chunk & 63; // 63       = 2^6 - 1

        // Convert the raw binary segments to the appropriate ASCII encoding
        base64 += encodings[a] + encodings[b] + encodings[c] + encodings[d];
    }

    // Deal with the remaining bytes and padding
    if (byteRemainder === 1) {
        chunk = bytes[mainLength];

        a = (chunk & 252) >> 2; // 252 = (2^6 - 1) << 2

        // Set the 4 least significant bits to zero
        b = (chunk & 3) << 4; // 3   = 2^2 - 1

        base64 += `${encodings[a]}${encodings[b]}==`;
    } else if (byteRemainder === 2) {
        chunk = (bytes[mainLength] << 8) | bytes[mainLength + 1];

        a = (chunk & 64512) >> 10; // 64512 = (2^6 - 1) << 10
        b = (chunk & 1008) >> 4; // 1008  = (2^6 - 1) << 4

        // Set the 2 least significant bits to zero
        c = (chunk & 15) << 2; // 15    = 2^4 - 1

        base64 += `${encodings[a]}${encodings[b]}${encodings[c]}=`;
    }
    return base64;
}
