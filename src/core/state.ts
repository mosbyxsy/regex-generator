import { diffArrays } from 'diff';
import { findMatches, first, overlaps, type Match, type Range } from './regex';

export const maxInput = 1000;
export const sample = "2020-03-12T13:34:56.123Z INFO  [org.example.Class]: This is a #simple #logline containing a 'value'.";

export function readSetting(key: string) {
    try { return localStorage.getItem(key); } catch { return null; }
}

export function writeSetting(key: string, value: string) {
    try { localStorage.setItem(key, value); } catch { /* Storage may be disabled. */ }
}

export const flagFields = [
    ['P', 'rg_onlymatches', 'recognizer.combiner.options.onlyPatterns'],
    ['W', 'rg_matchwholeline', 'recognizer.combiner.options.matchWholeLine'],
    ['L', 'rg_generateLowerCase', 'recognizer.combiner.options.generateLowerCase'],
    ['i', 'rg_caseinsensitive', 'code.generator.options.caseInsensitive'],
    ['s', 'rg_dotmatcheslinebreakes', 'code.generator.options.dotMatchesLineBreaks'],
    ['m', 'rg_multiline', 'code.generator.options.multiline'],
] as const;

export interface State { input: string; matches: Match[]; selected: Match[]; flags: string; groups: string }

export const intersects = (a: Match, b: Match) =>
    a.ranges.some(left => b.ranges.some(right => overlaps(left, right)));

export function restore(url: URL, defaults: string): State {
    const params = url.searchParams;
    const raw = params.get('sampleText');
    const input = (raw?.trim() ? raw : sample).slice(0, maxInput);
    const matches = findMatches(input);
    const requested = new Map<number, string>();
    for (const selection of (params.get('selection') ?? '').split(',')) {
        const [position, name, extra] = selection.split('|');
        if (extra !== undefined || !/^\d+$/.test(position) || !name) continue;
        try { requested.set(Number(position), decodeURIComponent(name)); } catch { continue; }
    }
    const selected: Match[] = [];
    for (const [position, name] of requested) {
        const match = matches.find(match => first(match) === position && match.name === name);
        if (match && !selected.some(previous => intersects(match, previous))) selected.push(match);
    }
    const flags = params.get('flags') ?? defaults;
    return { input, matches, selected, flags: flagFields.map(([flag]) => flag).filter(flag => flags.includes(flag)).join(''),
        groups: params.get('capGroups') ?? '' };
}

export function share(state: State, location: URL) {
    const url = new URL(location);
    const selection = state.selected.map(match => encodeURIComponent(first(match) + '|' + match.name)).join(',');
    const groups = state.groups.split(',').map(group => encodeURIComponent(group)).join(',');
    url.search = '?sampleText=' + encodeURIComponent(state.input.toWellFormed()) + '&flags=' + state.flags +
        (selection ? '&selection=' + selection : '') + (groups ? '&capGroups=' + groups : '');
    const capturingGroups = location.searchParams.get('capturing-groups')?.toLowerCase();
    if (capturingGroups === 'true' || capturingGroups === 'false') url.search += '&capturing-groups=' + capturingGroups;
    return url;
}

export function addRange([start, end]: Range, index: number, length: number): Range[] {
    if (index < start) return [[start + length, end + length]];
    if (index === start) return Array.from({ length: length + 1 }, (_, i) => [start + i, end + length]);
    if (index <= end) return [[start, end + length]];
    if (index === end + 1) return Array.from({ length: length + 1 }, (_, i) => [start, end + i]);
    return [[start, end]];
}

export function removeRange([start, end]: Range, index: number, length: number): Range[] {
    const last = index + length - 1;
    if (last < start) return [[start - length, end - length]];
    if (index > end) return [[start, end]];
    if (index <= start && last >= end) return [];
    if (index >= start && last <= end) return [[start, end - length]];
    if (index <= start && last > start) return [[index, end - length]];
    if (index <= end && last > end) return [[start, index - 1]];
    return [[start, end]];
}

export function sequenceEdits<T>(previous: T[], next: T[]) {
    let oldIndex = 0;
    let newIndex = 0;
    return diffArrays(previous, next).flatMap(change => {
        const length = change.value.length;
        const index = change.removed ? oldIndex : newIndex;
        if (!change.added) oldIndex += length;
        if (!change.removed) newIndex += length;
        return change.added || change.removed ? [{ index, length, add: !!change.added }] : [];
    });
}

export function editInput(state: State, input: string): State {
    const matches = findMatches(input);
    const changes = sequenceEdits(state.input.split(''), input.split(''));
    const selected = new Set<Match>();
    for (const original of state.selected) {
        let possible = original.ranges.map(range => [range]);
        for (const { index, length, add } of changes) {
            possible = possible.map(ranges => ranges.flatMap(range =>
                (add ? addRange : removeRange)(range, index, length)));
        }
        const match = matches.find(match => match.name === original.name &&
            match.detail === original.detail && match.center === original.center &&
            match.patterns.join('\u0000') === original.patterns.join('\u0000') &&
            match.ranges.length === possible.length &&
            match.ranges.every(([a, b], i) => possible[i].some(([x, y]) => a === x && b === y)));
        if (match) selected.add(match);
    }
    return { ...state, input, matches, selected: [...selected] };
}



