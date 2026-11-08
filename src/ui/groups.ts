import { Popover } from 'bootstrap';
import { sequenceEdits } from '../core/state';
import { t } from '../i18n/locale';

const symbols = /(?<complete>\(\?(?:[a-zA-Z]+|[+-]?[0-9]+|&\w+|P=\w+)\))|(?<open>\((?:\?(?::|!|>|=|\||<=|P?<[a-z][a-z0-9]*>|'[a-z][a-z0-9]*'|[-a-z]+:))?)|(?<part>(?:\\.|\[(?:[^\]\\]|\\.)+\]|[^|)])(?:[+*?]+|\{\d+(?:,\d*)?\}|\{(?:\d*,)?\d+\})?)|(?<close>\)(?:[+*?]+|\{\d+(?:,\d*)?\}|\{(?:\d*,)?\d+\})?)|(?<alt>\|)/gi;

interface Group { name: string; quantifier: string; start: number; end: number }
const validName = /^(?:[A-Za-z]\w*)?$/;
const validQuantifier = /^(?:[+*?]\??|\{\d+(?:,\d*)?\}\??)?$/;

function decode(groups: string): Group[] {
    const entries: Group[] = [];
    for (const encoded of groups.split(',')) {
        const [name, quantifier, range, extra] = encoded.split('|');
        if (extra !== undefined || !range || !validName.test(name) || !validQuantifier.test(quantifier)) continue;
        const match = /^(\d+)-(\d+)$/.exec(range);
        if (!match) continue;
        const start = Number(match[1]);
        const end = Number(match[2]);
        if (start > end || end > 10000) continue;
        for (const old of entries) {
            if (end < old.start) { old.start += 2; old.end += 2; }
            else if (start <= old.start && end >= old.end) { old.start++; old.end++; }
            else if (start > old.start && end < old.end) old.end += 2;
        }
        entries.push({ name, quantifier, start, end: end + 2 });
    }
    return entries.sort((a, b) => a.start - b.start);
}

function encode(groups: Group[]) {
    return groups.map(group => group.name + '|' + group.quantifier + '|' + group.start + '-' +
        (group.end - 2 - groups.filter(other => other.start > group.start && other.end < group.end).length * 2)).join(',');
}

function tokenList(pattern: string, groups: Group[]) {
    const list = [...pattern.matchAll(symbols)].map(match => ({ text: match[0], selectable: !!match.groups?.part }));
    const brackets = groups.flatMap(group => [
        { index: group.start, text: group.name ? '(?<' + group.name + '>' : '(' },
        { index: group.end, text: ')' + group.quantifier },
    ]).sort((a, b) => a.index - b.index);
    for (const { index, text } of brackets) {
        if (index <= list.length) list.splice(index, 0, { text, selectable: false });
    }
    return list;
}

export function applyGroups(pattern: string, groups: string) {
    return groups ? tokenList(pattern, decode(groups)).map(token => token.text).join('') : pattern;
}

function removeGroup(groups: Group[], removed: Group) {
    return groups.filter(group => group !== removed).map(group => {
        const shift = (index: number) => index - Number(index > removed.start) - Number(index > removed.end);
        return { ...group, start: shift(group.start), end: shift(group.end) };
    });
}

export function transferGroups(oldPattern: string, newPattern: string, encoded: string) {
    if (!encoded || oldPattern === newPattern) return encoded;
    let groups = decode(encoded);
    const brackets = groups.flatMap(group => [group.start, group.end]);
    const tokens = (pattern: string) => [...pattern.matchAll(symbols)].map(match => match[0]);
    const edits = sequenceEdits(tokens(oldPattern), tokens(newPattern)).map(edit => ({
        ...edit, index: edit.index + brackets.filter(position => position <= edit.index).length,
    })).sort((a, b) => a.index - b.index);
    for (const { index, length, add } of edits) {
        const delta = add ? length : -length;
        groups = groups.map(group => {
            const before = add ? index <= group.start : index < group.start;
            const inside = index < group.end && (add ? index > group.start : index >= group.start);
            return { ...group, start: group.start + (before ? delta : 0),
                end: group.end + (before || inside ? delta : 0) };
        });
        if (!add) {
            let empty = groups.find(group => group.end - group.start < 2);
            while (empty) {
                groups = removeGroup(groups, empty);
                empty = groups.find(group => group.end - group.start < 2);
            }
        }
    }
    return encode(groups);
}

let active: Popover | undefined;
let activeContent: HTMLElement | undefined;
function closePopover() {
    if (!active) return;
    active.dispose();
    active = undefined;
    activeContent = undefined;
    document.querySelectorAll('#rg_cap_group_display .bg-warning').forEach(span => span.classList.remove('bg-warning'));
}
document.addEventListener('mousedown', event => {
    if (activeContent && event.target instanceof Node && !activeContent.closest('.popover')?.contains(event.target)) {
        closePopover();
    }
});

function showPopover(anchor: HTMLElement, title: string, content: HTMLElement) {
    closePopover();
    activeContent = content;
    const header = document.createElement('div');
    header.className = 'd-flex justify-content-between align-items-center';
    const close = document.createElement('button');
    close.type = 'button';
    close.className = 'btn-close';
    close.setAttribute('aria-label', t('Close'));
    close.title = t('Cancel');
    close.onclick = closePopover;
    header.append(t(title), close);
    active = new Popover(anchor, { html: true, trigger: 'manual', placement: 'top', title: header, content });
    const input = content.querySelector('input');
    if (input) {
        // Wait for Bootstrap to position the popover before moving keyboard focus.
        anchor.addEventListener('shown.bs.popover', () => {
            if (activeContent === content) input.focus({ preventScroll: true });
        }, { once: true });
    }
    active.show();
}

function nameEditor(anchor: HTMLElement, title: string, name: string, save: (value: string) => void) {
    const form = document.createElement('form');
    form.className = 'needs-validation';
    form.autocomplete = 'off';
    const field = document.createElement('div');
    field.className = 'mb-3';
    const label = document.createElement('label');
    label.className = 'form-label';
    label.textContent = t('Name (optional)');
    const input = document.createElement('input');
    input.type = 'text';
    input.id = 'rg_name_of_capturing_group';
    input.className = 'form-control';
    input.autocomplete = 'off';
    input.value = name;
    label.htmlFor = input.id;
    const feedback = document.createElement('div');
    feedback.className = 'invalid-feedback';
    feedback.id = input.id + '_feedback';
    feedback.textContent = t('The name is invalid. Ensure it is alpha numeric and does not begin with a digit.');
    input.setAttribute('aria-describedby', feedback.id);
    field.append(label, input, feedback);
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'btn btn-primary';
    button.textContent = t(title);
    form.append(field, button);
    const validate = () => {
        const valid = validName.test(input.value);
        input.classList.toggle('is-invalid', !valid);
        input.setAttribute('aria-invalid', String(!valid));
        return valid;
    };
    const submit = () => { if (validate()) save(input.value); };
    input.oninput = validate;
    button.onclick = submit;
    form.onsubmit = event => { event.preventDefault(); submit(); };
    showPopover(anchor, title, form);
}

export function mountGroups(pattern: string, encoded: string, save: (value: string) => void) {
    closePopover();
    const groups = decode(encoded);
    const display = document.getElementById('rg_cap_group_display')!;
    const list = document.getElementById('rg_cap_group_list')!;
    const tokens = tokenList(pattern, groups);
    const spans = tokens.map(({ text }, i) => {
        const span = document.createElement('span');
        span.className = 'rg-result-part';
        span.dataset.index = String(i);
        span.textContent = text;
        return span;
    });
    display.replaceChildren(...spans);
    const mark = (start: number, end: number, css: string) => spans.forEach((span, index) =>
        span.classList.toggle(css, start <= index && index <= end));
    display.onpointerdown = event => {
        if (!(event.target instanceof HTMLElement) || event.target.dataset.index === undefined) return;
        event.preventDefault();
        const from = Number(event.target.dataset.index);
        let to = from;
        function move(event: PointerEvent) {
            const target = document.elementFromPoint(event.clientX, event.clientY);
            if (target instanceof HTMLElement && display.contains(target) && target.dataset.index !== undefined) {
                to = Number(target.dataset.index);
            }
            mark(Math.min(from, to), Math.max(from, to), 'bg-warning');
        }
        function release() {
            window.removeEventListener('pointermove', move);
            let start = Math.min(from, to);
            let end = Math.max(from, to);
            while (start <= end && !tokens[start].selectable) start++;
            while (end >= start && !tokens[end].selectable) end--;
            const selected = tokens.slice(start, end + 1);
            let depth = 0;
            const valid = selected.every(token => {
                if (token.text.startsWith('(') && !token.selectable && !/^\(\?[A-Za-z]+\)$/.test(token.text)) depth++;
                if (token.text.startsWith(')') && !token.selectable) depth--;
                return depth >= 0 && (token.text !== '|' || depth > 0);
            });
            const crosses = groups.some(group =>
                (start <= group.start && group.start <= end) !== (start <= group.end && group.end <= end));
            if (start <= end && valid && depth === 0 && !crosses) {
                nameEditor(spans[Math.floor((start + end) / 2)], 'Create Capturing Group', '', name => {
                    const entry = name + '||' + start + '-' + end;
                    save(encode(decode([encoded, entry].filter(Boolean).join(','))));
                });
            } else mark(-1, -1, 'bg-warning');
        }
        move(event);
        window.addEventListener('pointermove', move);
        window.addEventListener('pointerup', release, { once: true });
    };
    list.replaceChildren();
    if (!groups.length) {
        const empty = document.createElement('em');
        empty.className = 'col rg-cap-group-list-item rg-faded';
        empty.textContent = t('No capturing groups defined yet.');
        list.append(empty);
    }
    for (const group of groups) {
        const column = document.createElement('div');
        column.className = 'col-12 col-md-6 col-xl-4 col-xxl-3';
        const item = document.createElement('div');
        item.className = 'rg-capturing-group border rounded p-1 d-flex justify-content-between align-items-center';
        const name = document.createElement('div');
        name.className = 'ms-2 text-truncate';
        name.textContent = group.name || t('Unnamed group');
        const buttons = document.createElement('div');
        buttons.className = 'btn-group';
        function button(title: string, classes: string, action: (button: HTMLButtonElement) => void, icon?: string) {
            const button = document.createElement('button');
            button.type = 'button';
            button.className = 'btn btn-sm ' + classes;
            button.title = t(title);
            button.setAttribute('aria-label', button.title);
            if (icon) {
                const symbol = document.createElement('i');
                symbol.className = 'bi ' + icon;
                button.append(symbol);
            } else button.textContent = group.quantifier || '{1}';
            button.onclick = () => action(button);
            buttons.append(button);
        }
        button('Rename Capturing Group', 'text-secondary rg-btn-rename', button =>
            nameEditor(button, 'Rename', group.name, value => { group.name = value; save(encode(groups)); }), 'bi-input-cursor-text');
        button('Adjust quantifier', 'text-secondary text-nowrap rg-btn-quantifiers', button => {
            const content = document.createElement('div');
            for (const [label, options] of [['Exact quantifiers', ['']], ['Greedy quantifiers', ['?', '*', '+']],
                ['Lazy quantifiers', ['??', '*?', '+?']]] as const) {
                const row = document.createElement('div');
                row.className = 'mb-3';
                const heading = document.createElement('div');
                heading.className = 'form-label';
                heading.textContent = t(label);
                row.append(heading);
                for (const value of options) {
                    const choice = document.createElement('button');
                    choice.className = 'btn btn-light border ' + (group.quantifier === value ? 'active' : '');
                    choice.textContent = value || '{1}';
                    choice.onclick = () => { group.quantifier = value; save(encode(groups)); };
                    row.append(choice);
                }
                content.append(row);
            }
            showPopover(button, 'Quantifier', content);
        });
        button('Delete capturing group', 'text-danger', () => {
            save(encode(removeGroup(groups, group)));
        }, 'bi-trash');
        item.onmouseenter = () => mark(group.start, group.end, 'bg-info');
        item.onmouseleave = () => mark(-1, -1, 'bg-info');
        item.append(name, buttons);
        column.append(item);
        list.append(column);
    }
}

