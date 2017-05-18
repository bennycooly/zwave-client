
class ValueClass {
    index: number;
    type: string;
    genre: string;
    label: string;
    value: any;

    constructor(index: number) {
        this.index = index;
    }

    setValue(value: any): void {
        this.index = value.index;
        this.type = value.type;
        this.genre = value.genre;
        this.label = value.label;
        this.value = value.value;
    }
}

export { ValueClass };
