# `@labelu/formatter`

A formatter set for sinan.

## Usage

```bash
npm install @labelu/formatter
# or
yarn add @labelu/formatter
```

## basename

```typescript
import formatter from '@labelu/formatter';

formatter.format('basename', 'foo/bar/baz/asdf/quux.html');
// => 'quux.html'
```

## fileSize

> See more options in [filesize.js](https://github.com/avoidwork/filesize.js).

```typescript
import formatter from '@labelu/formatter';

formatter.format('fileSize', 265318);
// => '259.1 KB'
```

## date

> See more options in [dayjs](https://github.com/iamkun/dayjs).

```typescript
import formatter from '@labelu/formatter';

formatter.format('date', 1670916924956, {
  style: 'YYYY-MM-DD HH:mm',
});
// => '2022-12-13 15:36'
```

## extension

```typescript
import formatter from '@labelu/formatter';

formatter.format('extension', 'foo/bar/baz/asdf/quux.html');
// => 'html'
```

### Add Your Own Formatter

```typescript
import formatter from '@labelu/formatter';

formatter.add('foo', (value: string) => {
  return value + 'foo';
});
```
