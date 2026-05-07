const PDFDocument = require("pdfkit");
const nodemailer = require("nodemailer");
const ScanLog = require("../models/scanLogModel");
const ReportSettings = require("../models/reportSettingsModel");

function parseRecipients(value) {
  return String(value || "")
    .split(/[\n,;]+/)
    .map((email) => email.trim())
    .filter(Boolean);
}

function validateRecipients(recipients) {
  const invalid = recipients.filter((email) => !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email));
  if (invalid.length) {
    throw new Error(`Invalid email address: ${invalid.join(", ")}`);
  }
}

function formatDate(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function formatDateTime(value) {
  if (!value) return "-";
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? String(value) : date.toLocaleString();
}

function summarizeLogs(logs) {
  return logs.reduce(
    (summary, log) => {
      summary.total += 1;
      summary[log.status] = (summary[log.status] || 0) + 1;
      return summary;
    },
    { total: 0, present: 0, normal: 0, flagged: 0, failed: 0 }
  );
}

function createReportPdf(logs, reportDate) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 48, size: "A4" });
    const chunks = [];

    doc.on("data", (chunk) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    const summary = summarizeLogs(logs);

    doc.fontSize(18).text("Sto. Nino Formation and Science School", { align: "center" });
    doc.moveDown(0.2);
    doc.fontSize(14).text("Attendance Summary Report", { align: "center" });
    doc.moveDown();
    doc.fontSize(10).text(`Report date: ${reportDate}`);
    doc.text(`Generated: ${formatDateTime(new Date())}`);
    doc.moveDown();

    doc.fontSize(12).text("Summary", { underline: true });
    doc.fontSize(10).text(`Total logs: ${summary.total}`);
    doc.text(`Present: ${summary.present}`);
    doc.text(`Normal temperature: ${summary.normal}`);
    doc.text(`Flagged: ${summary.flagged}`);
    doc.text(`Failed: ${summary.failed}`);
    doc.moveDown();

    doc.fontSize(12).text("Attendance Logs", { underline: true });
    doc.moveDown(0.4);

    const headers = ["Student", "LRN", "Section", "Type", "Temp", "Status", "Time"];
    const widths = [105, 78, 65, 70, 42, 55, 100];

    function drawRow(values, bold = false) {
      const y = doc.y;
      let x = doc.page.margins.left;
      doc.font(bold ? "Helvetica-Bold" : "Helvetica").fontSize(8);
      values.forEach((value, index) => {
        doc.text(String(value || "-"), x, y, { width: widths[index], continued: false });
        x += widths[index];
      });
      doc.y = y + 24;
    }

    drawRow(headers, true);
    doc.moveTo(doc.page.margins.left, doc.y - 6).lineTo(doc.page.width - doc.page.margins.right, doc.y - 6).stroke();

    if (!logs.length) {
      doc.font("Helvetica").fontSize(10).text("No attendance logs for this date.");
    } else {
      logs.forEach((log) => {
        if (doc.y > doc.page.height - 72) {
          doc.addPage();
          drawRow(headers, true);
        }

        drawRow([
          `${log.first_name || "Unknown"} ${log.last_name || ""}`.trim(),
          log.lrn,
          log.section,
          log.scan_type,
          log.temperature_c,
          log.status,
          formatDateTime(log.scanned_at),
        ]);
      });
    }

    doc.end();
  });
}

function createTransport() {
  if (!process.env.GMAIL_SMTP_USER || !process.env.GMAIL_SMTP_APP_PASSWORD) {
    throw new Error("Gmail SMTP is not configured. Set GMAIL_SMTP_USER and GMAIL_SMTP_APP_PASSWORD in .env.");
  }

  return nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.GMAIL_SMTP_USER,
      pass: process.env.GMAIL_SMTP_APP_PASSWORD,
    },
  });
}

async function sendAttendanceReport({ recipients, reportDate = formatDate() }) {
  const cleanRecipients = parseRecipients(recipients);
  if (!cleanRecipients.length) throw new Error("Add at least one teacher email address.");
  validateRecipients(cleanRecipients);

  const logs = await ScanLog.getByDate(reportDate);
  const pdf = await createReportPdf(logs, reportDate);
  const summary = summarizeLogs(logs);
  const transporter = createTransport();

  await transporter.sendMail({
    from: `"IWATAR Reports" <${process.env.GMAIL_SMTP_USER}>`,
    to: cleanRecipients,
    subject: `Attendance Summary - ${reportDate}`,
    text: `Attendance summary for ${reportDate}\n\nTotal: ${summary.total}\nPresent: ${summary.present}\nNormal: ${summary.normal}\nFlagged: ${summary.flagged}\nFailed: ${summary.failed}\n\nPlease see the attached PDF report.`,
    attachments: [
      {
        filename: `attendance-summary-${reportDate}.pdf`,
        content: pdf,
        contentType: "application/pdf",
      },
    ],
  });

  return {
    recipientCount: cleanRecipients.length,
    logCount: logs.length,
    reportDate,
  };
}

async function sendAutoReportIfDue(now = new Date()) {
  const settings = await ReportSettings.get();
  if (!settings.auto_enabled) return null;

  const reportDate = formatDate(now);
  const currentTime = now.toTimeString().slice(0, 5);
  if (currentTime < settings.send_time || String(settings.last_auto_sent_date || "").slice(0, 10) === reportDate) {
    return null;
  }

  const result = await sendAttendanceReport({ recipients: settings.recipients, reportDate });
  await ReportSettings.markAutoSent(reportDate);
  return result;
}

function startAutoReportScheduler() {
  ReportSettings.ensureTable().catch((error) => {
    console.error("Unable to prepare report settings table:", error.message);
  });

  setInterval(() => {
    sendAutoReportIfDue().catch((error) => {
      console.error("Automatic attendance report failed:", error.message);
    });
  }, 60 * 1000);
}

module.exports = {
  parseRecipients,
  sendAttendanceReport,
  sendAutoReportIfDue,
  startAutoReportScheduler,
  formatDate,
};
