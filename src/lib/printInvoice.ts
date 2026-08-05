/**
 * Mobile-safe invoice printing / PDF export.
 *
 * `window.open('', '_blank') + document.write` is blocked by most mobile
 * browsers (popup blockers, iOS Safari), which made "Download PDF" fail on
 * phones. Printing through a hidden same-page iframe works everywhere and
 * lets the user pick "Save as PDF" from the native print sheet.
 */
export function printInvoiceHtml(title: string, bodyHtml: string) {
  const doc = `<!DOCTYPE html>
<html><head><meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>${title}</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: 'Inter', Arial, sans-serif; padding: 24px; color: #1a1a1a; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  img { max-width: 100%; }
  @page { margin: 12mm; }
  @media print { body { padding: 0; } }
</style></head><body>${bodyHtml}</body></html>`;

  const iframe = document.createElement('iframe');
  iframe.setAttribute('aria-hidden', 'true');
  iframe.style.position = 'fixed';
  iframe.style.right = '0';
  iframe.style.bottom = '0';
  iframe.style.width = '0';
  iframe.style.height = '0';
  iframe.style.border = '0';
  iframe.srcdoc = doc;

  let done = false;
  const cleanup = () => {
    if (done) return;
    done = true;
    setTimeout(() => iframe.remove(), 1000);
  };

  iframe.onload = () => {
    try {
      const win = iframe.contentWindow;
      if (!win) throw new Error('no frame window');
      win.focus();
      win.onafterprint = cleanup;
      win.print();
      // Safari never fires onafterprint reliably — clean up defensively.
      setTimeout(cleanup, 60000);
    } catch {
      cleanup();
      // Last-resort fallback: open a new tab with the invoice markup.
      const w = window.open('', '_blank');
      if (w) {
        w.document.write(doc);
        w.document.close();
        w.focus();
      }
    }
  };

  document.body.appendChild(iframe);
}
