# tstdms

> tdms file parser in TypeScript

[![NPM Version](https://img.shields.io/npm/v/tdms)](https://www.npmjs.com/package/tdms)

## Usage

* Install

  ```sh
  $ npm install tdms
  ```

* Import

  ```typescript
  import { type Group, parseGroup } from 'tdms';
  ```

* Parse

  * Browser

  ```typescript
  const file: File;
  const buffer: ArrayBuffer = await file.arrayBuffer();
  const groups: Array<Group> = parseGroup(buffer);
  ```

  * Node

  ```typescript
  const buffer: ArrayBuffer = fs.readFileSync('/path/to/file').buffer as ArrayBuffer;
  const groups: Array<Group> = parseGroup(buffer);
  ```

* Note

  > this package is ***esm only***

## Reference

* [🔗](https://www.ni.com/en/support/documentation/supplemental/07/tdms-file-format-internal-structure.html)

* [🔗](https://www.ni.com/en/support/documentation/supplemental/06/the-ni-tdms-file-format.html)

## Inspired by the awesome repo of [mikeobrien/TDMSReader](https://github.com/mikeobrien/TDMSReader)
