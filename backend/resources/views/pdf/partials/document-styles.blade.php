<style>
  @page {
    margin: 12mm 10mm 14mm 10mm;
  }

  * {
    box-sizing: border-box;
  }

  body {
    margin: 0;
    font-family: DejaVu Sans, sans-serif;
    font-size: 11px;
    color: #0f172a;
    background: #ffffff;
  }

  .page-shell {
    border: 1px solid #dbe7fb;
    border-radius: 18px;
    padding: 18px 18px 14px;
    background: #ffffff;
  }

  .brand-table,
  .meta-card-grid,
  .metric-grid,
  .info-table,
  .data-table,
  .simple-table {
    width: 100%;
    border-collapse: separate;
    border-spacing: 0;
  }

  .brand-table td {
    vertical-align: top;
  }

  .brand-badge {
    width: 52px;
    height: 52px;
    border-radius: 14px;
    background: #0a4f96;
    color: #ffffff;
    text-align: center;
    font-size: 34px;
    font-weight: 700;
    line-height: 52px;
  }

  .brand-name {
    font-size: 30px;
    font-weight: 700;
    color: #0f2f66;
    letter-spacing: -0.03em;
  }

  .brand-name .accent {
    color: #2563eb;
  }

  .brand-skyline {
    text-align: right;
    color: #bfd2f4;
    font-size: 12px;
    line-height: 1.3;
  }

  .report-title {
    margin: 14px 0 14px;
    font-size: 24px;
    font-weight: 700;
    color: #133b7a;
  }

  .divider {
    border-top: 2px solid #2b6eea;
    margin: 0 0 16px;
  }

  .section {
    margin-top: 16px;
    page-break-inside: avoid;
  }

  .section-title {
    margin: 0 0 8px;
    font-size: 13px;
    font-weight: 700;
    color: #153d7a;
  }

  .meta-card-grid td,
  .metric-grid td {
    padding-right: 10px;
    vertical-align: top;
  }

  .meta-card-grid td:last-child,
  .metric-grid td:last-child {
    padding-right: 0;
  }

  .meta-card,
  .metric-card,
  .panel,
  .text-panel {
    border: 1px solid #d7e3f8;
    border-radius: 14px;
    background: #ffffff;
  }

  .meta-card {
    padding: 12px 14px;
    min-height: 74px;
  }

  .meta-label {
    font-size: 10px;
    color: #64748b;
    text-transform: uppercase;
    letter-spacing: 0.08em;
  }

  .meta-value {
    margin-top: 6px;
    font-size: 14px;
    font-weight: 700;
    color: #0f172a;
  }

  .metric-card {
    min-height: 88px;
    padding: 12px 10px;
    text-align: center;
  }

  .metric-label {
    font-size: 11px;
    color: #334155;
    min-height: 26px;
  }

  .metric-value {
    margin-top: 8px;
    font-size: 24px;
    font-weight: 700;
    color: #2563eb;
  }

  .metric-green { color: #1f9c59; }
  .metric-amber { color: #d97706; }
  .metric-red { color: #dc2626; }
  .metric-slate { color: #334155; }
  .metric-purple { color: #7c3aed; }
  .metric-cyan { color: #0891b2; }

  .panel {
    overflow: hidden;
  }

  .panel-soft {
    background: linear-gradient(180deg, #f8fbff 0%, #ffffff 100%);
  }

  .panel-body {
    padding: 12px;
  }

  .panel-header {
    padding: 8px 12px;
    background: #0a4f96;
    color: #ffffff;
    font-size: 12px;
    font-weight: 700;
  }

  .info-table td {
    padding: 7px 10px;
    border-bottom: 1px solid #e5edf9;
    vertical-align: top;
  }

  .info-table tr:last-child td {
    border-bottom: 0;
  }

  .info-label {
    width: 38%;
    color: #153d7a;
    font-weight: 700;
  }

  .info-value {
    color: #0f172a;
  }

  .data-table th,
  .data-table td,
  .simple-table th,
  .simple-table td {
    padding: 8px 9px;
    border-right: 1px solid #d7e3f8;
    border-bottom: 1px solid #d7e3f8;
    vertical-align: top;
  }

  .data-table th:last-child,
  .data-table td:last-child,
  .simple-table th:last-child,
  .simple-table td:last-child {
    border-right: 0;
  }

  .data-table thead th,
  .simple-table thead th {
    background: #0a4f96;
    color: #ffffff;
    font-size: 11px;
    font-weight: 700;
    text-align: left;
  }

  .data-table tbody tr:nth-child(even) td,
  .simple-table tbody tr:nth-child(even) td {
    background: #f8fbff;
  }

  .data-table-compact th,
  .data-table-compact td {
    padding: 6px 7px;
    font-size: 10px;
  }

  .operational-table td {
    line-height: 1.35;
    word-break: break-word;
  }

  .total-row td {
    font-weight: 700;
    background: #eef4ff !important;
    color: #153d7a;
  }

  .text-panel {
    padding: 12px 14px;
    line-height: 1.55;
    color: #1e293b;
  }

  .filter-summary {
    line-height: 1.5;
  }

  .summary-copy {
    margin-top: 6px;
    color: #1e293b;
    font-size: 12px;
  }

  .badge {
    display: inline-block;
    padding: 3px 8px;
    border-radius: 999px;
    font-size: 10px;
    font-weight: 700;
    line-height: 1.25;
    border: 1px solid transparent;
  }

  .badge-info {
    background: #e0f2fe;
    color: #075985;
    border-color: #bae6fd;
  }

  .badge-success {
    background: #dcfce7;
    color: #166534;
    border-color: #bbf7d0;
  }

  .badge-warning {
    background: #fef3c7;
    color: #92400e;
    border-color: #fde68a;
  }

  .badge-danger {
    background: #fee2e2;
    color: #b91c1c;
    border-color: #fecaca;
  }

  .badge-neutral {
    background: #e5e7eb;
    color: #374151;
    border-color: #d1d5db;
  }

  .notes {
    margin: 0;
    padding-left: 18px;
    color: #334155;
  }

  .notes li {
    margin-bottom: 4px;
  }

  .signature-block {
    margin-top: 18px;
  }

  .signature-line {
    margin-top: 26px;
    width: 300px;
    border-top: 1px solid #64748b;
    padding-top: 6px;
    font-size: 10px;
    color: #64748b;
  }

  .footer {
    margin-top: 18px;
    padding-top: 10px;
    border-top: 2px solid #2b6eea;
    font-size: 10px;
    color: #475569;
  }

  .footer-right {
    text-align: right;
  }

  .summary-grid,
  .two-column-grid,
  .photo-grid {
    width: 100%;
    border-collapse: separate;
    border-spacing: 0;
  }

  .summary-grid td,
  .two-column-grid td,
  .photo-grid td {
    vertical-align: top;
  }

  .summary-grid td {
    width: 25%;
    padding-right: 10px;
  }

  .summary-grid td:last-child,
  .two-column-grid td:last-child,
  .photo-grid td:last-child {
    padding-right: 0;
  }

  .summary-card {
    border: 1px solid #d7e3f8;
    border-radius: 14px;
    padding: 12px;
    min-height: 86px;
    background: #ffffff;
  }

  .summary-kicker {
    font-size: 10px;
    color: #64748b;
    text-transform: uppercase;
    letter-spacing: 0.08em;
  }

  .summary-text {
    margin-top: 8px;
    font-size: 16px;
    font-weight: 700;
    color: #0f172a;
  }

  .summary-text.blue { color: #2563eb; }
  .summary-text.green { color: #1f9c59; }
  .summary-text.amber { color: #d97706; }
  .summary-text.red { color: #dc2626; }
  .summary-text.slate { color: #334155; }

  .two-column-grid td {
    width: 50%;
    padding-right: 12px;
  }

  .two-column-grid-stack td {
    display: block;
    width: 100%;
    padding-right: 0;
  }

  .two-column-grid-stack tr td + td {
    padding-top: 12px;
  }

  .stack-gap {
    margin-top: 12px;
  }

  .page-break-before {
    page-break-before: always;
  }

  .placeholder-text {
    color: #64748b;
    font-style: italic;
  }

  .photo-grid td {
    width: 33.33%;
    padding-right: 10px;
  }

  .report-os-sheet {
    page-break-before: always;
  }

  .report-os-panel-body {
    padding: 9px;
  }

  .report-os-summary {
    font-size: 9px;
    line-height: 1.3;
  }

  .report-os-context {
    padding: 6px 8px;
    font-size: 9px;
    line-height: 1.3;
  }

  .report-photo-placeholder-cell {
    border: 0;
    padding: 0;
    background: transparent !important;
  }

  .photo-grid tr + tr td {
    padding-top: 10px;
  }

  .photo-card {
    border: 1px solid #d7e3f8;
    border-radius: 14px;
    padding: 10px;
    background: #ffffff;
  }

  .photo-label {
    margin: 0 0 8px;
    font-size: 11px;
    font-weight: 700;
    color: #153d7a;
  }

  .photo-frame {
    border: 1px solid #e5edf9;
    border-radius: 12px;
    min-height: 150px;
    padding: 8px;
    text-align: center;
    background: #f8fbff;
  }

  .photo-frame img {
    width: 100%;
    height: auto;
    border-radius: 8px;
  }

  .photo-empty {
    padding-top: 58px;
    font-size: 10px;
    color: #64748b;
  }

  .photo-meta {
    margin-top: 10px;
    padding: 8px 9px;
    border: 1px solid #e5edf9;
    border-radius: 10px;
    background: #f8fbff;
  }

  .report-photo-grid {
    table-layout: fixed;
  }

  .report-photo-grid td {
    width: 50%;
    padding-right: 10px;
  }

  .report-photo-grid .photo-card {
    padding: 8px;
  }

  .report-photo-grid .photo-label {
    margin-bottom: 6px;
    font-size: 10px;
  }

  .report-photo-grid .photo-frame {
    min-height: 146px;
    max-height: 158px;
    padding: 6px;
    overflow: hidden;
  }

  .report-photo-grid .photo-frame img {
    width: 100%;
    max-width: 100%;
    max-height: 146px;
    height: auto;
    object-fit: contain;
    border-radius: 6px;
  }

  .report-photo-grid .photo-meta {
    margin-top: 6px;
    padding: 6px 7px;
  }

  .report-photo-grid .photo-meta-title {
    margin-bottom: 4px;
    font-size: 8px;
  }

  .report-photo-grid .photo-meta-row {
    margin-bottom: 2px;
  }

  .report-photo-grid .photo-meta-label {
    font-size: 7px;
  }

  .report-photo-grid .photo-meta-value,
  .report-photo-grid .photo-meta-empty {
    font-size: 8px;
    line-height: 1.25;
  }

  .report-photo-grid .photo-meta-block {
    margin-top: 4px;
    padding-top: 4px;
  }

  .report-single-evidence-label {
    margin-bottom: 8px;
    font-size: 11px;
  }

  .report-single-evidence-grid {
    width: 100%;
    border-collapse: separate;
    border-spacing: 0;
  }

  .report-single-evidence-grid td {
    vertical-align: top;
  }

  .report-single-evidence-photo-cell {
    width: 56%;
    padding-right: 12px;
  }

  .report-single-evidence-meta-cell {
    width: 44%;
    padding-right: 0;
  }

  .report-single-evidence-frame {
    min-height: 220px;
    max-height: 240px;
    padding: 8px;
    overflow: hidden;
  }

  .report-single-evidence-frame img {
    width: 100%;
    max-width: 100%;
    max-height: 220px;
    height: auto;
    object-fit: contain;
    border-radius: 8px;
  }

  .report-single-evidence-meta {
    margin-top: 0;
    min-height: 220px;
    padding: 8px 9px;
  }

  .photo-meta-title {
    margin-bottom: 6px;
    font-size: 10px;
    font-weight: 700;
    color: #153d7a;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  .photo-meta-row {
    margin-bottom: 4px;
  }

  .photo-meta-label {
    display: block;
    font-size: 9px;
    font-weight: 700;
    color: #64748b;
    text-transform: uppercase;
    letter-spacing: 0.04em;
  }

  .photo-meta-value {
    display: block;
    margin-top: 1px;
    font-size: 10px;
    color: #0f172a;
    line-height: 1.35;
    word-break: break-word;
  }

  .photo-meta-block {
    margin-top: 6px;
    padding-top: 6px;
    border-top: 1px solid #d7e3f8;
  }

  .photo-meta-address {
    white-space: normal;
  }

  .photo-meta-empty {
    font-size: 10px;
    color: #64748b;
    font-style: italic;
  }

  .mt-0 { margin-top: 0; }
  .muted { color: #64748b; }
</style>
