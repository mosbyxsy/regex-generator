import { bracketRecognizers, simpleRecognizers } from './recognizer-data';

export type Range = readonly [start: number, end: number];

export interface Match {
    name: string;
    ranges: Range[];
    patterns: string[];
    priority: number;
    detail?: string;
    center?: boolean;
    derived?: [string, string];
}

export const escapeRegex = (text: string) => text.replace(/[|.\\^$\[\]{}()*?+]/g, '\\$&');
export const overlaps = ([a, b]: Range, [c, d]: Range) => (a <= c && b >= c) || (c <= a && d >= a);
export const first = (match: Match) => match.ranges[0][0];
export const last = (match: Match) => match.ranges.at(-1)![1];

export function casePattern(pattern: string, mode: 'both' | 'lower' | 'upper' = 'both') {
    let output = pattern;
    for (const [, original, contents] of pattern.matchAll(/\\\[|(\[((?:[^\\]|\\.)*?)\])/g)) {
        if (!contents?.trim()) continue;
        const replacements = new Map<string, string[]>();
        for (const [span, from, to] of contents.matchAll(/\\[a-zA-Z]|([A-Za-z])(?:-([A-Za-z]))?/g)) {
            if (!from || (to && /[a-z]/.test(from) !== /[a-z]/.test(to))) continue;
            const replacement = (mode === 'lower' ? '' : span.toUpperCase()) +
                (mode === 'upper' ? '' : span.toLowerCase());
            if (!replacements.has(replacement)) replacements.set(replacement, []);
            replacements.get(replacement)!.push(span);
        }
        let converted = contents;
        for (const [replacement, spans] of replacements) {
            const index = Math.min(...spans.map(span => converted.indexOf(span)));
            for (const span of spans) converted = converted.replaceAll(span, '');
            converted = converted.slice(0, Math.max(0, index)) + replacement + converted.slice(Math.max(0, index));
        }
        output = output.replaceAll(original, () => '[' + converted + ']');
    }
    return output;
}

function simpleMatches(input: string, name: string, pattern: string, search?: string, kind = 'simple'): Match[] {
    if (kind === 'echo') {
        return Array.from(input.matchAll(new RegExp(pattern, 'gu')), result => ({
            name, ranges: [[result.index, result.index + result[0].length - 1]],
            patterns: [name === 'Repeating character' ? escapeRegex(result[1]) + '+' : escapeRegex(result[0])],
            priority: name === 'Character' ? 10 : 0, detail: result[0],
        }));
    }
    const output = casePattern(pattern);
    const regex = new RegExp(search?.replaceAll('%s', () => output) ?? '(' + output + ')', 'g');
    return [...input.matchAll(regex)].filter(result => result[1]?.length).map(result => {
        const start = result.index + result[0].indexOf(result[1]);
        return { name, ranges: [[start, start + result[1].length - 1]], patterns: [output], priority: 0 };
    });
}

function bracketMatches(input: string, { name, start, end, centers }: typeof bracketRecognizers[number]): Match[] {
    const matches = new Map<string, Match>();
    const offsets = new Set([0]);
    for (const offset of offsets) {
        for (const [detail, pattern] of centers) {
            const regex = new RegExp('(' + start + ')(' + pattern + ')(' + end + ')', 'g');
            regex.lastIndex = offset;
            for (const result of input.matchAll(regex)) {
                const opening = result.index;
                const closing = opening + result[1].length + result[2].length;
                const outer: Match = { name, priority: 0, patterns: [start, end],
                    ranges: [[opening, closing - result[2].length - 1], [closing, opening + result[0].length - 1]] };
                const inner: Match = { name, detail, center: true, priority: 0, patterns: [pattern],
                    ranges: [[opening + result[1].length, closing - 1]] };
                for (const match of [outer, inner]) matches.set(JSON.stringify(match), match);
                offsets.add(opening + 1);
                offsets.add(opening + result[1].length + 1);
            }
        }
    }
    return [...matches.values()];
}

export function findMatches(input: string): Match[] {
    const matches = [
        ...simpleRecognizers.flatMap(r => simpleMatches(input, r.name, r.pattern, r.search, r.kind)),
        ...bracketRecognizers.flatMap(r => bracketMatches(input, r)),
    ].sort((a, b) => first(a) - first(b) || last(b) - last(a));
    const groups = Map.groupBy(matches, match => match.name);
    const singles = matches.filter(match => match.ranges.length === 1);
    const derived = new Map<string, Match[]>();
    const echoNames = new Set(simpleRecognizers.filter(r => r.kind === 'echo').map(r => r.name));
    for (const group of groups.values()) {
        let previous: Match[] = [];
        for (let i = 1; i < group.length; i++) {
            const left = group[i - 1];
            const right = group[i];
            const gap = first(right) > last(left) + 1
                ? singles.filter(match => first(match) > last(left) && last(match) < first(right)) : [];
            const rightmost = gap.reduce((rightmost, match) => Math.max(rightmost, last(match)), -1);
            const full = gap.filter(match => first(match) === first(gap[0]) && last(match) === rightmost);
            const separator = previous.find(a => full.some(b =>
                a.name === b.name && (!echoNames.has(a.name) || a.patterns[0] === b.patterns[0])));
            if (separator) {
                const start = group[i - 2];
                const name = 'Combination [' + start.name + ' + ' + separator.name + ']';
                const pattern = '(' + start.patterns[0] + '(' + separator.patterns[0] + left.patterns[0] + ')+)';
                const key = JSON.stringify([name, pattern]);
                if (!derived.has(key)) derived.set(key, simpleMatches(input, name, pattern).map(match =>
                    ({ ...match, derived: [start.name, separator.name] })));
            }
            previous = full;
        }
    }
    return matches.concat(...derived.values());
}

export interface Part { pattern: string; match?: Match; literal?: string; title?: string }

export function combine(input: string, selected: Match[], flags: string): Part[] {
    const onlyPatterns = flags.includes('P');
    const whole = flags.includes('W');
    const ranges = selected.flatMap(match => match.ranges.map((range, i) =>
        ({ range, match, pattern: casePattern(match.patterns[i], flags.includes('L') ? 'lower' : 'both') })))
        .sort((a, b) => a.range[0] - b.range[0]);
    const parts: Part[] = [];
    function gap(start: number, end: number) {
        const literal = input.slice(start, end);
        parts.push(onlyPatterns ? { pattern: '.*', title: 'anything' } : { pattern: escapeRegex(literal), literal });
    }
    if (whole) parts.push({ pattern: '^', title: 'Start of input' });
    if (!ranges.length) gap(0, input.length);
    let cursor = 0;
    for (const [index, { range, pattern, match }] of ranges.entries()) {
        if (cursor < range[0] && (index > 0 || whole || !onlyPatterns)) gap(cursor, range[0]);
        parts.push({ pattern, match });
        cursor = range[1] + 1;
    }
    if (ranges.length && cursor < input.length && (whole || !onlyPatterns)) gap(cursor, input.length);
    if (whole) parts.push({ pattern: '$', title: 'End of input' });
    return parts;
}



