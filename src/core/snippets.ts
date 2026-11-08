import { snippetTemplates } from './snippet-data';

const stringEscape = (text: string, quote: string) => text.replaceAll('\\', '\\\\')
    .replaceAll(quote, () => '\\' + quote).replaceAll('\t', '\\t');

function pythonPattern(pattern: string) {
    const quote = pattern.includes('"') && !pattern.includes("'") ? "'" : '"';
    const other = quote === '"' ? "'" : '"';
    const escaped = pattern.replace(new RegExp(quote + '+', 'g'), run => quote + other + run + other + 'r' + quote)
        .replace(/[^\\](?:\\\\)*(\\)$/, (_, slash: string) => quote + other + slash + slash + other + 'r' + quote);
    return ('r' + quote + escaped + quote).replace(new RegExp('^r' + quote + quote + '|r' + quote + quote + '$', 'g'), '');
}

export const languages = snippetTemplates.sort((a, b) =>
    a.languageName.toLowerCase() < b.languageName.toLowerCase() ? -1 : 1);

export function languageId(name: string) {
    return name.replaceAll(' ', '__').replaceAll('-', '_minus_').replaceAll('.', '_dot_')
        .replaceAll('+', '_plus_').replaceAll('#', '_sharp_')
        .replace(/[^_A-Za-z0-9]/g, character => '_u' + character.charCodeAt(0) + '_');
}

export function generateSnippet(template: typeof languages[number], pattern: string, flags: string) {
    const { languageName: name, valueForCaseInsensitive, valueForDotAll, valueForMultiline,
        prefix = '', separator = '', postfix = '', code } = template;
    const options = [flags.includes('i') && valueForCaseInsensitive,
        flags.includes('s') && valueForDotAll, flags.includes('m') && valueForMultiline].filter(Boolean);
    const warnings: string[] = [];
    if (flags.includes('s')) {
        if (name === 'C (regex.h)') warnings.push('DOT_ALL is not supported by regex.h');
        if (name === 'grep') warnings.push("The option 's' (dot matches line breaks) is not supported for grep.");
        if (name === 'JavaScript') warnings.push("The option 's' (dot matches line breaks) is not supported in Firefox and IE.");
        if (name === 'Kotlin') warnings.push("The option 'RegexOption.DOT_MATCHES_ALL' is only supported on JVM runtime.");
    }
    if (name === 'grep') {
        if (flags.includes('m')) warnings.push("The option 'm' (multiline) is not supported for grep.");
        warnings.push('grep on mac OS does not support option -P (for Perl regex). To make it work, install a better grep (e.g. brew install grep). Most regex will work without -P.');
    }
    if (name === 'Ruby') {
        if (flags.includes('m')) warnings.push("The Ruby regex engine does not support the MULTILINE option. Regex' are always treated as multiline.");
        if (flags.includes('s')) warnings.push('In Ruby, the DOTALL modifier equivalent is m, Regexp::MULTILINE modifier.');
    }

    let escaped: string;
    switch (name) {
        case 'Python': escaped = pythonPattern(pattern); break;
        case 'grep': escaped = pattern.replaceAll("'", "'\"'\"'").replace(/^-/, '\\-'); break;
        case 'JavaScript': escaped = pattern.replaceAll('/', '\\/').replaceAll('\t', '\\t'); break;
        case 'Visual Basic .NET': escaped = pattern.replaceAll('"', '""'); break;
        case 'PHP':
        case 'Ruby': escaped = stringEscape(pattern, "'"); break;
        default: escaped = stringEscape(pattern, '"');
    }

    return {
        snippet: code.replaceAll('%1$s', () => escaped)
            .replaceAll('%2$s', () => options.length ? prefix + options.join(separator) + postfix : '')
            .replaceAll('%3$s', () => pattern),
        warnings,
    };
}
