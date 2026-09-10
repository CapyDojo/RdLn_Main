export type XmlParser = (xml: string) => Document;

export interface DocxParts {
  documentXml: string;
  numberingXml?: string;
  stylesXml?: string;
}

export interface Diagnostic {
  code: string;
  message: string;
  severity: 'warning' | 'error';
  paragraphIndex?: number;
}

/** Raw twips are retained; the plain-text serializer does not emulate page layout. */
export interface Indentation {
  left?: number;
  right?: number;
  hanging?: number;
  firstLine?: number;
  start?: number;
  end?: number;
}

export interface ParagraphRecord {
  index: number;
  text: string;
  styleId: string | null;
  /** Table / row / cell indices, repeated for nested tables. */
  tablePath: number[];
  numId: string | null;
  abstractNumId: string | null;
  level: number | null;
  /** Empty for unnumbered paragraphs; null means a label could not be resolved. */
  label: string | null;
  /** Original list template and explicit font, retained before Unicode conversion. */
  labelSource?: { text: string; font?: string };
  suffix: string;
  numberingStatus: 'none' | 'resolved' | 'unresolved';
  counters: Array<number | null>;
  indentation: Indentation;
  diagnostics: Diagnostic[];
}

export interface ExtractionResult {
  paragraphs: ParagraphRecord[];
  text: string;
  diagnostics: Diagnostic[];
  /** Supported main-story semantics only; this is not a document-layout guarantee. */
  complete: boolean;
}

export interface ParagraphProperties {
  styleId?: string;
  numId?: string;
  level?: number;
  indentation: Indentation;
}

export interface LevelDefinition {
  level: number;
  start: number;
  format: string;
  text: string;
  font?: string;
  restart: number;
  suffix: string;
  legal: boolean;
  styleId?: string;
  indentation: Indentation;
  unsupported: string[];
}

export interface NumberingDefinition {
  abstractNumId: string;
  levels: Map<number, LevelDefinition>;
  /** Overrides are per instance, while Word's underlying sequence may be shared. */
  starts: Map<number, number>;
  restartAfterBreak: boolean;
}
