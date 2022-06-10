//
// note: thank you, stackoverflow!
// https://stackoverflow.com/questions/521295/seeding-the-random-number-generator-in-javascript

/**
 * Pseudo random number generator. based on simple fast counter (sfc32)
 */
export class Random {
    private constructor(
        private a: number,
        private b: number,
        private c: number,
        private d: number,
    ) {}

    static new(a: number, b: number, c: number, d: number) {
        return new Random(a, b, c, d);
    }

    static randomSeed() {
        return Math.random() * 393847477636;
    }

    static fromSeed(n: number) {
        var seed = n ^ 0xdeadbeef; // 32-bit seed with optional XOR value
        // Pad seed with Phi, Pi and E.
        // https://en.wikipedia.org/wiki/Nothing-up-my-sleeve_number
        var rand = Random.new(0x9e3779b9, 0x243f6a88, 0xb7e15162, seed);
        for (var i = 0; i < 15; i++) rand.get();
        return rand;
    }

    static fromRandom() {
        // stacking random for maximum randomness i guess...
        return this.fromSeed(Math.random() * 103948857);
    }

    static fromHash(seed: string) {
        var seeder = xmur3(seed);
        return this.new(seeder(), seeder(), seeder(), seeder());
    }

    get(): number {
        // sfc32
        this.a >>>= 0;
        this.b >>>= 0;
        this.c >>>= 0;
        this.d >>>= 0;
        let t = (this.a + this.b) | 0;
        this.a = this.b ^ (this.b >>> 9);
        this.b = (this.c + (this.c << 3)) | 0;
        this.c = (this.c << 21) | (this.c >>> 11);
        this.d = (this.d + 1) | 0;
        t = (t + this.d) | 0;
        this.c = (this.c + t) | 0;
        return (t >>> 0) / 4294967296;
    }
}

// not using this right now, but could be fun
function mulberry32(a: number) {
    return function () {
        var t = (a += 0x6d2b79f5);
        t = Math.imul(t ^ (t >>> 15), t | 1);
        t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
}

function xmur3(str: string) {
    for (var i = 0, h = 1779033703 ^ str.length; i < str.length; i++)
        (h = Math.imul(h ^ str.charCodeAt(i), 3432918353)), (h = (h << 13) | (h >>> 19));
    return function () {
        h = Math.imul(h ^ (h >>> 16), 2246822507);
        h = Math.imul(h ^ (h >>> 13), 3266489909);
        return (h ^= h >>> 16) >>> 0;
    };
}

/**
 * https://www.tutorialspoint.com/how-to-create-guid-uuid-in-javascript
 * @returns guid
 */
export function createGUID(rng: Random) {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
       var r = rng.get() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
       return v.toString(16);
    });
}

/**
 * https://www.tutorialspoint.com/how-to-create-guid-uuid-in-javascript
 * @returns guid
 */
export function createRandomGUID() {
    let rng = Random.fromRandom();
    return createGUID(rng);
}