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
  if (this.length === 0) {
    return this;
  }
  return this[0].toUpperCase() + this.slice(1);
};

String.prototype.words = function(this: string): string[] {
  // split on spaces, non-alphanumeric, or capital letters
  return this.split(/(?=[A-Z])|[\s\W_]+/)
      .filter(w => w.length > 0)
      .map(w => w.toLowerCase());
};

String.prototype.toCamelCase = function(this: string): string {
  const words = this.words();
  if (words.length === 0) {
    return this;
  }
  const result = [words[0]];
  result.push(...words.slice(1).map(w => w.capitalize()));
  return result.join('');
};

String.prototype.toKebabCase = function(this: string): string {
  const words = this.words();
  if (words.length === 0) {
    return this;
  }
  return words.join('-');
};

String.prototype.toSnakeCase = function(this: string): string {
  const words = this.words();
  if (words.length === 0) {
    return this;
  }
  return words.join('_');
};
