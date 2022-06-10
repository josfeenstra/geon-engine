// note: this wont always work, but it does in most cases
// todo: implement proper hashtable
export class HashTable<V> {
    data: Map<string, V>;

    constructor() {
        this.data = new Map<string, V>();
    }

    private stringify(key: any): string {
        return key.toString();
    }

    set(key: any, value: V) {
        return this.data.set(this.stringify(key), value);
    }

    has(key: any): boolean {
        return this.data.has(this.stringify(key));
    }

    get(key: any) {
        return this.data.get(this.stringify(key));
    }
}
