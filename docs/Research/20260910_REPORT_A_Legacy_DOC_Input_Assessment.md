# Legacy DOC input: evidence-based assessment

Date: 2026-09-10. Scope: determine whether a ready-made DOC parser meets RdLn's exact numbering/heading requirements, and whether DOC-to-DOCX preprocessing is practical. Research and isolated probes only; no application integration.

## Conclusion

Easy DOC text extraction exists. List-aware browser extraction also exists. No candidate investigated here is demonstrated to meet RdLn's exact fidelity requirement across legacy legal documents. This is not a proof that no adequate product exists.

The earlier suggestion that browser conversion requires a server or installed Office suite was incomplete: WebAssembly conversion engines are available. Conversion should be evaluated as an adapter into the existing numbering resolver, but its fidelity has not been validated in this investigation.

## RdLn context

The current application uses Mammoth extractRawText in src/services/DocxProcessor.ts. The specialised work is in prototypes/Docx Parser Prototypes/20260907_Prototype_A_NumberingResolver, described by docs/Sprint_Plans_WIP/20260907_DOCX_Numbering_Resolver_Plan.md. That prototype reconstructs numbering from document, styles and numbering XML, including inherited properties, cancellation and restart semantics. Its plan records independent Word reference captures and explicitly says main-app integration is separate.

## Executed local probes

Scratch directory: TempFiles/20260910_Research_A_DocInput. Packages installed only there, with installation scripts disabled. No root package or lockfile changes.

### word-extractor 1.0.4

Executed against three genuine OLE binary DOC fixtures downloaded from Apache POI: simple-list.doc, Lists.doc and lists-margins.doc. Signatures were d0cf11e0a1b11ae1; SHA-256 hashes and full outputs are in extraction-results.json.

Observed: paragraph text is extracted, but automatic numbering/bullet labels and list indentation are absent. For simple-list.doc, the three list paragraphs become 'First item in list', 'Second item in list', 'Third item in list', without 1/2/3 labels. On Lists.doc, bullet styles and nesting disappear.

Source inspection corroborates the result: word-ole-extractor.js builds output from text pieces; writeParagraphProperties handles a paragraph/table marker but does not reconstruct numbering. This candidate fails the essential list-label requirement.

- Source: https://github.com/morungos/node-word-extractor/blob/develop/lib/word-ole-extractor.js
- Apache fixtures: https://github.com/apache/poi/tree/trunk/test-data/document
- Apache list assertions: https://github.com/apache/poi/blob/trunk/poi-scratchpad/src/test/java/org/apache/poi/hwpf/usermodel/TestLists.java
- Reproduce: node TempFiles/20260910_Research_A_DocInput/20260910_Probe_B_Extract.cjs

### @firecrawl/anydoc-wasm 0.2.4

Executed the browser-targeted WASM package locally in Node, passing module bytes to initSync as documented. This establishes package execution, not browser UI or deployment verification. Installed WASM size: 6,691,779 bytes, uncompressed.

On the same three DOC files it preserves basic decimal numbering and nested list labels. It recognises the unnumbered heading in Lists.doc. However, different DOC bullet symbols are normalised to the same bullet representation; the returned document model also uses a generic bullet marker. The Markdown output adds syntax around compound/nondecimal labels. A custom serializer can remove Markdown syntax, but cannot recover information absent from the model.

Also tested six existing DOCX numbering fixtures as a separate fidelity cross-check. Three have concrete mismatches against the independently captured Word reference:

| Fixture | Word labels | anydoc labels |
| --- | --- | --- |
| style-inheritance-and-cancellation | 1., none, 2., 3. | (a), none, (b), 1. |
| instance-restart-resume | 1., 2., 1., 2., 3., 4. | 1., 2., 1., 2., 3., 3. |
| inherited-style-level | (a), (b), 2., (a) | 1., 2., 3., 4. |

Reference metadata: Word 16.0, build 16.0.20326; captured 2026-09-07T13:54:17.3632119Z. Verified all three reference fixture hashes and compared the DOCX XML parts to the fixture definitions. All checks matched. Full evidence: anydoc-results.json and verified-cross-checks.json.

Important limit: the DOCX failures do NOT prove identical failures in anydoc's separate DOC parser. They demonstrate that its broad source-numbering claim is insufficient to certify it against RdLn's fidelity standard. Complex DOC continuation/style inheritance remains unverified here.

- Documentation: https://github.com/firecrawl/anydoc
- Browser API: https://github.com/firecrawl/anydoc/blob/main/wasm/README.md
- Reproduce: node TempFiles/20260910_Research_A_DocInput/20260910_Probe_C_Anydoc.mjs
- Verify reference provenance: node TempFiles/20260910_Research_A_DocInput/20260910_Probe_D_References.mjs

## Other evaluated options: documentation evidence, not local certification

### Aspose.Words

Commercial engine supporting DOC input, DOCX output and list-aware plain-text output; its TXT examples explicitly include decimal, letter and Roman list labels. Thus it is a real alternative to implementing list extraction from scratch, not merely a raw-text reader. Node.js via .NET is a desktop/server route, not a browser JS drop-in.

A particularly relevant historical defect: the account 'draftable' reported missing top-level numbering when converting DOC to DOCX with Aspose.Words 24.9.0 on 2024-10-03. Aspose opened WORDSNET-27437. The inspected public thread contains no resolution update. This establishes a historical failure, NOT that the latest release is still affected. Its attached reproduction is private; download was denied, so it was not tested.

- Formats: https://docs.aspose.com/words/nodejs-net/supported-document-formats/
- List-aware text example: https://reference.aspose.com/words/net/aspose.words.saving/txtsaveoptions/listindentation/
- Defect: https://forum.aspose.com/t/doc-to-docx-conversion-numbering-issue/291932

### LibreOffice and LibreOffice WASM

Native LibreOffice supports headless DOC conversion to DOCX. It was not installed at the standard local path checked.

The @matbee/libreoffice-converter project documents both DOC input and DOCX output in Node and browsers, using LibreOffice compiled to WASM. Browser deployment requires cross-origin isolation headers in its documented configuration. Its npm documentation reports a substantial initial browser download (approximately 240 MB); treat this as package documentation, not a measured transfer size here. It was not installed or benchmarked. This is a practical local conversion candidate, with bundle/deployment overhead and unverified exact numbering fidelity.

- Native conversion: https://help.libreoffice.org/latest/en-US/text/shared/guide/convertfilters.html
- WASM project: https://github.com/matbeedotcom/libreoffice-document-converter
- Package size guidance: https://www.npmjs.com/package/@matbee/libreoffice-converter?activeTab=dependencies

### Zrimo

Browser Rust/WASM DOC parser with in-memory DOCX serialization. The project's compatibility matrix explicitly states that some advanced table/list variants remain incomplete. This matches the proposed preprocessing architecture, but is not a flawless general converter. No local execution performed.

- https://github.com/bnku/zrimo/blob/main/docs/compatibility.md

### Native Documents docx-wasm

The package documents binary DOC-to-DOCX conversion, and the publisher supplies a browser demonstration. The browser README requires vendor credentials/licensing and contains old demo/offline limitations. Current commercial availability and fidelity were not established. It is a lead, not a recommended dependency.

- https://www.npmjs.com/package/@nativedocuments/docx-wasm?activeTab=dependencies
- https://github.com/NativeDocuments/docx-wasm-client-side

### Apache POI, Antiword/WV, catdoc

POI provides a richer DOC object model, but its own documentation describes HWPF/XWPF as moderately functional and warns that some uses need low-level work. It is Java, not a drop-in browser parser.

A 2022 Microsoft Open Specifications discussion documents incorrect continuation in Antiword/WV; Microsoft confirmed that multiple list overrides pointing to the same list identity must be treated as one list. This is historical evidence of the exact semantic difficulty, not a current-version test.

catdoc's stated objective is plain-text extraction; its documentation does not promise preservation of Word formatting.

- https://poi.apache.org/components/document/index.html
- https://learn.microsoft.com/en-gb/answers/questions/944238/word-doc-binary-file-format-query-regarding-preser
- https://www.wagner.pp.ru/~vitus/software/catdoc/

## Attempted Word conversion test and limitations

Word is installed. A scratch-only script was created to copy synthetic DOCX fixtures, save binary DOC copies, reopen them to capture Word labels, and save converted DOCX files. The sandbox could not create Word COM (80070520). An approved out-of-sandbox run created its own hidden Word instance with macros disabled, but stalled opening the first scratch copy before any conversion completed. The run was cancelled, and only the verified research automation process was stopped. The pre-existing Word process was not stopped.

Therefore there are NO successful Word conversion results from this investigation, no successful DOC-to-DOCX round-trip benchmark, and no full legal-document DOC corpus validation. The public DOC linked in the Microsoft discussion was also inaccessible (403). No user documents were uploaded.

## Decision supported by evidence

1. Reject word-extractor as a fidelity-preserving importer.
2. Keep anydoc as a real lightweight candidate for ordinary DOC extraction, but do not call it flawless or substitute it for the established resolver without a DOC-specific exact-label corpus.
3. For reusing RdLn's XML work, evaluate DOC-to-DOCX conversion through Word on Windows installations with Word, or LibreOffice/Aspose where appropriate. Browser-only conversion is feasible with WASM; engine size and compatibility are product tradeoffs.
4. Certification requires matching numbered AND unnumbered paragraph text, labels, suppression, inheritance, restart/continuation and table ordering against Word captures from actual DOC files. A successful conversion API call does not certify those semantics.

No application code or existing prototype source was changed. This report and the scratch probes are the deliverables.
