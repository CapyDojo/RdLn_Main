/* @vitest-environment jsdom */
import { describe, it, expect } from 'vitest';
import JSZip from 'jszip';
import { exportHtmlDiffToDocx } from '../../../src/lib/docxExport';

const sampleHtml = `
<div style="font-family: serif; line-height: 1.6; white-space: pre-wrap;">
  <span>This is normal text. </span>
  <span style="background-color:#dcfce7; color:#166534; border:1px solid #bbf7d0; text-decoration:underline; text-decoration-thickness:2px; text-decoration-color:#16a34a;">This text was added</span>
  <span> and this continues normally. </span>
  <span style="background-color:#fef2f2; color:#991b1b; border:1px solid #fecaca; text-decoration:line-through; text-decoration-thickness:2px; text-decoration-color:#dc2626;">This text was removed</span>
  <span> and here’s more normal text. The </span>
  <span style="background-color:#fef2f2; color:#991b1b; border:1px solid #fecaca; text-decoration:line-through;">old version</span>
  <span style="background-color:#dcfce7; color:#166534; border:1px solid #bbf7d0; text-decoration:underline;">new version</span>
  <span> shows a change.</span>
</div>`;

const multiParaHtml = `
<div>First paragraph equal <span style="text-decoration:underline">insert</span> and <span style="text-decoration:line-through">delete</span>.</div>\n\n<div>Second paragraph unchanged.</div>`;

async function extractDocXml(docxBytes: Uint8Array): Promise<string> {
  const zip = await JSZip.loadAsync(docxBytes);
  const file = zip.file('word/document.xml');
  if (!file) throw new Error('word/document.xml missing');
  return await file.async('string');
}

describe('DOCX export (Track Changes)', () => {
  it('emits <w:ins> and <w:delText> for underlined/struck spans', async () => {
    const bytes = await exportHtmlDiffToDocx(sampleHtml, { author: 'Kai', date: new Date('2025-08-10T10:00:00Z') });
    expect(bytes.byteLength).toBeGreaterThan(0);

    const xml = await extractDocXml(bytes);
    expect(xml).toContain('<w:ins');
    expect(xml).toContain('<w:delText');
    // ensure xml:space is preserved on normals
    expect(xml).toContain('xml:space="preserve"');
  });

  it('creates multiple <w:p> for multi-paragraph input', async () => {
    const bytes = await exportHtmlDiffToDocx(multiParaHtml, { author: 'RdLn' });
    const xml = await extractDocXml(bytes);
    const pCount = (xml.match(/<w:p>/g) || []).length;
    expect(pCount).toBeGreaterThanOrEqual(2);
  });
});
