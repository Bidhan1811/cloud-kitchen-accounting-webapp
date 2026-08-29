import ExcelJS from "exceljs";
import type { CustomerLedger, LedgerTransaction } from "../types/ledger.types";

/**
 * Builds a Customer Account Statement as an .xlsx workbook using ExcelJS
 * (not SheetJS/xlsx — that package has unpatched high-severity prototype
 * pollution and ReDoS advisories with no fix available). Chosen over a
 * PDF/image because a ledger is fundamentally tabular data people want to
 * sort, filter, or drop into their own bookkeeping.
 *
 * The running-balance and total rows are written as REAL FORMULAS, not
 * hardcoded numbers, so the sheet stays correct if someone tweaks a row's
 * Debit/Credit value by hand afterward.
 */
export async function generateStatementXlsx(ledger: CustomerLedger): Promise<Blob> {
  const { customer, openingBalance, transactions, balance } = ledger;

  const workbook = new ExcelJS.Workbook();
  workbook.creator = "Restro Rasoi";
  workbook.created = new Date();

  const sheet = workbook.addWorksheet("Statement", {
    views: [{ showGridLines: false }],
  });

  sheet.columns = [
    { key: "date", width: 14, alignment: { vertical: "top" } },
    { key: "particulars", width: 45, alignment: { wrapText: true, vertical: "top" } },
    { key: "debit", width: 14, alignment: { vertical: "top" } },
    { key: "credit", width: 14, alignment: { vertical: "top" } },
    { key: "balance", width: 16, alignment: { vertical: "top" } },
  ];

  const currencyFmt = '"\u20b9"#,##0.00;("\u20b9"#,##0.00)';

  const titleRow = sheet.addRow(["RESTRO RASOI"]);
  sheet.mergeCells(titleRow.number, 1, titleRow.number, 5);
  titleRow.font = { bold: true, size: 14 };
  titleRow.alignment = { horizontal: "center" };

  const subtitleRow = sheet.addRow(["CUSTOMER ACCOUNT STATEMENT"]);
  sheet.mergeCells(subtitleRow.number, 1, subtitleRow.number, 5);
  subtitleRow.font = { bold: true, size: 11, color: { argb: "FF6B5D50" } };
  subtitleRow.alignment = { horizontal: "center" };

  sheet.addRow([]);
  sheet.addRow([`Customer: ${customer.name}`]).font = { bold: true };
  sheet.addRow([`Phone: ${customer.phone}`]);

  const periodLabel =
    transactions.length > 0
      ? `${formatDateForSheet(transactions[0].transactionDate)} - ${formatDateForSheet(
          transactions[transactions.length - 1].transactionDate
        )}`
      : "-";
  sheet.addRow([`Statement Period: ${periodLabel}`]);
  sheet.addRow([]);

  const headerRow = sheet.addRow(["Date", "Particulars", "Debit", "Credit", "Balance"]);
  headerRow.font = { bold: true };
  headerRow.eachCell((cell) => {
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFF3E9DA" } };
    cell.border = { bottom: { style: "thin", color: { argb: "FFC8873A" } } };
  });

  const openingRow = sheet.addRow(["", "Opening Balance", null, null, openingBalance]);
  openingRow.font = { bold: true };
  openingRow.getCell(5).numFmt = currencyFmt;
  const openingRowNumber = openingRow.number;

  let prevBalanceRowNumber = openingRowNumber;
  for (const txn of transactions) {
    const row = sheet.addRow([
      formatDateForSheet(txn.transactionDate),
      particularsLabel(txn),
      txn.debit > 0 ? txn.debit : null,
      txn.credit > 0 ? txn.credit : null,
      null,
    ]);

    const debitCell = row.getCell(3);
    const creditCell = row.getCell(4);
    const balanceCell = row.getCell(5);

    debitCell.numFmt = currencyFmt;
    creditCell.numFmt = currencyFmt;
    balanceCell.numFmt = currencyFmt;

    balanceCell.value = {
      formula: `E${prevBalanceRowNumber}+IF(C${row.number}="",0,C${row.number})-IF(D${row.number}="",0,D${row.number})`,
    };

    prevBalanceRowNumber = row.number;
  }

  const lastDataRowNumber = prevBalanceRowNumber;

  const totalsRow = sheet.addRow(["", "Total", null, null, null]);
  totalsRow.font = { bold: true };
  totalsRow.eachCell((cell) => {
    cell.border = { top: { style: "thin", color: { argb: "FFD8CFC2" } } };
  });
  if (transactions.length > 0) {
    const firstDataRowNumber = openingRowNumber + 1;
    totalsRow.getCell(3).value = { formula: `SUM(C${firstDataRowNumber}:C${lastDataRowNumber})` };
    totalsRow.getCell(4).value = { formula: `SUM(D${firstDataRowNumber}:D${lastDataRowNumber})` };
  } else {
    totalsRow.getCell(3).value = 0;
    totalsRow.getCell(4).value = 0;
  }
  totalsRow.getCell(3).numFmt = currencyFmt;
  totalsRow.getCell(4).numFmt = currencyFmt;

  sheet.addRow([]);

  const closingLabel = balance.isAdvance ? "Advance Balance" : balance.isSettled ? "Status" : "Amount Due";
  const closingRow = sheet.addRow([closingLabel, null]);
  closingRow.font = { bold: true, size: 12 };

  if (balance.isSettled) {
    closingRow.getCell(2).value = "Settled";
  } else {
    closingRow.getCell(2).value = { formula: `E${lastDataRowNumber}` };
    closingRow.getCell(2).numFmt = currencyFmt;
  }

  const arrayBuffer = await workbook.xlsx.writeBuffer();
  return new Blob([arrayBuffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
}

function formatDateForSheet(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

function particularsLabel(txn: LedgerTransaction): string {
  if (txn.type === "SALE") {
    // Prefer actual order items over the invoice number for human readability.
    if (txn.saleItems && txn.saleItems.length > 0) {
      return txn.saleItems
        .map((item) => {
          const suffix = item.portion === "half" ? " (½)" : "";
          return `${item.itemName}${suffix} ×${item.quantity}`;
        })
        .join(", ");
    }
    // Fallback for historical transactions without items attached.
    return txn.description || "Order";
  }
  if (txn.type === "PAYMENT") return txn.paymentMode ? `${txn.paymentMode} Payment` : "Payment";
  if (txn.type === "ADJUSTMENT") {
    return txn.description || `${txn.adjustmentType === "DEBIT" ? "Debit" : "Credit"} Adjustment`;
  }
  if (txn.type === "REVERSAL") return txn.description || "Reversal";
  return "Opening Balance";
}
