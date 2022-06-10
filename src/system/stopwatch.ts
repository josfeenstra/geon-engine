export class Stopwatch {
    private constructor(private oldTime: number, private newTime: number) {}

    static new() {
        let s = new Stopwatch(0, 0);
        s.time();
        return s;
    }

    time() {
        this.newTime = this.getTime();
        let timePast = this.newTime - this.oldTime;
        this.oldTime = this.newTime;
        return timePast;
    }

    log(event: string) {
        console.log(`${event} took: ${this.time()} ms`);
    }

    private getTime() {
        return new Date().getTime();
    }
}
