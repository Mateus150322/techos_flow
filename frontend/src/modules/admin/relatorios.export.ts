import {
  escapeHtml,
  type ReportDefinition,
  type ResumoRelatorios,
} from "./relatorios.utils";

function buildExportRows(reportDefinition: ReportDefinition) {
  return reportDefinition.rows.map((row) =>
    reportDefinition.columns.map((column) => row[column.key] ?? "")
  );
}

function baixarArquivo(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");

  anchor.href = url;
  anchor.download = fileName;
  anchor.click();

  URL.revokeObjectURL(url);
}

export function exportarCsv(reportDefinition: ReportDefinition) {
  const rows = [
    reportDefinition.columns.map((column) => column.label),
    ...buildExportRows(reportDefinition),
  ];
  const lines = rows.map((row) =>
    row.map((value) => `"${String(value).replaceAll('"', '""')}"`).join(",")
  );

  baixarArquivo(
    new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8;" }),
    "relatorio-techos-flow.csv"
  );
}

export function exportarExcel({
  reportDefinition,
  resumo,
  dataEmissao,
  periodoDescricao,
  filtrosDescricao,
}: {
  reportDefinition: ReportDefinition;
  resumo: ResumoRelatorios;
  dataEmissao: string;
  periodoDescricao: string;
  filtrosDescricao: string;
}) {
  const summaryRows = [
    ["TechOS Flow", ""],
    [reportDefinition.title, ""],
    ["Data de emissao", dataEmissao],
    ["Periodo", periodoDescricao],
    ["Filtros aplicados", filtrosDescricao],
    ["", ""],
    ["Resumo", ""],
    ["Total de OS", String(resumo.total)],
    ["Abertas", String(resumo.abertas)],
    ["Em execucao", String(resumo.emExecucao)],
    ["Finalizadas", String(resumo.finalizadas)],
    ["Nao executadas", String(resumo.naoExecutadas)],
    ["Canceladas", String(resumo.canceladas)],
  ];

  const summaryTable = `
    <table>
      <tbody>
        ${summaryRows
          .map(
            (row) =>
              `<tr>${row.map((cell) => `<td>${escapeHtml(String(cell))}</td>`).join("")}</tr>`
          )
          .join("")}
      </tbody>
    </table>
  `;

  const detailTable = `
    <table>
      <thead>
        <tr>${reportDefinition.columns
          .map((column) => `<th>${escapeHtml(column.label)}</th>`)
          .join("")}</tr>
      </thead>
      <tbody>
        ${buildExportRows(reportDefinition)
          .map(
            (row) =>
              `<tr>${row.map((cell) => `<td>${escapeHtml(String(cell))}</td>`).join("")}</tr>`
          )
          .join("")}
      </tbody>
    </table>
  `;

  const html = `
    <html xmlns:o="urn:schemas-microsoft-com:office:office"
          xmlns:x="urn:schemas-microsoft-com:office:excel"
          xmlns="http://www.w3.org/TR/REC-html40">
      <head><meta charset="utf-8"></head>
      <body>
        ${summaryTable}
        <br />
        ${detailTable}
      </body>
    </html>
  `;

  baixarArquivo(
    new Blob([html], { type: "application/vnd.ms-excel;charset=utf-8;" }),
    "relatorio-techos-flow.xls"
  );
}

export function exportarPdf({
  reportDefinition,
  resumo,
  dataEmissao,
  periodoDescricao,
  filtrosDescricao,
  responsavelEmissao,
}: {
  reportDefinition: ReportDefinition;
  resumo: ResumoRelatorios;
  dataEmissao: string;
  periodoDescricao: string;
  filtrosDescricao: string;
  responsavelEmissao: string;
}) {
  const printWindow = window.open("", "_blank", "width=1100,height=800");

  if (!printWindow) {
    return;
  }

  const rowsHtml = buildExportRows(reportDefinition)
    .map(
      (row) =>
        `<tr>${row.map((cell) => `<td>${escapeHtml(String(cell))}</td>`).join("")}</tr>`
    )
    .join("");

  printWindow.document.write(`
    <html>
      <head>
        <title>${escapeHtml(reportDefinition.title)} - TechOS Flow</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 28px; color: #0f172a; }
          h1 { margin: 0 0 4px; font-size: 24px; }
          h2 { margin: 0 0 12px; font-size: 18px; }
          .muted { color: #475569; font-size: 12px; }
          .section { margin-top: 22px; }
          .summary { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin-top: 14px; }
          .metric { border: 1px solid #e2e8f0; border-radius: 12px; padding: 14px; }
          .metric strong { display: block; font-size: 24px; margin-bottom: 6px; }
          table { width: 100%; border-collapse: collapse; margin-top: 14px; }
          th, td { border: 1px solid #e2e8f0; padding: 8px; text-align: left; font-size: 11px; vertical-align: top; }
          th { background: #f8fafc; }
          .footer { margin-top: 18px; font-size: 12px; color: #475569; }
        </style>
      </head>
      <body>
        <h1>TechOS Flow</h1>
        <h2>${escapeHtml(reportDefinition.title)}</h2>
        <div class="muted">Data de emissao: ${escapeHtml(dataEmissao)}</div>
        <div class="muted">Periodo: ${escapeHtml(periodoDescricao)}</div>
        <div class="muted">Filtros aplicados: ${escapeHtml(filtrosDescricao)}</div>

        <div class="section">
          <h2>Resumo</h2>
          <div class="summary">
            <div class="metric"><strong>${resumo.total}</strong>Total de OS</div>
            <div class="metric"><strong>${resumo.abertas}</strong>Abertas</div>
            <div class="metric"><strong>${resumo.emExecucao}</strong>Em execucao</div>
            <div class="metric"><strong>${resumo.finalizadas}</strong>Finalizadas</div>
            <div class="metric"><strong>${resumo.naoExecutadas}</strong>Nao executadas</div>
            <div class="metric"><strong>${resumo.canceladas}</strong>Canceladas</div>
          </div>
        </div>

        <div class="section">
          <h2>Tabela principal</h2>
          <table>
            <thead>
              <tr>${reportDefinition.columns
                .map((column) => `<th>${escapeHtml(column.label)}</th>`)
                .join("")}</tr>
            </thead>
            <tbody>${rowsHtml}</tbody>
          </table>
        </div>

        <div class="footer">
          <div>Total de registros: ${reportDefinition.rows.length}</div>
          <div>Responsavel pela emissao: ${escapeHtml(responsavelEmissao)}</div>
          <div>Observacoes finais: Relatorio gerado automaticamente pelo TechOS Flow.</div>
        </div>
      </body>
    </html>
  `);

  printWindow.document.close();
  printWindow.focus();
  printWindow.print();
}
