export interface Property {
    name: string;
    value: unknown;
}

export interface Group {
    path: string;
    properties: Array<Property>;
    rawDataCount: bigint | null;
    rawDataType: number | null;
    rawData: Array<unknown> | null;
}

export interface SegmentFlag {
    hasMetadata: boolean;
    hasRawData: boolean;
    hasDaqmxRawData: boolean;
    rawDataInterleaved: boolean;
    bigEndian: boolean;
    hasNewObjects: boolean;
}

export interface Segment {
    groups: Array<Group>;
    version: number;
    startIndex: number;
    length: bigint;
    rawDataOffset: bigint;
    flag: SegmentFlag;
}
