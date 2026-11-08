import $ from 'jquery';
import { Collapse, Popover } from 'bootstrap';
import Driver from 'driver.js';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap-icons/font/bootstrap-icons.css';
import './assets/libraries/prismjs/prismjs.css';
import './assets/libraries/prismjs/prismjs.js';
import './assets/styles/regex-generator.css';
import './assets/styles/driver.min.css';
import { applyLocale, locale, matchTitle, t, type Locale } from './i18n/locale';
import { combine, first, last, type Match } from './core/regex';
import { editInput, flagFields, intersects, maxInput, readSetting, restore, share, writeSetting, type State } from './core/state';
import { generateSnippet, languageId, languages } from './core/snippets';
import { applyGroups, mountGroups, transferGroups } from './ui/groups';
import englishGuide from './i18n/user-guide.en.json';
import chineseGuide from './i18n/user-guide.zh-CN.json';

const el = <T extends HTMLElement = HTMLElement>(id: string) => document.getElementById(id) as T;
function create<K extends keyof HTMLElementTagNameMap>(tag: K, className = '', text?: string) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
}

const location = new URL(window.location.href);
window.history.scrollRestoration = 'manual';
const capturingEnabled = location.searchParams.get('capturing-groups')?.toLowerCase() !== 'false';
const input = el<HTMLInputElement>('rg_raw_input_text');
const selector = el<HTMLSelectElement>('rg_locale');
const defaults = flagFields.filter(([flag, , key]) => (readSetting(key) ?? String(flag === 'i')) === 'true')
    .map(([flag]) => flag).join('');
let state = restore(location, defaults);
let snapshots = [state];
let pointer = 0;
let guide: Driver | undefined;
let inputTimer: number | undefined;
let warningTimer: number | undefined;
let helpPopover: Popover | undefined;
let shareUrl: URL;
let pattern: string;

const sections = [
    ['rg_input_container', 'Paste a sample text.'],
    ['rg_pattern_selection_container', 'Which parts of the text are interesting for you?'],
    ['rg_options', 'Options'],
    ...(capturingEnabled ? [['rg_capgroup_selection_container', 'Add Capturing Groups (optional)']] : []),
    ['rg_regex_result_container', 'Regular Expression'],
    ['rg_display_programming_languages', 'Usage in Programming Languages'],
];
const headings = sections.map(([id, title], i) => {
    const section = el(id);
    const number = create('h3', 'display-3 text-secondary rg-number', String(i + 1));
    const left = create('div', 'col-sm-1 p-4 d-none d-sm-none d-md-block text-center');
    const right = create('div', 'col-12 col-md-11 py-4 pl-4');
    const caption = create('div', 'd-flex justify-content-between rg-caption-holder');
    const content = create('div', 'rg-content');
    const heading = create('h5');
    const label = document.createTextNode(title);
    heading.append(label);
    if (id === 'rg_options' || id === 'rg_display_programming_languages') {
        const toggle = create('button', 'btn p-0 text-start w-100');
        toggle.type = 'button';
        toggle.append(heading);
        heading.append(create('i', 'bi bi-chevron-up'));
        let open = id !== 'rg_options';
        const update = (animate: boolean) => {
            toggle.setAttribute('aria-expanded', String(open));
            caption.classList.toggle('rg-upside-down', !open);
            const margins = open ? { marginTop: '0', marginBottom: '0' } : { marginTop: '-0.32em', marginBottom: '-1em' };
            if (animate) {
                $(content).stop(true)[open ? 'slideDown' : 'slideUp']();
                $(number).stop(true).animate(margins);
            } else {
                content.style.display = open ? '' : 'none';
                Object.assign(number.style, margins);
            }
        };
        toggle.onclick = () => { open = !open; update(true); };
        update(false);
        caption.append(toggle);
    } else caption.append(heading);
    if (i === 0) {
        const button = create('button', 'btn btn-link btn-sm');
        button.type = 'button';
        button.id = 'rg_button_show_help';
        button.onclick = () => showGuide(false);
        button.append(create('i', 'bi bi-question-circle'));
        caption.append(button);
    }
    content.append(...section.children);
    left.append(number);
    right.append(caption, content);
    section.append(left, right);
    section.classList.add('row', 'rounded', 'mt-3', 'pr-4');
    if (!section.classList.contains('bg-rg-result')) section.classList.add('bg-light');
    section.style.display = '';
    return { label, title };
});

function showGuide(initial: boolean) {
    guide?.reset(true);
    guide = new Driver({
        className: 'rg-guide', nextBtnText: t('Next'), prevBtnText: t('Previous'),
        doneBtnText: t('Done'), closeBtnText: t('Close'),
    });
    guide.defineSteps((locale === 'en' ? englishGuide : chineseGuide) as Parameters<Driver['defineSteps']>[0]);
    guide.start(initial ? 0 : 1);
}

const cards = languages.map(template => {
    const id = languageId(template.languageName);
    const key = 'language.' + id + '.expanded';
    const open = readSetting(key) === 'true';
    const item = create('div', 'accordion-item');
    const header = create('div', 'accordion-header');
    const button = create('button', 'accordion-button' + (open ? '' : ' collapsed'), template.languageName);
    button.type = 'button';
    button.setAttribute('aria-controls', id + '_body');
    button.setAttribute('aria-expanded', String(open));
    const body = create('div', 'accordion-collapse collapse' + (open ? ' show' : ''));
    body.id = id + '_body';
    const collapse = new Collapse(body, { toggle: false });
    button.onclick = () => collapse.toggle();
    for (const [event, shown] of [['shown.bs.collapse', true], ['hidden.bs.collapse', false]] as const) {
        body.addEventListener(event, () => {
            writeSetting(key, String(shown));
            button.classList.toggle('collapsed', !shown);
            button.setAttribute('aria-expanded', String(shown));
        });
    }
    const pre = create('pre');
    const code = create('code', 'language-' + template.highlightLanguage);
    code.id = id + '_code';
    const warnings = create('div');
    pre.append(code);
    body.append(warnings, pre);
    header.append(button);
    item.append(header, body);
    el('rg_language_accordion').append(item);
    return { template, code, warnings };
});

const colors = ['bg-primary', 'bg-success', 'bg-danger', 'bg-warning'];
function displayText(value: string) {
    const spans = value.split('').map(character => create('span', 'rg-char', character));
    el('rg_text_display').replaceChildren(...spans);
    return spans;
}

function toggleMatch(match: Match) {
    const selected = state.selected.includes(match)
        ? state.selected.filter(item => item !== match)
        : state.selected.some(item => intersects(item, match)) ? state.selected : [...state.selected, match];
    if (selected !== state.selected) commit({ ...state, selected });
}

function renderMatches() {
    helpPopover?.dispose();
    helpPopover = undefined;
    const spans = displayText(state.input);
    const groups = [...Map.groupBy(state.matches, match => JSON.stringify(match.ranges)).values()]
        .sort((a, b) => Math.max(...b.map(item => item.priority)) - Math.max(...a.map(item => item.priority)) ||
            first(a[0]) - first(b[0]) || last(b[0]) - last(a[0]));
    const rows: Match[][][] = [];
    for (const group of groups) {
        let row = rows.find(row => last(row.at(-1)![0]) < first(group[0]));
        if (!row) rows.push(row = []);
        row.push(group);
    }
    function colorRanges(match: Match, color: string, enabled: boolean) {
        for (const [start, end] of match.ranges) {
            for (let i = start; i <= end; i++) spans[i]?.classList.toggle(color, enabled);
        }
    }
    for (const match of state.selected) colorRanges(match, 'rg-char-selected', true);
    const container = el('rg_row_container');
    const rowNodes = rows.map((row, rowIndex) => {
        const line = create('div', 'rg-match-row');
        row.forEach((group, index) => {
            const match = group[0];
            const selected = group.find(item => state.selected.includes(item));
            const inactive = !selected && state.selected.some(item => intersects(item, match));
            const color = colors[(rowIndex + index) % colors.length];
            const box = create('div', 'rg-match-item ' + color);
            box.classList.toggle('rg-multi-match-item', group.length > 1);
            box.classList.toggle('rg-match-item-stripe', group.every(item => !!item.derived));
            box.classList.toggle('rg-item-selected', !!selected);
            box.classList.toggle('rg-item-not-available', inactive);
            box.style.left = first(match) + 'ch';
            box.style.width = last(match) - first(match) + 1 + 'ch';
            if (match.ranges.length === 2) {
                const [[a, b], [c, d]] = match.ranges;
                box.style.borderLeftWidth = b - a + 1 + 'ch';
                box.style.borderRightWidth = d - c + 1 + 'ch';
            }
            const overlay = create('div', 'rg-match-item-overlay');
            for (const item of group) {
                const option = create('div', 'rg-recognizer');
                option.title = item.patterns.length === 1 ? item.patterns[0] :
                    locale === 'en' ? 'Match consisting of ' + item.patterns.length + ' patterns.' :
                        '由 ' + item.patterns.length + ' 个模式组成的匹配。';
                const action = create('a', '', matchTitle(item));
                action.tabIndex = 0;
                action.setAttribute('role', 'link');
                action.onkeydown = event => { if (event.key === 'Enter') action.click(); };
                action.onclick = event => { event.preventDefault(); event.stopPropagation(); toggleMatch(item); };
                option.append(action);
                overlay.append(option);
            }
            box.append(overlay);
            if (selected || (!inactive && group.length === 1)) {
                box.onclick = () => toggleMatch(selected ?? match);
            } else if (!inactive) {
                box.onmousedown = event => {
                    if (event.button !== 0 || overlay.contains(event.target as Node)) return;
                    overlay.classList.add('rg-glow-alert');
                    window.setTimeout(() => overlay.classList.remove('rg-glow-alert'), 900);
                };
            }
            if (!inactive && !selected) {
                box.onmouseenter = () => colorRanges(match, color, true);
                box.onmouseleave = () => colorRanges(match, color, false);
            }
            line.append(box);
        });
        return line;
    });
    container.replaceChildren(...rowNodes);
    const height = rowNodes.reduce((max, row, i) => {
        const overlays = [...row.querySelectorAll<HTMLElement>('.rg-match-item-overlay')];
        return Math.max(max, ($(row).height() ?? 0) * (i + 1),
            ...overlays.map(node => ($(row).height() ?? 0) * (i + 1) + ($(node).height() ?? 0)));
    }, 0);
    $(container).stop().animate({ height: height + 8 }, 350);
}

let lastTextClick = 0;
el('rg_text_display').onclick = event => {
    const now = Date.now();
    if (now - lastTextClick < 500 && !helpPopover) {
        helpPopover = new Popover(event.target as HTMLElement, {
            title: t('Need help?'), customClass: 'rg-help-popover', placement: 'top', trigger: 'manual',
            content: t('Hover and click the colored boxes below the text.') + ' ' +
                t('In this line of text you can then see, which parts of your input will be recognized by the corresponding regex.'),
        });
        helpPopover.show();
    }
    lastTextClick = now;
};

function render() {
    if (inputTimer === undefined && input.value !== state.input) input.value = state.input;
    renderMatches();
    if (inputTimer !== undefined) displayText(input.value);
    const base = basePattern(state);
    pattern = applyGroups(base, state.groups);
    el('rg_result_display').replaceChildren(create('span', '', pattern));
    if (capturingEnabled) mountGroups(base, state.groups, groups => commit({ ...state, groups }));
    for (const [flag, id] of flagFields) el<HTMLInputElement>(id).checked = state.flags.includes(flag);
    for (const { template, code, warnings } of cards) {
        const generated = generateSnippet(template, pattern, state.flags);
        code.textContent = generated.snippet;
        warnings.replaceChildren(...generated.warnings.map(warning => create('p', 'alert alert-warning rounded m-2', t(warning))));
    }
    (window as Window & { Prism?: { highlightAll(): void } }).Prism?.highlightAll();
    shareUrl = share(state, location);
    el('rg_result_link').textContent = shareUrl.href;
    window.history.replaceState(null, '', shareUrl);
    const externalFlags = ['i', 's', 'm'].filter(flag => state.flags.includes(flag)).join('');
    el<HTMLAnchorElement>('rg_anchor_regex101').href = 'https://regex101.com/?regex=' + encodeURIComponent(pattern.toWellFormed()) + '&flags=g' + externalFlags + '&delimiter=/';
    el<HTMLAnchorElement>('rg_anchor_regexr').href = 'https://regexr.com/?expression=' + encodeURIComponent(pattern.toWellFormed()) + '&text=';
    el<HTMLButtonElement>('rg_button_action_undo').disabled = pointer === 0;
    el<HTMLButtonElement>('rg_button_action_redo').disabled = pointer === snapshots.length - 1;
}

function saveFlags() {
    for (const [flag, , key] of flagFields) writeSetting(key, String(state.flags.includes(flag)));
}

function basePattern(model: State) {
    return combine(model.input, model.selected, model.flags).map(part => part.pattern).join('');
}

function commit(next: State, undoable = true) {
    if (undoable && next.groups && next.groups === state.groups) {
        next = { ...next, groups: transferGroups(basePattern(state), basePattern(next), next.groups) };
    }
    state = next;
    if (undoable) {
        snapshots = [...snapshots.slice(0, pointer + 1), next].slice(-100);
        pointer = snapshots.length - 1;
    }
    saveFlags();
    render();
}

function moveHistory(offset: number) {
    const next = pointer + offset;
    if (!snapshots[next]) return;
    pointer = next;
    const flags = snapshots[pointer].flags.replace(/[ism]/g, '') + state.flags.replace(/[PWL]/g, '');
    commit({ ...snapshots[pointer], flags }, false);
}
el('rg_button_action_undo').onclick = () => moveHistory(-1);
el('rg_button_action_redo').onclick = () => moveHistory(1);

input.maxLength = maxInput + 1;
const warning = el('rg_raw_input_message_shorten');
warning.style.display = 'none';
input.oninput = () => {
    if (input.value.length > maxInput) {
        input.value = input.value.slice(0, maxInput);
        $(warning).stop(true).slideDown();
        window.clearTimeout(warningTimer);
        warningTimer = window.setTimeout(() => $(warning).stop(true).slideUp(), 7000);
    }
    displayText(input.value);
    window.clearTimeout(inputTimer);
    inputTimer = window.setTimeout(() => {
        inputTimer = undefined;
        commit(editInput(state, input.value));
    }, 200);
};
for (const [flag, id] of flagFields) {
    const control = el<HTMLInputElement>(id);
    control.oninput = () => {
        const flags = flagFields.map(([candidate]) => candidate).filter(candidate =>
            candidate === flag ? control.checked : state.flags.includes(candidate)).join('');
        commit({ ...state, flags }, 'PWL'.includes(flag));
    };
}

async function copy(text: string, button: HTMLElement, icon?: Element | null) {
    try {
        await navigator.clipboard.writeText(text);
        if (!icon) return;
        icon.classList.replace('bi-clipboard2', 'bi-clipboard2-check');
        button.title = t('Copied');
    } catch {
        button.title = t('Copy failed');
    }
    window.setTimeout(() => {
        icon?.classList.replace('bi-clipboard2-check', 'bi-clipboard2');
        button.title = t(icon ? 'Copy link to share' : 'Copy regex');
    }, 2000);
}
const copyRegex = el('rg_button_copy');
const copyLink = el('rg_button_copy_share_link');
copyRegex.classList.toggle('d-none', !navigator.clipboard);
copyLink.classList.toggle('d-none', !navigator.clipboard);
copyRegex.onclick = () => void copy(pattern, copyRegex);
copyLink.onclick = () => void copy(shareUrl.href, copyLink, copyLink.firstElementChild);

function translate(next: Locale, persist = false) {
    guide?.reset(true);
    applyLocale(next, persist);
    selector.value = next;
    for (const { label, title } of headings) label.data = t(title);
    el('rg_button_show_help').setAttribute('aria-label', t('Show user guide'));
    render();
}
selector.onchange = () => translate(selector.value as Locale, true);

translate(locale);
saveFlags();
el('rg_loading').classList.add('d-none');
window.scrollTo(0, 0);
input.focus({ preventScroll: true });
if (Number(readSetting('user.lastVersion')) < 3) {
    writeSetting('user.lastVersion', '3');
    showGuide(true);
}



