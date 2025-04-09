export interface Group {
    path: string;
    properties: Map<string, string | number | Date>;
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
    length: bigint;
    rawDataOffset: bigint;
    flag: SegmentFlag;
}

export enum DataType {
    Void = 0x00,
    Int8 = 0x01,
    Int16 = 0x02,
    Int32 = 0x03,
    Int64 = 0x04,
    Uint8 = 0x05,
    Uint16 = 0x06,
    Uint32 = 0x07,
    Uint64 = 0x08,
    Float32 = 0x09,
    Float64 = 0x0A,
    ExtendedFloat = 0x0B,
    Float32WithUnit = 0x19,
    Float64WithUnit = 0x1A,
    ExtendedFloatWithUnit = 0x1B,
    String = 0x20,
    Boolean = 0x21,
    TimeStamp = 0x44,
    FixedPoint = 0x4F,
    ComplexSingleFloat = 0x08000C,
    ComplexDoubleFloat = 0x10000D,
    DaqmxRawData = 0xFFFFFFFF,
}
