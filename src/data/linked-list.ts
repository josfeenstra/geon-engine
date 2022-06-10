//
// note: taken from
// https://medium.com/everything-javascript/implementing-a-hash-table-in-javascript-29aca1edfe2b
// NOTE: Not used anymore, but i still find it interesting, so leave it here

export class LinkedList {
    private head: any = null;

    empty(): boolean {
        if (this.head) return false;
        return true;
    }

    last(): ListNode {
        var cursor: ListNode = this.head;
        while (cursor.getNext()) {
            cursor = cursor.getNext();
        }
        return cursor;
    }

    find(key: string): any {
        var cursor: ListNode = this.head;
        while (cursor) {
            if (cursor.getKey() == key) return cursor.value();
            cursor = cursor.getNext();
        }
        return false;
    }

    insert(value: any, key: string): void {
        var node: ListNode = new ListNode(value, key);
        if (!this.head) this.head = node;
        else this.last().next(node);
    }

    print(): void {
        var cursor: ListNode = this.head;
        while (cursor) {
            console.log(cursor.value() + " ");
            cursor = cursor.getNext();
        }
    }
}

//node
class ListNode {
    private val: any;
    private key: string;
    private nextNode: any;

    constructor(value: any, key: string) {
        this.nextNode = null;
        this.key = key;
        this.val = value;
    }

    getNext(): ListNode {
        return this.nextNode;
    }

    next(node: ListNode) {
        this.nextNode = node;
    }

    getKey(): string {
        return this.key;
    }

    value(): any {
        return this.val;
    }
}
