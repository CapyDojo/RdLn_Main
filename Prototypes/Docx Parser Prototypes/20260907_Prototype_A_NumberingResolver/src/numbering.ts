import { attr, child, children, integer, on, parsePart, readIndentation, readProperties, value } from './xml.js';
import { formatNumber, hasPrivateUse, resolveBulletLabel } from './formats.js';
import type { Diagnostic, Indentation, LevelDefinition, NumberingDefinition, ParagraphProperties, ParagraphRecord, XmlParser } from './types.js';

interface Style { type: string; base?: string; properties: ParagraphProperties }
interface Abstract { levels: Map<number, LevelDefinition>; styleLink?: string; restartAfterBreak: boolean }
interface Instance { abstractId: string; overrides: Map<number, { start?: number; level?: Element }> }
interface Sequence { counters: Array<number | null>; initialized: Set<string> }

function readLevel(element: Element): LevelDefinition {
  const level = integer(attr(element, 'ilvl'), 0, 0, 8);
  const suffix = value(element, 'suff') ?? 'tab';
  const unsupported: string[] = [];
  const formatElement = child(element, 'numFmt');
  const format = attr(formatElement) ?? 'decimal';
  if (attr(formatElement, 'format') !== undefined) unsupported.push('Custom number formats require additional validation.');
  if (child(element, 'lvlPicBulletId')) unsupported.push('Picture bullets cannot be represented faithfully as text.');
  if (child(element, 'legacy')) unsupported.push('Legacy numbering layout is not supported.');
  const textElement = child(element, 'lvlText');
  const text = attr(textElement, 'null') === '1' || attr(textElement, 'null') === 'true' ? '' : attr(textElement) ?? '';
  const fonts = child(child(element, 'rPr'), 'rFonts');
  const names = [...new Set([attr(fonts, 'ascii'), attr(fonts, 'hAnsi')].filter((name): name is string => name !== undefined).map(name => name.trim().toLowerCase()))];
  // Theme-derived or conflicting font slots are not a verified mapping.
  const font = names.length === 1 && attr(fonts, 'asciiTheme') === undefined && attr(fonts, 'hAnsiTheme') === undefined ? attr(fonts, 'ascii') ?? attr(fonts, 'hAnsi') : undefined;
  const fontDependent = hasPrivateUse(text) || (names.some(name => /^(symbol|wingdings(?: [23])?|webdings)$/.test(name)) && /[\u0021-\u00ff]/u.test(text));
  if (format === 'bullet' && font === undefined && fontDependent && names.length > 0) unsupported.push('Ambiguous list font slots require font resolution.');
  if (format !== 'bullet' && format !== 'none') {
    if (hasPrivateUse(text)) unsupported.push('Font-specific list glyphs need a verified font mapping.');
    if (Array.from(text.matchAll(/%([1-9])/g)).some(match => Number(match[1]) > level + 1)) unsupported.push('Label references a deeper level; Word compatibility is not established for this template.');
  }
  if (!['tab', 'space', 'nothing'].includes(suffix)) unsupported.push(`Unsupported list suffix: ${suffix}`);
  const restart = integer(value(element, 'lvlRestart'), level, 0, 8);
  return {
    level,
    start: integer(value(element, 'start'), 0),
    format,
    text,
    font,
    restart: restart > level ? level : restart,
    suffix: suffix === 'tab' ? '\t' : suffix === 'space' ? ' ' : '',
    legal: on(child(element, 'isLgl')),
    styleId: value(element, 'pStyle'),
    indentation: readIndentation(child(element, 'pPr')),
    unsupported
  };
}

function mergeProperties(base: ParagraphProperties, next: ParagraphProperties): ParagraphProperties {
  return {
    styleId: next.styleId ?? base.styleId,
    numId: next.numId ?? base.numId,
    level: next.level ?? base.level,
    indentation: { ...base.indentation, ...next.indentation }
  };
}

/** A fresh resolver is created for each document; no global counters or DOM mutation. */
export class NumberingResolver {
  private readonly styles = new Map<string, Style>();
  private readonly abstracts = new Map<string, Abstract>();
  private readonly instances = new Map<string, Instance>();
  private readonly definitions = new Map<string, NumberingDefinition>();
  private readonly sequences = new Map<string, Sequence>();
  private defaults: ParagraphProperties = { indentation: {} };
  private defaultStyle?: string;

  constructor(numberingXml: string | undefined, stylesXml: string | undefined, parser: XmlParser) {
    if (stylesXml) {
      const root = parsePart(stylesXml, 'styles', parser);
      this.defaults = readProperties(child(child(child(root, 'docDefaults'), 'pPrDefault'), 'pPr'));
      for (const element of children(root, 'style')) {
        const id = attr(element, 'styleId');
        if (id === undefined) throw new Error('Style without styleId.');
        if (this.styles.has(id)) throw new Error(`Duplicate style: ${id}`);
        const type = attr(element, 'type') ?? 'paragraph';
        this.styles.set(id, { type, base: value(element, 'basedOn'), properties: readProperties(child(element, 'pPr')) });
        if (type === 'paragraph' && ['1', 'true', 'on'].includes(attr(element, 'default') ?? '')) this.defaultStyle = id;
      }
    }
    if (!numberingXml) return;
    const root = parsePart(numberingXml, 'numbering', parser);
    for (const element of children(root, 'abstractNum')) {
      const id = String(integer(attr(element, 'abstractNumId'), -1));
      if (id === '-1' || this.abstracts.has(id)) throw new Error('Missing or duplicate abstract numbering ID.');
      const levels = new Map<number, LevelDefinition>();
      for (const node of children(element, 'lvl')) {
        const definition = readLevel(node);
        if (levels.has(definition.level)) throw new Error('Duplicate numbering level.');
        levels.set(definition.level, definition);
      }
      this.abstracts.set(id, {
        levels,
        styleLink: value(element, 'numStyleLink'),
        restartAfterBreak: ['1', 'true'].includes(element.getAttributeNS('http://schemas.microsoft.com/office/word/2012/wordml', 'restartNumberingAfterBreak') ?? '')
      });
    }
    for (const element of children(root, 'num')) {
      const id = String(integer(attr(element, 'numId'), -1));
      if (id === '-1' || this.instances.has(id)) throw new Error('Missing or duplicate numbering instance ID.');
      const abstractId = String(integer(value(element, 'abstractNumId'), -1));
      const overrides: Instance['overrides'] = new Map();
      for (const node of children(element, 'lvlOverride')) {
        const level = integer(attr(node, 'ilvl'), 0, 0, 8);
        const start = value(node, 'startOverride');
        if (overrides.has(level)) throw new Error('Duplicate level override.');
        overrides.set(level, { start: start === undefined ? undefined : integer(start, 0), level: child(node, 'lvl') });
      }
      this.instances.set(id, { abstractId, overrides });
    }
  }

  private styleProperties(id: string | undefined, seen = new Set<string>()): ParagraphProperties {
    if (id === undefined) return { indentation: {} };
    if (seen.has(id)) throw new Error(`Cyclic style inheritance: ${id}`);
    const style = this.styles.get(id);
    if (!style) throw new Error(`Missing style: ${id}`);
    seen.add(id);
    return mergeProperties(this.styleProperties(style.base, seen), style.properties);
  }

  private definition(numId: string, seen = new Set<string>()): NumberingDefinition {
    const cached = this.definitions.get(numId);
    if (cached) return cached;
    if (seen.has(numId)) throw new Error(`Cyclic numbering style link: ${numId}`);
    seen.add(numId);
    const instance = this.instances.get(numId);
    if (!instance) throw new Error(`Missing numbering instance: ${numId}`);
    const abstract = this.abstracts.get(instance.abstractId);
    if (!abstract) throw new Error(`Missing abstract numbering definition: ${instance.abstractId}`);
    let resolved: NumberingDefinition = { abstractNumId: instance.abstractId, levels: abstract.levels, starts: new Map(), restartAfterBreak: abstract.restartAfterBreak };
    if (abstract.styleLink !== undefined) {
      const style = this.styles.get(abstract.styleLink);
      if (style?.type !== 'numbering') throw new Error(`Missing numbering style: ${abstract.styleLink}`);
      const target = this.styleProperties(abstract.styleLink).numId;
      if (target === undefined || target === '0') throw new Error('Numbering style has no usable numbering instance.');
      resolved = this.definition(target, seen);
    }
    const result: NumberingDefinition = { ...resolved, levels: new Map(resolved.levels), starts: new Map(resolved.starts) };
    for (const [level, override] of instance.overrides) {
      const base = result.levels.get(level);
      if (override.level) {
        const replacement = readLevel(override.level);
        if (replacement.level !== level) throw new Error('Level override index does not match its definition.');
        // Word 16 reference fixtures: nested start wins when present, then startOverride.
        // Restart still comes from the abstract definition (MS-OI29500 2.1.282).
        const start = value(override.level, 'start') !== undefined ? replacement.start : override.start ?? base?.start ?? 0;
        result.levels.set(level, { ...replacement, start, restart: base?.restart ?? level });
        result.starts.set(level, start);
      } else if (override.start !== undefined) {
        if (!base) throw new Error(`Start override references missing level: ${level}`);
        result.levels.set(level, { ...base, start: override.start });
        result.starts.set(level, override.start);
      }
    }
    this.definitions.set(numId, result);
    return result;
  }

  resolve(pPr: Element | undefined, index: number): Omit<ParagraphRecord, 'text' | 'index' | 'tablePath'> {
    const diagnostics: Diagnostic[] = [];
    const result: Omit<ParagraphRecord, 'text' | 'index' | 'tablePath'> = {
      styleId: null, numId: null, abstractNumId: null, level: null, label: '', suffix: '', numberingStatus: 'none', counters: [], indentation: {}, diagnostics
    };
    try {
      const direct = readProperties(pPr);
      const styleId = direct.styleId ?? this.defaultStyle;
      result.styleId = styleId ?? null;
      // Explicit cancellation works even if an inherited numbering definition is invalid.
      if (direct.numId === '0') { result.indentation = direct.indentation; return result; }
      const inherited = mergeProperties(this.defaults, this.styleProperties(styleId));
      const properties = mergeProperties(inherited, direct);
      result.indentation = properties.indentation;
      if (properties.numId === undefined || properties.numId === '0') return result;
      const numId = properties.numId;
      const level = properties.level ?? 0;
      result.numId = numId;
      result.level = level;
      result.numberingStatus = 'unresolved';
      result.label = null;
      const definition = this.definition(numId);
      result.abstractNumId = definition.abstractNumId;
      const current = definition.levels.get(level);
      if (!current) throw new Error(`Numbering ${numId} has no level ${level}.`);
      result.labelSource = { text: current.text, font: current.font };
      result.indentation = this.indentation(current, inherited, direct);
      result.suffix = current.suffix;
      if (definition.restartAfterBreak) throw new Error('Section-break numbering restarts require additional validation.');
      let sequence = this.sequences.get(definition.abstractNumId);
      if (!sequence) {
        sequence = { counters: Array<number | null>(9).fill(null), initialized: new Set() };
        this.sequences.set(definition.abstractNumId, sequence);
      }
      // Word shares counters through the underlying abstract definition; each instance's
      // start overrides take effect once, then the shared sequence continues.
      for (let i = 0; i <= level; i++) {
        const config = definition.levels.get(i);
        if (!config) throw new Error(`Numbering ${numId} has no ancestor level ${i}.`);
        const key = `${numId}:${i}`;
        const restartOnFirstUse = !sequence.initialized.has(key) && definition.starts.has(i);
        if (sequence.counters[i] === null || restartOnFirstUse) sequence.counters[i] = config.start;
        else if (i === level) sequence.counters[i] = (sequence.counters[i] ?? 0) + 1;
        sequence.initialized.add(key);
      }
      result.counters = [...sequence.counters];
      for (let i = level + 1; i < 9; i++) {
        const restart = definition.levels.get(i)?.restart ?? i;
        if (restart !== 0 && level < restart) sequence.counters[i] = null;
      }
      if (current.unsupported.length) throw new Error(current.unsupported.join(' '));
      result.label = this.label(current, definition, result.counters);
      result.numberingStatus = 'resolved';
    } catch (error) {
      result.numberingStatus = 'unresolved';
      result.label = null;
      diagnostics.push({ code: 'NUMBERING_UNRESOLVED', severity: 'error', paragraphIndex: index, message: error instanceof Error ? error.message : String(error) });
    }
    return result;
  }

  private indentation(level: LevelDefinition, inherited: ParagraphProperties, direct: ParagraphProperties): Indentation {
    // Word's list-level indentation overrides paragraph-style indentation;
    // explicit paragraph indentation remains the final override.
    return { ...this.defaults.indentation, ...inherited.indentation, ...level.indentation, ...direct.indentation };
  }

  private label(current: LevelDefinition, definition: NumberingDefinition, counters: Array<number | null>): string {
    if (current.format === 'none') return '';
    if (current.format === 'bullet') return resolveBulletLabel(current.text, current.font);
    // Validate even literal-only labels, so unknown formats are not silently accepted.
    formatNumber(counters[current.level] ?? current.start, current.format);
    return current.text.replace(/%([1-9])/g, (_token, digit: string) => {
      const level = Number(digit) - 1;
      if (level > current.level) return '';
      const config = definition.levels.get(level);
      if (!config) throw new Error(`Label references missing level ${level}.`);
      if (config.unsupported.length) throw new Error(config.unsupported.join(' '));
      const format = current.legal && config.format !== 'none' ? 'decimal' : config.format;
      return formatNumber(counters[level] ?? config.start, format);
    });
  }
}
