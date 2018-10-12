export function commonPrefix(strings: string[]): string {
  if (strings.length === 0) {
    return '';
  }
  let result = '';
  while (result.length < strings[0].length) {
    // try one more character
    const next = result + strings[0][result.length];
    if (strings.every(str => str.startsWith(next))) {
      result = next;
    } else {
      break;
    }
  }
  return result;
}

String.prototype.capitalize = function(this: string): string {
  return this[0].toUpperCase() + this.slice(1);
};
