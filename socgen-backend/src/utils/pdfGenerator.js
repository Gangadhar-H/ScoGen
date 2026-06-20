const PDFDocument = require("pdfkit");

function buildAuditLogPdf({
  logs,
  title = "Audit Trail Report",
  filters = {},
}) {
  const doc = new PDFDocument({ margin: 40, size: "A4" });

  doc
    .fontSize(18)
    .font("Helvetica-Bold")
    .text("SentinelGRC", { continued: true })
    .font("Helvetica")
    .fontSize(10)
    .fillColor("#64748b")
    .text("  Policy Exception Management", { align: "left" });
  doc.moveDown(0.5);
  doc.fillColor("#0f172a").fontSize(14).font("Helvetica-Bold").text(title);
  doc
    .fontSize(9)
    .fillColor("#64748b")
    .text(`Generated: ${new Date().toISOString()}`);
  if (Object.keys(filters).length) {
    doc.text(
      `Filters: ${Object.entries(filters)
        .map(([k, v]) => `${k}=${v}`)
        .join(", ")}`
    );
  }
  doc.moveDown(1);

  doc.fontSize(9).fillColor("#0f172a");
  const colX = { time: 40, user: 140, action: 280, resource: 400, id: 470 };

  function drawHeader() {
    doc.font("Helvetica-Bold");
    doc.text("Timestamp", colX.time, doc.y, { width: 95 });
    doc.text("User", colX.user, doc.y - 11, { width: 130 });
    doc.text("Action", colX.action, doc.y - 11, { width: 110 });
    doc.text("Resource", colX.resource, doc.y - 11, { width: 70 });
    doc.moveDown(0.5);
    doc.font("Helvetica");
    doc.moveTo(40, doc.y).lineTo(555, doc.y).strokeColor("#cbd5e1").stroke();
    doc.moveDown(0.3);
  }

  drawHeader();

  for (const log of logs) {
    if (doc.y > 740) {
      doc.addPage();
      drawHeader();
    }
    const rowY = doc.y;
    doc.text(new Date(log.createdAt).toLocaleString(), colX.time, rowY, {
      width: 95,
    });
    doc.text(log.user?.name || "System", colX.user, rowY, { width: 130 });
    doc.text(log.action, colX.action, rowY, { width: 110 });
    doc.text(log.resourceType, colX.resource, rowY, { width: 70 });
    doc.moveDown(0.6);
  }

  doc.moveDown(1);
  doc.fontSize(8).fillColor("#94a3b8").text(`Total entries: ${logs.length}`);

  return doc;
}

function buildReportPdf({ title, rows, columns }) {
  const doc = new PDFDocument({ margin: 40, size: "A4" });
  doc.fontSize(14).font("Helvetica-Bold").fillColor("#0f172a").text(title);
  doc
    .fontSize(9)
    .fillColor("#64748b")
    .text(`Generated: ${new Date().toISOString()}`);
  doc.moveDown(1);

  const colWidth = 515 / columns.length;
  function drawHeader() {
    doc.font("Helvetica-Bold").fontSize(9);
    columns.forEach((c, i) =>
      doc.text(c.label, 40 + i * colWidth, doc.y, { width: colWidth - 5 })
    );
    doc.moveDown(0.5);
    doc.moveTo(40, doc.y).lineTo(555, doc.y).strokeColor("#cbd5e1").stroke();
    doc.moveDown(0.3);
    doc.font("Helvetica");
  }
  drawHeader();

  for (const row of rows) {
    if (doc.y > 740) {
      doc.addPage();
      drawHeader();
    }
    const y = doc.y;
    columns.forEach((c, i) =>
      doc.text(String(row[c.key] ?? "—"), 40 + i * colWidth, y, {
        width: colWidth - 5,
      })
    );
    doc.moveDown(0.6);
  }

  doc.moveDown(1);
  doc.fontSize(8).fillColor("#94a3b8").text(`Total records: ${rows.length}`);
  return doc;
}

module.exports = { buildAuditLogPdf, buildReportPdf };
