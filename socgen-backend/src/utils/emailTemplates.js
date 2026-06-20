const TYPE_LABELS = {
  APPROVAL_REQUIRED: "Approval Required",
  EXPIRY_WARNING: "Expiry Warning",
  OVERDUE: "Overdue",
  RENEWAL_REQUIRED: "Renewal Required",
  APPROVAL_CONFIRMED: "Approved",
  REJECTED: "Rejected",
  INFO_REQUESTED: "More Information Requested",
};

const TYPE_COLORS = {
  APPROVAL_REQUIRED: "#2563eb",
  EXPIRY_WARNING: "#d97706",
  OVERDUE: "#dc2626",
  RENEWAL_REQUIRED: "#ea580c",
  APPROVAL_CONFIRMED: "#16a34a",
  REJECTED: "#dc2626",
  INFO_REQUESTED: "#7c3aed",
};

const RISK_COLORS = {
  LOW: "#16a34a",
  MEDIUM: "#d97706",
  HIGH: "#ea580c",
  CRITICAL: "#dc2626",
};

/**
 * Builds a structured HTML email for an exception-related notification.
 * @param {object} params
 * @param {string} params.type - NotificationType enum value
 * @param {string} params.message - short summary line
 * @param {object} params.exception - exception record (title, riskLevel, riskScore, status, expiryDate, department, requester)
 * @param {string} params.actionUrl - direct link to the exception detail page
 * @param {string} params.actionLabel - button label, e.g. "Review Exception"
 */
function buildExceptionEmailHtml({
  type,
  message,
  exception,
  actionUrl,
  actionLabel,
}) {
  const label = TYPE_LABELS[type] || type;
  const color = TYPE_COLORS[type] || "#334155";
  const riskColor = RISK_COLORS[exception?.riskLevel] || "#64748b";

  return `
  <div style="font-family:Arial,Helvetica,sans-serif;max-width:560px;margin:0 auto;background:#f8fafc;padding:24px;">
    <div style="background:#0f172a;border-radius:8px 8px 0 0;padding:16px 24px;">
      <span style="color:#fff;font-size:16px;font-weight:bold;">SentinelGRC</span>
      <span style="color:#94a3b8;font-size:12px;margin-left:8px;">Policy Exception Management</span>
    </div>

    <div style="background:#fff;border:1px solid #e2e8f0;border-top:none;border-radius:0 0 8px 8px;padding:24px;">
      <span style="display:inline-block;background:${color};color:#fff;font-size:11px;font-weight:bold;padding:4px 10px;border-radius:4px;letter-spacing:0.5px;text-transform:uppercase;">
        ${label}
      </span>

      <p style="color:#0f172a;font-size:15px;line-height:1.5;margin:16px 0;">${message}</p>

      ${
        exception
          ? `
      <table style="width:100%;border-collapse:collapse;margin:16px 0;font-size:13px;">
        <tr><td style="color:#64748b;padding:6px 0;width:140px;">Exception</td>
            <td style="color:#0f172a;font-weight:600;padding:6px 0;">${
              exception.title
            }</td></tr>
        <tr><td style="color:#64748b;padding:6px 0;">Department</td>
            <td style="color:#0f172a;padding:6px 0;">${
              exception.department?.name || "—"
            }</td></tr>
        <tr><td style="color:#64748b;padding:6px 0;">Requester</td>
            <td style="color:#0f172a;padding:6px 0;">${
              exception.requester?.name || "—"
            }</td></tr>
        <tr><td style="color:#64748b;padding:6px 0;">Status</td>
            <td style="color:#0f172a;padding:6px 0;">${
              exception.status
            }</td></tr>
        <tr><td style="color:#64748b;padding:6px 0;">Risk Level</td>
            <td style="padding:6px 0;">
              <span style="background:${riskColor};color:#fff;font-size:11px;font-weight:bold;padding:2px 8px;border-radius:4px;">
                ${exception.riskLevel} (${exception.riskScore})
              </span>
            </td></tr>
        ${
          exception.expiryDate
            ? `
        <tr><td style="color:#64748b;padding:6px 0;">Expiry Date</td>
            <td style="color:#0f172a;padding:6px 0;">${new Date(
              exception.expiryDate
            ).toLocaleDateString()}</td></tr>`
            : ""
        }
      </table>`
          : ""
      }

      ${
        actionUrl
          ? `
      <div style="text-align:center;margin:24px 0 8px;">
        <a href="${actionUrl}" style="background:#4f46e5;color:#fff;text-decoration:none;font-size:14px;font-weight:600;padding:10px 24px;border-radius:6px;display:inline-block;">
          ${actionLabel || "View Exception"}
        </a>
      </div>`
          : ""
      }

      <p style="color:#94a3b8;font-size:11px;margin-top:24px;border-top:1px solid #f1f5f9;padding-top:12px;">
        This is an automated message from SentinelGRC. Do not reply to this email.
      </p>
    </div>
  </div>`;
}

module.exports = { buildExceptionEmailHtml, TYPE_LABELS };
