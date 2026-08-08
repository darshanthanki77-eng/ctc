/**
 * Utility functions for exporting data to CSV/Excel and print-friendly PDF.
 */

export const exportToCSV = (data, filename = 'export.csv') => {
  if (!data || !data.length) return;
  const headers = Object.keys(data[0]).join(',');
  const rows = data.map(row => 
    Object.values(row)
      .map(val => {
        let cleanVal = val === null || val === undefined ? '' : String(val);
        // escape double quotes
        cleanVal = cleanVal.replace(/"/g, '""');
        return `"${cleanVal}"`;
      })
      .join(',')
  );
  
  const csvContent = [headers, ...rows].join('\n');
  const blob = new Blob([new Uint8Array([0xEF, 0xBB, 0xBF]), csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

export const exportToPDF = (title, headers, rows) => {
  const printWindow = window.open('', '_blank');
  if (!printWindow) return;
  
  const htmlContent = `
    <html>
      <head>
        <title>${title}</title>
        <style>
          body { font-family: system-ui, -apple-system, sans-serif; padding: 30px; color: #1e293b; background-color: #ffffff; }
          .header-container { display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #f310fd; padding-bottom: 12px; margin-bottom: 24px; }
          h1 { color: #f310fd; margin: 0; font-size: 24px; font-weight: 800; }
          .meta-info { font-size: 12px; color: #64748b; font-weight: 500; }
          table { width: 100%; border-collapse: collapse; margin-top: 10px; }
          th, td { border: 1px solid #cbd5e1; padding: 8px 12px; text-align: left; font-size: 11px; }
          th { background-color: #f1f5f9; font-weight: 700; color: #334155; text-transform: uppercase; letter-spacing: 0.05em; }
          tr:nth-child(even) { background-color: #f8fafc; }
          @media print {
            body { padding: 0; }
            button { display: none; }
          }
        </style>
      </head>
      <body>
        <div class="header-container">
          <h1>${title}</h1>
          <div class="meta-info">Generated: ${new Date().toLocaleString()}</div>
        </div>
        <table>
          <thead>
            <tr>
              ${headers.map(h => `<th>${h}</th>`).join('')}
            </tr>
          </thead>
          <tbody>
            ${rows.map(row => `
              <tr>
                ${row.map(cell => `<td>${cell === null || cell === undefined ? '' : cell}</td>`).join('')}
              </tr>
            `).join('')}
          </tbody>
        </table>
        <script>
          window.onload = function() {
            setTimeout(function() {
              window.print();
              window.close();
            }, 500);
          };
        </script>
      </body>
    </html>
  `;
  printWindow.document.write(htmlContent);
  printWindow.document.close();
};
