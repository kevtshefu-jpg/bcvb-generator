export function usePrintableExport() {
  const printHtml = (html: string, title: string) => {
    const printWindow = window.open("", "_blank", "width=1000,height=800");
    if (!printWindow) return;

    printWindow.document.open();
    printWindow.document.write(`
      <html>
        <head>
          <title>${title}</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              margin: 24px;
              color: #1a1a1a;
            }
            .sheet {
              max-width: 900px;
              margin: 0 auto;
            }
            .header {
              border-bottom: 3px solid #C8102E;
              padding-bottom: 12px;
              margin-bottom: 20px;
            }
            .title {
              font-size: 28px;
              font-weight: 800;
              margin-bottom: 6px;
            }
            .subtitle {
              color: #666;
              font-size: 14px;
            }
            .grid {
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 14px;
              margin-bottom: 16px;
            }
            .card {
              border: 1px solid #ddd;
              border-radius: 12px;
              padding: 14px;
              page-break-inside: avoid;
            }
            .card-title {
              color: #9B0B22;
              font-weight: 800;
              margin-bottom: 8px;
            }
            .meta-row {
              display: flex;
              justify-content: space-between;
              gap: 10px;
              padding: 6px 0;
              border-bottom: 1px dashed #ddd;
            }
            .meta-row:last-child {
              border-bottom: none;
            }
            .diagram-placeholder {
              height: 340px;
              border: 2px dashed #bbb;
              border-radius: 12px;
              display: flex;
              align-items: center;
              justify-content: center;
              color: #777;
              font-weight: 700;
              margin-top: 8px;
            }
            .chips {
              display: flex;
              flex-wrap: wrap;
              gap: 8px;
            }
            .chip {
              border: 1px solid rgba(200,16,46,0.2);
              background: rgba(200,16,46,0.06);
              color: #9B0B22;
              border-radius: 999px;
              padding: 6px 10px;
              font-size: 12px;
              font-weight: 700;
            }
            @media print {
              body {
                margin: 0;
              }
            }
          </style>
        </head>
        <body>${html}</body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
  };

  return { printHtml };
}
