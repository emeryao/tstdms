export class BufferReader {

    private offset: number = 0;

    private bigEndian: boolean = false;

    private readonly buffer: ArrayBuffer;

    public constructor(buffer: ArrayBuffer) {
        this.buffer = buffer;
    }

    public index(): number {
        return this.offset;
    }

    public setBigEndian(bigEndian: boolean = true): void {
        this.bigEndian = bigEndian;
    }

    public readBytes(length: number = 1): ArrayBuffer | null {
        if (length < 1 || !Number.isInteger(length)) {
            return null;
        }

        try {
            const bytes: ArrayBuffer = this.buffer.slice(this.offset + 0, this.offset + length);
            this.offset += length;
            return bytes;
        } catch {
            return null;
        }
    }

    public readString(bytes: number): string | null {
        const buffer: ArrayBuffer | null = this.readBytes(bytes);
        if (!buffer || buffer.byteLength < 1) {
            return null;
        }

        try {
            return new TextDecoder().decode(new Uint8Array(buffer));
        } catch {
            return null;
        }
    }

    public readInt32(bigEndian?: boolean): number | null {
        const buffer: ArrayBuffer | null = this.readBytes(4);
        if (!buffer || buffer.byteLength < 1) {
            return null;
        }

        try {
            const isBig: boolean = typeof bigEndian == 'boolean' ? bigEndian : this.bigEndian;
            return new DataView(buffer).getInt32(0, !isBig);
        } catch {
            return null;
        }
    }

    public readInt64(bigEndian: boolean = false): bigint | null {
        const buffer: ArrayBuffer | null = this.readBytes(8);
        if (!buffer || buffer.byteLength < 1) {
            return null;
        }

        try {
            const isBig: boolean = typeof bigEndian == 'boolean' ? bigEndian : this.bigEndian;
            return new DataView(buffer).getBigInt64(0, !isBig);
        } catch {
            return null;
        }
    }

    public readUint64(bigEndian: boolean = false): bigint | null {
        const buffer: ArrayBuffer | null = this.readBytes(8);
        if (!buffer || buffer.byteLength < 1) {
            return null;
        }

        try {
            const isBig: boolean = typeof bigEndian == 'boolean' ? bigEndian : this.bigEndian;
            return new DataView(buffer).getBigUint64(0, !isBig);
        } catch {
            return null;
        }
    }

    public readFloat64(bigEndian: boolean = false): number | null {
        const buffer: ArrayBuffer | null = this.readBytes(8);
        if (!buffer || buffer.byteLength < 1) {
            return null;
        }

        try {
            const isBig: boolean = typeof bigEndian == 'boolean' ? bigEndian : this.bigEndian;
            return new DataView(buffer).getFloat64(0, !isBig);
        } catch {
            return null;
        }
    }

}
