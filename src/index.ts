import { BufferReader } from './buffer-reader.class.js';
import type { Group, Property, Segment, SegmentFlag } from './models/tdms.model';

// eslint-disable-next-line complexity, sonarjs/cognitive-complexity
export function parse(buffer: ArrayBuffer): Array<Segment> {
    const reader: BufferReader = new BufferReader(buffer);

    const segments: Array<Segment> = new Array<Segment>();

    while (reader.index() < buffer.byteLength) {
        const segmentTag: string | null = reader.readString(4);
        if (segmentTag != 'TDSm') {
            continue;
        }

        const segmentFlagValue: number | null = reader.readInt32();
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

        const segmentVersion: number | null = reader.readInt32();
        const segmentOffset: bigint = reader.readInt64() || 0n;
        const rawDataOffset: bigint = reader.readInt64() || 0n;

        if (typeof segmentVersion != 'number') {
            continue;
        }

        const segment: Segment = {
            groups: new Array<Group>(),
            startIndex: 0,
            length: segmentOffset + 28n,
            flag: segmentFlag,
            version: segmentVersion,
            rawDataOffset: rawDataOffset + 28n,
        };

        reader.setBigEndian(segment.flag.bigEndian);

        const groupsCount: number = reader.readInt32() || 0;

        for (let i: number = 0; i < groupsCount; i++) {
            const pathLength: number | null = reader.readInt32();
            if (typeof pathLength != 'number') {
                continue;
            }
            const path: string | undefined = reader.readString(pathLength)?.replaceAll('\'', '');
            if (typeof path != 'string') {
                continue;
            }

            const rawDataIndexInfoLength: number | null = reader.readInt32();
            if (typeof rawDataIndexInfoLength != 'number') {
                continue;
            }

            const group: Group = {
                path,
                properties: new Array<Property>(),
                rawDataCount: null,
                rawDataType: null,
                rawData: null,
            };

            if (rawDataIndexInfoLength == 20) {
                const rawDataType: number | null = reader.readInt32();
                const rawDataDimension: number | null = reader.readInt32();
                const rawDataCount: bigint | null = reader.readInt64();

                if (typeof rawDataType == 'number') {
                    group.rawDataType = rawDataType;
                }
                if (typeof rawDataCount == 'bigint' && typeof rawDataDimension == 'number') {
                    group.rawDataCount = rawDataCount * BigInt(rawDataDimension);
                }
            }

            const propsCount: number | null = reader.readInt32();

            if (typeof propsCount == 'number' && propsCount > 0) {
                for (let propIndex: number = 0; propIndex < propsCount; propIndex++) {
                    const propNameLength: number | null = reader.readInt32();
                    if (typeof propNameLength != 'number') {
                        continue;
                    }
                    const propName: string | null = reader.readString(propNameLength);
                    if (typeof propName != 'string') {
                        continue;
                    }

                    const propType: number | null = reader.readInt32();
                    if (propType == 0x20) {
                        const stringLength: number | null = reader.readInt32();
                        if (typeof stringLength == 'number') {
                            if (stringLength > 0) {
                                const propValue: string | null = reader.readString(stringLength);
                                if (typeof propValue == 'string') {
                                    group.properties.push({
                                        name: propName,
                                        value: propValue,
                                    });
                                }
                            } else {
                                group.properties.push({
                                    name: propName,
                                    value: '',
                                });
                            }
                        }
                    } else if (propType == 0x0A) {
                        const propValue: number | null = reader.readFloat64();
                        if (typeof propValue == 'number') {
                            group.properties.push({
                                name: propName,
                                value: propValue,
                            });
                        }
                    } else if (propType == 0x44) {
                        const timestampFrags: bigint | null = reader.readUint64();
                        const timestampSeconds: bigint | null = reader.readInt64();

                        if (typeof timestampFrags == 'bigint' && typeof timestampSeconds == 'bigint') {
                            const epoch: number = new Date('1904-01-01T00:00:00Z').getTime();

                            const timestamp: bigint = BigInt(epoch) + ((timestampSeconds + (timestampFrags / BigInt(2 ** 64))) * 1000n);
                            const date: Date = new Date(Number(timestamp));
                            group.properties.push({
                                name: propName,
                                value: date,
                            });
                        }
                    } else if (propType == 0x03) {
                        const value: number | null = reader.readInt32();
                        if (typeof value == 'number') {
                            group.properties.push({
                                name: propName,
                                value,
                            });
                        }
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
                    if (group.rawDataType == 0x0A) {
                        for (let i: number = 0; i < group.rawDataCount; i++) {
                            group.rawData.push(reader.readFloat64());
                        }
                    }
                }
            }
        }
        segments.push(segment);
    }

    return segments;
}
