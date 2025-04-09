import { Tdms } from './classes/tdms.class.mjs';
import type { Group, Segment } from './models/tdms.model.mjs';

export * from './models/tdms.model.mjs';

export { Tdms };

export function parseSegment(buffer: ArrayBuffer): Array<Segment> {
    const tdms: Tdms = new Tdms(buffer);
    return tdms.getSegments();
}

export function parseGroup(buffer: ArrayBuffer): Array<Group> {
    const tdms: Tdms = new Tdms(buffer);
    return tdms.getGroups();
}
