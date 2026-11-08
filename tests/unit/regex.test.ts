import { expect, test } from 'vitest';
import { casePattern, combine, escapeRegex, findMatches, first, last } from '../../src/core/regex';
import { addRange, editInput, maxInput, removeRange, restore, share } from '../../src/core/state';
import { generateSnippet, languageId, languages } from '../../src/core/snippets';
import snippets from './fixtures/snippets.json';

const url = new URL('https://example.test/regex-generator/');
const stateFor = (input: string, selection = '') => {
    const link = new URL(url);
    link.searchParams.set('sampleText', input);
    if (selection) link.searchParams.set('selection', selection);
    return restore(link, 'i');
};

test.each([
    ['abc[', 'abc\\['], ['| | | 13024a.htm', '\\| \\| \\| 13024a\\.htm'],
])('escapes literal input %s', (input, expected) => {
    expect(combine(input, [], '').map(part => part.pattern).join('')).toBe(expected);
});

test('preserves selected patterns, anchors and wildcard behavior', () => {
    const model = stateFor('abc123def', '3|Number');
    expect(combine(model.input, model.selected, '').map(part => part.pattern).join('')).toBe('abc[0-9]+def');
    expect(combine(model.input, model.selected, 'P').map(part => part.pattern).join('')).toBe('[0-9]+');
    expect(combine(model.input, model.selected, 'PW').map(part => part.pattern).join('')).toBe('^.*[0-9]+.*$');
    expect(casePattern('[A-Za-z]', 'lower')).toBe('[a-z]');
    expect(casePattern('[a-zA-Z]')).toBe('[A-Za-z]');
    expect(casePattern('\\[x\\]')).toBe('\\[x\\]');
});

test.each([
    ['abc123def', 'abc1243def', 'Number', 3, 3, 6],
    ['abc123def', 'abdc123def', 'Number', 3, 4, 6],
    ['asd1231sdf', 'asd11sdf', 'Number', 3, 3, 4],
    ['s', 'sdf', 'Multiple characters', 0, 0, 2],
    ['a(sd)f', 'a(serd)f', 'Parentheses', 1, 1, 6],
    ['ab[cd]ef', 'abx[cd]ef', 'Square brackets', 2, 3, 6],
    ['😀111😀', '😀1111😀', 'Number', 2, 2, 5],
])('keeps %s selection when edited to %s', (input, updated, recognizer, start, from, to) => {
    const model = stateFor(input, start + '|' + recognizer);
    const edited = editInput(model, updated);
    expect(edited.selected.map(match => [match.name, first(match), last(match)])).toEqual([[recognizer, from, to]]);
});

test('uses inclusive UTF-16 offsets', () => {
    expect(findMatches('😀').find(match => match.name === 'Character')?.ranges).toEqual([[0, 1]]);
    expect(addRange([3, 7], 3, 2)).toEqual([[3, 9], [4, 9], [5, 9]]);
    expect(removeRange([3, 7], 5, 2)).toEqual([[3, 5]]);
});

test('restores a legacy selection and round-trips it under a Pages repository path', () => {
    const link = new URL('?sampleText=2020-03-12&flags=PWi&selection=0%7CDate', url);
    const model = restore(link, '');
    expect(model.selected.map(match => match.name)).toEqual(['Date']);
    const shared = share(model, url);
    expect(shared.pathname).toBe('/regex-generator/');
    expect(restore(shared, '')).toEqual(model);
});

test('caps oversized shared input and handles malformed selections', () => {
    const model = stateFor('x'.repeat(maxInput + 1), '0|%');
    expect(model.input.length).toBe(maxInput);
    expect(model.selected).toEqual([]);
});

test.each(snippets)('matches the upstream $name snippet with flags "$flags"', ({ name, flags, input, expected }) => {
    const language = languages.find(language => language.languageName === name)!;
    expect(generateSnippet(language, escapeRegex(input), flags).snippet).toBe(expected);
});

test('retains stable IDs for snippet accordion preferences', () => {
    expect(languageId('.abc_DEF-13 37#+xù$x\\abc')).toBe('_dot_abc_DEF_minus_13__37_sharp__plus_x_u249__u36_x_u92_abc');
});

test('recognizes all upstream built-in pattern types', async () => {
    const { simpleRecognizers, bracketRecognizers } = await import('../../src/core/recognizer-data');
    const input = '978 .345 abcd aaa INFO %20 12 2022-12-10 12:34:56 2020-03-12T13:34:56.123Z ' +
        '127.0.0.1 aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa #hashtag #112233 test@mail.com ' +
        'bla (blub) e{ve}n [mor] St"ri"ng St\'ir\'ng';
    const found = new Set(findMatches(input).map(match => match.name));
    for (const { name } of [...simpleRecognizers, ...bracketRecognizers]) expect(found.has(name), name).toBe(true);
});

test('recognizes enclosing and escaped quote alternatives', () => {
    const input = 'ab"c123\\"def4",5ghi';
    const quotes = findMatches(input).filter(match => match.name === 'String (quotation mark)');
    expect(quotes).toHaveLength(9);
    expect(quotes.filter(match => !match.center).map(match => match.ranges)).toEqual(
        [[[2, 2], [13, 13]], [[2, 2], [8, 8]], [[8, 8], [13, 13]]],
    );
});

test('generates Go snippets with the flags in upstream order', () => {
    const go = languages.find(language => language.languageName === 'Go')!;
    expect(generateSnippet(go, '[a-z]', 'ism').snippet).toContain('regexp.MustCompile("(?ism)[a-z]")');
});

test.each([
    ["'", 'r"\'"'], ['"""', "r'\"\"\"'"], ['"\'', '\'\"\'r"\'"'], ['\'"', 'r"\'"\'\"\''],
])('preserves Python raw-string quoting for %s', (input, expected) => {
    const python = languages.find(language => language.languageName === 'Python')!;
    expect(generateSnippet(python, input, 's').snippet).toContain('re.compile(' + expected + ', re.DOTALL)');
});

test.each([['aaa', 9], ['TX_RESP_Q008', 34]] as const)('matches the upstream recognition count for %s', (input, count) => {
    expect(findMatches(input)).toHaveLength(count);
});

test('recognizes an exact number and separate numeric ranges', () => {
    const matches = findMatches('abc123def4,5ghi67jkl8mno');
    expect(matches.filter(match => match.name === 'Exact number').map(match => [match.patterns[0], ...match.ranges])).toEqual([
        ['123', [3, 5]], ['67', [15, 16]],
    ]);
    expect(matches.filter(match => match.name === 'Number').map(match => match.ranges[0])).toEqual(
        [[3, 5], [9, 9], [11, 11], [15, 16], [20, 20]],
    );
});

test('preserves separated matches and the unselected content between them', () => {
    const model = stateFor('abc123abc', '0|Multiple characters,6|Multiple characters');
    expect(combine(model.input, model.selected, 'L').map(part => part.pattern).join('')).toBe('[a-z]+123[a-z]+');
    expect(combine(model.input, model.selected, 'P').map(part => part.pattern).join('')).toBe('[A-Za-z]+.*[A-Za-z]+');
});

test('generates a bracket content pattern and handles clearing all input', () => {
    const bracket = stateFor('[id]=[6]');
    const selected = [bracket.matches.find(match => match.name === 'Square brackets' && match.center && first(match) === 6)!];
    expect(combine(bracket.input, selected, '').map(part => part.pattern).join('')).toBe('\\[id\\]=\\[[^\\]]*\\]');
    const empty = editInput(stateFor('http:\\', '4|Character'), '');
    expect(empty.selected).toEqual([]);
    expect(combine(empty.input, empty.selected, '').map(part => part.pattern).join('')).toBe('');
});

test('skips empty numeric suggestions in the default log sample', () => {
    const model = restore(url, '');
    expect(model.matches.filter(match => match.name === 'Floating point number (with optional exponent)')
        .every(match => last(match) >= first(match))).toBe(true);
});
