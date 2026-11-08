import { readSetting, writeSetting } from '../core/state';
import type { Match } from '../core/regex';

export type Locale = 'en' | 'zh-CN';
const localeKey = 'ui.locale';
const stored = readSetting(localeKey);
export let locale: Locale = stored === 'en' || stored === 'zh-CN'
    ? stored : /^zh(?:-|$)/i.test(navigator.language) ? 'zh-CN' : 'en';

export const zh: Record<string, string> = {
    'Regex Generator': '正则表达式生成器',
    'Regex Generator - Creating regex is easy again!': '正则表达式生成器 - 轻松编写正则表达式！',
    'Paste a sample text.': '粘贴一段示例文本。',
    'Which parts of the text are interesting for you?': '你想匹配文本中的哪些部分？',
    'Options': '选项', 'Capturing Groups': '捕获组', 'Regular Expression': '正则表达式',
    'Usage in Programming Languages': '在编程语言中使用',
    'Show user guide': '打开使用指南', 'Copy regex': '复制正则表达式', 'Copied': '已复制',
    'Copy failed': '复制失败', 'Copy link to share': '复制分享链接',
    'Language': '界面语言', 'Undo': '撤销', 'Redo': '重做',
    'Next': '下一步', 'Previous': '上一步', 'Done': '完成', 'Close': '关闭',
    'Example text': '示例文本', 'Text here...': '在此输入文本…',
    'Toggle toolbar': '展开或收起工具栏', 'Basic example': '操作',
    'Character': '字符', 'Exact number': '固定数字', 'Repeating character': '重复字符',
    'One whitespace': '单个空白字符', 'Whitespaces': '连续空白字符',
    'One arbitrary character': '单个字母', 'Multiple characters': '多个字母',
    'Digit': '数字', 'Number': '整数', 'Decimal number': '小数',
    'Floating point number (with optional exponent)': '浮点数（可带指数）',
    'Alphanumeric characters': '字母和数字', 'URL encoded character': 'URL 编码字符',
    'Day': '日', 'Month': '月', 'Hour': '小时', 'Minute/ Second': '分钟／秒',
    'Date': '日期', 'Time': '时间', 'RFC2822 e-mail': 'RFC 2822 电子邮件地址',
    'IPv4 address': 'IPv4 地址', 'Hashtag': '话题标签', 'Simple CSS Color': 'CSS 十六进制颜色',
    'US ZIP code': '美国邮政编码', 'Postleitzahl': '德国邮政编码', 'US phone number': '美国电话号码',
    'Log level': '日志级别', 'Parentheses': '圆括号', 'Square brackets': '方括号',
    'Curly braces': '花括号', 'String (quotation mark)': '字符串（双引号）',
    'String (apostrophe)': '字符串（单引号）',
    'no parentheses': '无圆括号', 'no square bracket': '无方括号', 'no curly braces': '无花括号',
    'no quotation mark': '无双引号', 'no apostrophe': '无单引号',
    'backslash escaped quotation mark': '反斜杠转义双引号', 'double escaped quotation mark': '成对双引号转义',
    'backslash escaped apostrophe': '反斜杠转义单引号', 'double escaped apostrophe': '成对单引号转义',
    'Need help?': '需要帮助？',
    'Hover and click the colored boxes below the text.': '将鼠标移到文本下方的彩色方块上，然后点击。',
    'In this line of text you can then see, which parts of your input will be recognized by the corresponding regex.':
        '文本行会高亮显示对应正则表达式匹配的部分。',
    'DOT_ALL is not supported by regex.h': 'regex.h 不支持 DOT_ALL。',
    "The option 's' (dot matches line breaks) is not supported for grep.": 'grep 不支持 s（点号匹配换行符）选项。',
    "The option 'm' (multiline) is not supported for grep.": 'grep 不支持 m（多行）选项。',
    "The option 's' (dot matches line breaks) is not supported in Firefox and IE.": '此示例的 s（点号匹配换行符）选项在旧版 Firefox 和 IE 中不可用。',
    "The option 'RegexOption.DOT_MATCHES_ALL' is only supported on JVM runtime.": 'RegexOption.DOT_MATCHES_ALL 仅适用于 JVM。',
    'grep on mac OS does not support option -P (for Perl regex). To make it work, install a better grep (e.g. brew install grep). Most regex will work without -P.':
        'macOS 自带的 grep 不支持 -P（Perl 正则表达式）。可通过 brew install grep 安装支持此选项的版本。多数正则表达式无需 -P。',
    "The Ruby regex engine does not support the MULTILINE option. Regex' are always treated as multiline.":
        'Ruby 的正则表达式始终按多行处理，无需 MULTILINE 选项。',
    'In Ruby, the DOTALL modifier equivalent is m, Regexp::MULTILINE modifier.':
        '在 Ruby 中，m（Regexp::MULTILINE）等效于 DOTALL。',
    'Add Capturing Groups (optional)': '添加捕获组（可选）',
    'No capturing groups defined yet.': '尚未定义捕获组。',
    'Unnamed group': '未命名捕获组',
    'Create Capturing Group': '创建捕获组', 'Rename Capturing Group': '重命名捕获组',
    'Rename': '重命名', 'Delete capturing group': '删除捕获组',
    'Adjust quantifier': '调整量词', 'Exact quantifiers': '精确量词',
    'Greedy quantifiers': '贪婪量词', 'Lazy quantifiers': '惰性量词',
    'Quantifier': '量词',
    'Name (optional)': '名称（可选）', 'Cancel': '取消',
    'The name is invalid. Ensure it is alpha numeric and does not begin with a digit.':
        '名称无效。请以英文字母开头，并使用英文字母、数字或下划线。',
};

export const t = (key: string) => locale === 'zh-CN' ? zh[key] ?? key : key;
export function matchTitle(match: Match) {
    if (match.derived && locale === 'zh-CN') return '组合 [' + match.derived.map(t).join(' + ') + ']';
    if (match.center) return locale === 'zh-CN' ? t(match.name) + '内容（' + t(match.detail!) + '）'
        : match.name + ' content (' + match.detail + ')';
    return t(match.name) + (match.detail === undefined ? '' : ' (' + match.detail + ')');
}

// Numbered placeholders move the original links, icons and inline code with their text.
const copy: Record<string, string> = {
    '#rg_loading .visually-hidden': '正在加载…',
    '#rg_loading .display-5': '{0} 正在加载正则表达式生成器…',
    '#rg-title': '正则表达式生成器', 'h5.lead': '轻松编写{0}！',
    'h5.lead em': '正则表达式',
    '#rg_raw_input_message_shorten small': '为加快处理速度，输入已截断至 {0} 个字符。',
    '#rg_raw_text_input_help': '输入一段示例文本。我们会给出可用于构建{0}的匹配建议。',
    '#rg_raw_text_input_help em': '正则表达式',
    '#rg_pattern_selection_container small': '点击标记的建议，将对应模式加入正则表达式。',
    'label[for=rg_onlymatches]': '仅生成模式',
    '#rg_onlymatches_help': '启用后，生成的正则表达式仅包含你在第 2 步选中的模式。关闭时会保留模式之间的原文。',
    'label[for=rg_matchwholeline]': '匹配整行',
    '#rg_matchwholeline_help': '让生成的正则表达式匹配整段输入。',
    'label[for=rg_generateLowerCase]': '生成小写字符类',
    '#rg_generateLowerCase_help': '默认生成类似 {0} 的字符类，同时覆盖大小写。启用后仅生成小写字符类。',
    '#rg_capgroup_selection_container small': '标记正则表达式中要捕获的部分。',
    '#rg_capgroup_selection_container h6': '捕获组',
    '#rg_regex_result_container small': '将鼠标悬停在生成的正则表达式上可查看更多信息。',
    '#rg_button_copy': '复制正则表达式',
    '#rg_display_programming_languages small.text-muted': '这些代码示例由工具自动生成，可能无法运行。如果发现语法错误，请提交{0}。',
    '#rg_display_programming_languages small.text-muted a': '错误报告',
    'label[for=rg_caseinsensitive]': '忽略大小写',
    '#rg_caseinsensitive_help': '主流正则引擎默认区分大小写。启用此选项后，类似 {0} 的模式会忽略大小写。{1}',
    'label[for=rg_dotmatcheslinebreakes]': '点号匹配换行符',
    '#rg_dotmatcheslinebreakes_help': '点号 {0} 默认不匹配换行或回车。启用此选项后，{1} 等模式可跨行匹配。{2}',
    'label[for=rg_multiline]': '多行模式',
    '#rg_multiline_help': '多数主流引擎（Ruby 除外）默认用 {0} 和 {1} 匹配字符串首尾。启用此选项后，{2} 和 {3} 等模式可匹配每行的首尾。{4}',
    '#rg_mainContainer > .bg-secondary h5': '分享',
    '#rg_mainContainer > .bg-secondary p': '通过以下链接分享当前内容和设置：',
    'footer > h5': '正则表达式生成器',
    '#rg_project_origin': '基于 {0} 改编。此版本支持中英双语，采用 TypeScript 和 Vite 构建，可部署到 GitHub Pages。',
    '#rg_project_origin a': 'Olaf Neumann 的正则表达式生成器',
    '#rg_project_source': '在 GitHub 查看源码',
    '#footerContent > div:nth-of-type(2) h5': '实用正则表达式链接',
    '#footerContent > div:nth-of-type(3) h5': '项目使用的技术',
    '#rg_anchor_regex101': '正则表达式 101',
};

const nodes = Object.entries(copy).flatMap(([selector, translated]) => {
    const element = document.querySelector(selector);
    if (!element) return [];
    return [{ element, translated, children: [...element.children], original: [...element.childNodes] }];
});
const attributes = [...document.querySelectorAll('[title], [placeholder], [aria-label]')].flatMap(element =>
    ['title', 'placeholder', 'aria-label'].flatMap(attribute => {
        const original = element.getAttribute(attribute);
        return original === null ? [] : [{ element, attribute, original }];
    }));

const description = document.querySelector('meta[name="description"]');
const descriptionEnglish = description?.getAttribute('content') ?? '';

export function applyLocale(next: Locale, persist = false) {
    locale = next;
    if (persist) writeSetting(localeKey, locale);
    document.documentElement.lang = locale;
    document.title = t('Regex Generator - Creating regex is easy again!');
    description?.setAttribute('content', locale === 'zh-CN'
        ? '根据示例文本生成简单的正则表达式，帮助你轻松编写匹配规则。'
        : descriptionEnglish);
    document.querySelector('meta[name="apple-mobile-web-app-title"]')?.setAttribute('content', t('Regex Generator'));
    for (const { element, translated, children, original } of nodes) {
        element.replaceChildren(...(locale === 'en' ? original : translated.split(/\{(\d+)\}/).map(
            (part, i) => i % 2 ? children[Number(part)] : part)));
    }
    for (const { element, attribute, original } of attributes) element.setAttribute(attribute, t(original));
}


