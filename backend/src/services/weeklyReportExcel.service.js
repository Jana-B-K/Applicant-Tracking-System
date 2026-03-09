import ExcelJS from "exceljs";

export const buildWeeklyReportExcelAttachment = async ({ rows, reportDateLabel }) => {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet("Weekly Report");

  worksheet.columns = [
    { header: "Job Title", key: "jobTitle", width: 30 },
    { header: "Department", key: "department", width: 20 },
    { header: "Hiring Manager", key: "hiringManager", width: 24 },
    { header: "Number of Openings", key: "numberOfOpenings", width: 20 },
    { header: "Positions Filled", key: "positionsFilled", width: 16 },
    { header: "Positions Pending", key: "positionsPending", width: 18 },
    { header: "Candidates in Each Stage", key: "candidatesInEachStage", width: 40 },
    { header: "Interviews Conducted (This Week)", key: "interviewsConductedThisWeek", width: 28 },
    { header: "Offers Released", key: "offersReleased", width: 16 },
    { header: "Offer Acceptance Status", key: "offerAcceptanceStatus", width: 34 },
    { header: "Ageing of Position", key: "ageingOfPositionRemainingDays", width: 38 },
  ];

  worksheet.getRow(1).font = { name: "Calibri", size: 11, bold: false };
  worksheet.getRow(1).height = 22;
  worksheet.getRow(1).alignment = { vertical: "middle" };
  worksheet.getColumn("candidatesInEachStage").alignment = { wrapText: true, vertical: "top", horizontal: "left" };
  worksheet.getColumn("offerAcceptanceStatus").alignment = { wrapText: true, vertical: "top", horizontal: "left" };

  for (const row of rows) {
    worksheet.addRow(row);
  }

  // Auto-size columns to reduce horizontal scrolling; keep wide text columns capped.
  const minWidth = 10;
  const maxWidthDefault = 22;
  const maxWidthByKey = {
    candidatesInEachStage: 25,
    offerAcceptanceStatus: 25,
    jobTitle: 24,
    hiringManager: 24,
  };

  for (const column of worksheet.columns) {
    const key = String(column.key || "");
    const headerLength = String(column.header || "").length;
    let maxLength = headerLength;

    column.eachCell({ includeEmpty: true }, (cell) => {
      const value = cell.value == null ? "" : String(cell.value);
      const longestLine = value
        .split("\n")
        .reduce((acc, line) => Math.max(acc, line.length), 0);
      if (longestLine > maxLength) maxLength = longestLine;
    });

    const maxAllowed = maxWidthByKey[key] || maxWidthDefault;
    column.width = Math.max(minWidth, Math.min(maxLength + 2, maxAllowed));
    if (!column.alignment) {
      column.alignment = { vertical: "top", horizontal: "left" };
    }
  }

  worksheet.eachRow((row, rowNumber) => {
    row.font = { name: "Calibri", size: 11, bold: false };
    row.alignment = { vertical: rowNumber === 1 ? "middle" : "top", horizontal: "left" };
  });

  return {
    attachmentBuffer: await workbook.xlsx.writeBuffer(),
    fileName: `weekly-report-${reportDateLabel}.xlsx`,
    mimeType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  };
};
