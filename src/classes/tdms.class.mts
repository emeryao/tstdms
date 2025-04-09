import { DataType, type Group, type Segment, type SegmentFlag } from '../models/tdms.model.mjs';
import { BufferReader } from './buffer-reader.class.mjs';

export class Tdms {

    private readonly reader: BufferReader;

    private readonly segments: Array<Segment> = new Array<Segment>();

    private readonly segmentTag: string = 'TDSm';

    private readonly segmentLeadinLength: number = 28;

    // eslint-disable-next-line sonarjs/cognitive-complexity
    public constructor(buffer: ArrayBuffer) {
        this.reader = new BufferReader(buffer);

        while (this.reader.index() < buffer.byteLength) {
            const segmentTag: string | null = this.reader.readString(4);
            if (segmentTag != this.segmentTag) {
                continue;
            }

            const segmentFlagValue: number | null = this.reader.readInt32();
            if (typeof segmentFlagValue != 'number') {
                continue;
            }

            const segmentFlag: SegmentFlag = {
                hasMetadata: ((segmentFlagValue >> 1) & 1) == 1,
                hasNewObjects: ((segmentFlagValue >> 2) & 1) == 1,
                hasRawData: ((segmentFlagValue >> 3) & 1) == 1,
                rawDataInterleaved: ((segmentFlagValue >> 5) & 1) == 1,
                bigEndian: ((segmentFlagValue >> 6) & 1) == 1,
                hasDaqmxRawData: ((segmentFlagValue >> 7) & 1) == 1,
            };

            const segmentVersion: number | null = this.reader.readInt32();
            const segmentOffset: bigint = this.reader.readInt64() || 0n;
            const rawDataOffset: bigint = this.reader.readInt64() || 0n;

            if (typeof segmentVersion != 'number') {
                continue;
            }

            const segment: Segment = {
                groups: new Array<Group>(),
                length: segmentOffset + BigInt(this.segmentLeadinLength),
                flag: segmentFlag,
                version: segmentVersion,
                rawDataOffset: rawDataOffset + BigInt(this.segmentLeadinLength),
            };

            this.reader.setBigEndian(segment.flag.bigEndian);

            const groupsCount: number = this.reader.readInt32() || 0;

            for (let i: number = 0; i < groupsCount; i++) {
                const pathLength: number | null = this.reader.readInt32();
                if (typeof pathLength != 'number') {
                    continue;
                }
                const path: string | undefined = this.reader.readString(pathLength)?.replaceAll('\'', '');
                if (typeof path != 'string') {
                    continue;
                }

                const rawDataIndexInfoLength: number | null = this.reader.readInt32();
                if (typeof rawDataIndexInfoLength != 'number') {
                    continue;
                }

                const group: Group = {
                    path,
                    properties: new Map<string, string | number | Date>(),
                    rawDataCount: null,
                    rawDataType: null,
                    rawData: null,
                };

                if (rawDataIndexInfoLength == 20) {
                    const rawDataType: number | null = this.reader.readInt32();
                    const rawDataDimension: number | null = this.reader.readInt32();
                    const rawDataCount: bigint | null = this.reader.readInt64();

                    if (typeof rawDataType == 'number') {
                        group.rawDataType = rawDataType;
                    }
                    if (typeof rawDataCount == 'bigint' && typeof rawDataDimension == 'number') {
                        group.rawDataCount = rawDataCount * BigInt(rawDataDimension);
                    }
                }

                const propsCount: number | null = this.reader.readInt32();

                if (typeof propsCount == 'number' && propsCount > 0) {
                    for (let propIndex: number = 0; propIndex < propsCount; propIndex++) {
                        const propNameLength: number | null = this.reader.readInt32();
                        if (typeof propNameLength != 'number') {
                            continue;
                        }
                        const propName: string | null = this.reader.readString(propNameLength);
                        if (typeof propName != 'string') {
                            continue;
                        }

                        const propValue: string | number | Date | null = this.readData();
                        if (propValue !== null) {
                            group.properties.set(propName, propValue);
                        }
                    }
                }

                segment.groups.push(group);
            }

            if (!segment.flag.rawDataInterleaved) {
                const rawDataGroups: Array<Group> = segment.groups.filter(i => typeof i.rawDataCount == 'bigint' && i.rawDataCount > 0);
                if (Array.isArray(rawDataGroups) && rawDataGroups.length > 0) {
                    for (const group of rawDataGroups) {
                        if (typeof group.rawDataCount != 'bigint' || typeof group.rawDataType != 'number') {
                            continue;
                        }
                        group.rawData = [];
                        if (group.rawDataType == DataType.Float64) {
                            for (let i: number = 0; i < group.rawDataCount; i++) {
                                group.rawData.push(this.reader.readFloat64());
                            }
                        }
                    }
                }
            }

            this.segments.push(segment);
        }
    }

    public getSegments(): Array<Segment> {
        return this.segments;
    }

    public getGroups(): Array<Group> {
        if (!Array.isArray(this.segments) || this.segments.length < 1) {
            return [];
        }

        const groups: Array<Group> = this.segments.flatMap(i => i.groups);
        if (!Array.isArray(groups) || groups.length < 1) {
            return [];
        }

        const groupMap: Map<string, Group> = new Map<string, Group>();
        for (const group of groups) {
            if (groupMap.has(group.path)) {
                const groupInMap: Group | undefined = groupMap.get(group.path);
                if (typeof groupInMap == 'undefined') {
                    groupMap.set(group.path, group);
                } else {
                    for (const [propKey, propValue] of group.properties.entries()) {
                        if (!groupInMap.properties.has(propKey)) {
                            groupInMap.properties.set(propKey, propValue);
                        }
                    }
                    if (groupInMap.rawData == null && group.rawData != null) {
                        groupInMap.rawData = group.rawData;
                        groupInMap.rawDataType = group.rawDataType;
                        groupInMap.rawDataCount = group.rawDataCount;
                    }
                }
            } else {
                groupMap.set(group.path, group);
            }
        }

        return [...groupMap.values()];
    }

    private readData(): string | number | Date | null {
        const dataType: number | null = this.reader.readInt32();
        if (typeof dataType != 'number') {
            return null;
        }
        switch (dataType) {
            case DataType.String: {
                const stringLength: number | null = this.reader.readInt32();
                if (typeof stringLength != 'number') {
                    return null;
                }
                if (stringLength == 0) {
                    return '';
                }
                return this.reader.readString(stringLength);
            }
            case DataType.TimeStamp: {
                const timestampFrags: bigint | null = this.reader.readUint64();
                const timestampSeconds: bigint | null = this.reader.readInt64();
                if (typeof timestampFrags != 'bigint' || typeof timestampSeconds != 'bigint') {
                    return null;
                }

                const epoch: number = new Date('1904-01-01T00:00:00Z').getTime();
                const timestamp: bigint = BigInt(epoch) + ((timestampSeconds + (timestampFrags / BigInt(2 ** 64))) * 1000n);
                return new Date(Number(timestamp));
            }
            case DataType.Float64:
                return this.reader.readFloat64();
            case DataType.Int32:
                return this.reader.readInt32();
            default:
                break;
        }
        return null;
    }

}
