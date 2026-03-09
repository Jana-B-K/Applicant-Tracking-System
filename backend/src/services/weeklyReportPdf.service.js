export const buildWeeklyReportPdfAttachment = async ({ rows, reportDateLabel }) => {
  let PDFDocument;
  try {
    const pdfkitModule = await import("pdfkit");
    PDFDocument = pdfkitModule.default;
  } catch (error) {
    const depError = new Error("PDF export requires 'pdfkit'. Install it with: npm install pdfkit");
    depError.statusCode = 500;
    throw depError;
  }

  const attachmentBuffer = await new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: "A4", layout: "landscape", margin: 28 });
    const chunks = [];
    const pageLeft = doc.page.margins.left;
    const pageRight = doc.page.width - doc.page.margins.right;
    const pageTop = doc.page.margins.top;
    const pageBottom = doc.page.height - doc.page.margins.bottom;
    const contentWidth = pageRight - pageLeft;
    const cellPadding = 4;
    const headerRowHeight = 18;
    const bodyFontSize = 7;
    const headerFontSize = 7;

    doc.on("data", (chunk) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", (err) => reject(err));

    const columns = [
      { key: "jobTitle", label: "Job Title", widthPct: 12 },
      { key: "department", label: "Department", widthPct: 8 },
      { key: "hiringManager", label: "Hiring Manager", widthPct: 10 },
      { key: "numberOfOpenings", label: "Openings", widthPct: 5 },
      { key: "positionsFilled", label: "Filled", widthPct: 5 },
      { key: "positionsPending", label: "Pending", widthPct: 5 },
      { key: "candidatesInEachStage", label: "Candidates in Each Stage", widthPct: 20 },
      { key: "interviewsConductedThisWeek", label: "Interviews (Week)", widthPct: 8 },
      { key: "offersReleased", label: "Offers", widthPct: 6 },
      { key: "offerAcceptanceStatus", label: "Offer Acceptance", widthPct: 12 },
      { key: "ageingOfPositionRemainingDays", label: "Ageing Days", widthPct: 9 },
    ];

    const measuredColumns = columns.map((col) => ({
      ...col,
      width: (contentWidth * col.widthPct) / 100,
    }));

    const drawReportHeader = (isContinuation = false) => {
      const title = isContinuation
        ? `Weekly Hiring Report - ${reportDateLabel} (Continued)`
        : `Weekly Hiring Report - ${reportDateLabel}`;
      doc.font("Helvetica-Bold").fontSize(14).fillColor("#111111").text(title, pageLeft, pageTop, {
        width: contentWidth,
      });
      doc
        .font("Helvetica")
        .fontSize(10)
        .fillColor("#444444")
        .text(`Generated At: ${new Date().toISOString()}`, pageLeft, pageTop + 22, {
          width: contentWidth,
        });
      return pageTop + 46;
    };

    const drawTableHeader = (y) => {
      let x = pageLeft;
      for (const col of measuredColumns) {
        doc.save().lineWidth(0.7).strokeColor("#b6b6b6").fillColor("#efefef").rect(x, y, col.width, headerRowHeight).fillAndStroke().restore();
        doc
          .font("Helvetica-Bold")
          .fontSize(headerFontSize)
          .fillColor("#111111")
          .text(col.label, x + cellPadding, y + 5, {
            width: col.width - cellPadding * 2,
            align: "left",
            ellipsis: true,
            lineBreak: false,
          });
        x += col.width;
      }
      return y + headerRowHeight;
    };

    const getCellText = (row, key) => {
      const value = row?.[key];
      return value == null || value === "" ? "-" : String(value);
    };

    const measureRowHeight = (row) => {
      let maxHeight = headerRowHeight;
      for (const col of measuredColumns) {
        const text = getCellText(row, col.key);
        doc.font("Helvetica").fontSize(bodyFontSize);
        const textHeight = doc.heightOfString(text, {
          width: col.width - cellPadding * 2,
          align: "left",
        });
        maxHeight = Math.max(maxHeight, textHeight + cellPadding * 2);
      }
      return maxHeight;
    };

    const drawRow = (row, y, rowHeight) => {
      let x = pageLeft;
      for (const col of measuredColumns) {
        const text = getCellText(row, col.key);
        doc.save().lineWidth(0.6).strokeColor("#d2d2d2").fillColor("#ffffff").rect(x, y, col.width, rowHeight).fillAndStroke().restore();
        doc
          .font("Helvetica")
          .fontSize(bodyFontSize)
          .fillColor("#1f2937")
          .text(text, x + cellPadding, y + cellPadding, {
            width: col.width - cellPadding * 2,
            height: rowHeight - cellPadding * 2,
            align: "left",
          });
        x += col.width;
      }
      return y + rowHeight;
    };

    let currentY = drawReportHeader(false);
    currentY = drawTableHeader(currentY);

    for (let index = 0; index < rows.length; index += 1) {
      const row = rows[index];
      const rowHeight = measureRowHeight(row);
      if (currentY + rowHeight > pageBottom) {
        doc.addPage({ size: "A4", layout: "landscape", margin: 28 });
        currentY = drawReportHeader(true);
        currentY = drawTableHeader(currentY);
      }
      currentY = drawRow(row, currentY, rowHeight);
    }

    doc.end();
  });

  return {
    attachmentBuffer,
    fileName: `weekly-report-${reportDateLabel}.pdf`,
    mimeType: "application/pdf",
  };
};
