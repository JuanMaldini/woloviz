import { useEffect, useRef, useState } from "react";
import { FiTrash2 } from "react-icons/fi";
import PDFRenderButton from "./components/PDFRenderButton";

const getDateOffset = (offsetDays = 0) => {
  const date = new Date();
  date.setDate(date.getDate() + offsetDays);
  return date.toISOString().slice(0, 10);
};

const sanitizeForFileName = (value) =>
  value
    .trim()
    .replace(/[<>:"/\\|?*\x00-\x1F]/g, "")
    .replace(/\s+/g, "_")
    .replace(/_+/g, "_");

const parseNumber = (value) => {
  const normalized = String(value).replace(",", ".");
  const parsed = Number.parseFloat(normalized);
  return Number.isFinite(parsed) ? parsed : 0;
};

const formatMoney = (value) => `${value.toFixed(2)} €`;

const createLineItem = () => ({
  id: `${Date.now()}_${Math.random().toString(16).slice(2)}`,
  description: "Description of services",
  qty: "1",
  unitPrice: "1000",
});

const InvoiceGenerator = () => {
  const pageRef = useRef(null);
  const [pageScale, setPageScale] = useState(1);
  const [scaledHeight, setScaledHeight] = useState(null);
  const [scaledWidth, setScaledWidth] = useState(null);
  const [invoiceNo, setInvoiceNo] = useState("INV-2026-001");
  const [issueDate, setIssueDate] = useState(getDateOffset(0));
  const [dueDate, setDueDate] = useState(getDateOffset(7));
  const [clientName, setClientName] = useState("");
  const [clientAddressLine1, setClientAddressLine1] = useState("");
  const [clientAddressLine2, setClientAddressLine2] = useState("");
  const [clientTaxId, setClientTaxId] = useState("");
  const [clientContact, setClientContact] = useState("");
  const [lineItems, setLineItems] = useState([createLineItem()]);

  const updateLineItem = (itemId, field, value) => {
    setLineItems((previousItems) =>
      previousItems.map((item) =>
        item.id === itemId
          ? {
              ...item,
              [field]: value,
            }
          : item,
      ),
    );
  };

  const updateAmountValue = (itemId, amountValue) => {
    setLineItems((previousItems) =>
      previousItems.map((item) => {
        if (item.id !== itemId) {
          return item;
        }

        const qtyValue = parseNumber(item.qty);
        if (qtyValue <= 0) {
          return item;
        }

        const nextUnitPrice = parseNumber(amountValue) / qtyValue;
        return {
          ...item,
          unitPrice: nextUnitPrice.toFixed(2),
        };
      }),
    );
  };

  const addLineItem = () => {
    setLineItems((previousItems) => [...previousItems, createLineItem()]);
  };

  const removeLineItem = (itemId) => {
    setLineItems((previousItems) => {
      if (previousItems.length <= 1) {
        return previousItems;
      }

      return previousItems.filter((item) => item.id !== itemId);
    });
  };

  const totalAmount = lineItems.reduce((sum, item) => {
    return sum + parseNumber(item.qty) * parseNumber(item.unitPrice);
  }, 0);

  const pdfFileName = `woloviz_invoice_${sanitizeForFileName(clientName || "Client Name Company")}_${sanitizeForFileName(invoiceNo || "Invoice No")}.pdf`;

  useEffect(() => {
    const updatePageScale = () => {
      if (!pageRef.current) {
        return;
      }

      const viewportPadding = 48;
      const availableWidth = window.innerWidth - viewportPadding;
      const pageWidth = pageRef.current.offsetWidth;
      const pageHeight = pageRef.current.offsetHeight;
      const nextScale = availableWidth < pageWidth ? availableWidth / pageWidth : 1;

      setPageScale(nextScale);
      setScaledHeight(pageHeight * nextScale);
      setScaledWidth(pageWidth * nextScale);
    };

    updatePageScale();
    window.addEventListener("resize", updatePageScale);

    return () => {
      window.removeEventListener("resize", updatePageScale);
    };
  }, []);

  return (
    <div className="flex min-h-full w-full flex-1 flex-col items-center overflow-x-hidden overflow-y-auto bg-gray-100 p-6">
      <div
        className="w-full"
        style={{
          height: scaledHeight ? `${scaledHeight}px` : "auto",
          width: scaledWidth ? `${scaledWidth}px` : "auto",
        }}
      >
        <section
          ref={pageRef}
          className="flex h-[297mm] w-[210mm] shrink-0 flex-col bg-white p-[12mm] text-slate-800 shadow-sm"
          style={{ transform: `scale(${pageScale})`, transformOrigin: "top left" }}
        >
          <header className="mb-8 flex items-start justify-between border-b border-slate-200 pb-6">
            <div className="flex items-center justify-center gap-3">
              <img src="/icons/logo.svg" alt="Company logo" className="h-10 w-auto shrink-0" />
              <h1 className="text-3xl font-bold leading-none tracking-tight">INVOICE</h1>
            </div>

            <div className="space-y-2 text-right text-sm">
              <p>
                <span className="font-semibold">Invoice No:</span>{" "}
                <input
                  type="text"
                  value={invoiceNo}
                  onChange={(event) => setInvoiceNo(event.target.value)}
                  placeholder="INV-2026-001"
                  className="w-[34mm] border-b border-transparent bg-transparent text-right outline-none focus:border-slate-300"
                />
              </p>
              <p>
                <span className="font-semibold">Issue Date:</span>{" "}
                <input
                  type="date"
                  value={issueDate}
                  onChange={(event) => setIssueDate(event.target.value)}
                  className="border-b border-transparent bg-transparent text-right outline-none focus:border-slate-300"
                />
              </p>
              <p>
                <span className="font-semibold">Due Date:</span>{" "}
                <input
                  type="date"
                  value={dueDate}
                  onChange={(event) => setDueDate(event.target.value)}
                  className="border-b border-transparent bg-transparent text-right outline-none focus:border-slate-300"
                />
              </p>
            </div>
          </header>

          <div className="mb-8 grid grid-cols-2 gap-6">
            <article className="rounded border border-slate-200 p-4">
              <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">Issuer</h2>
              <p className="font-semibold">Woloviz Studio S.L.</p>
              {/*
              <p>Example Street 123</p>
              <p>28001 Madrid, Spain</p>
              <p><span className="font-semibold">Tax ID:</span> 000000000</p>
              <p><span className="font-semibold">VAT:</span> AAA00000000</p>
              */}
              <p><span className="font-semibold">Email:</span> contact@woloviz.com</p>
            </article>

            <article className="rounded border border-slate-200 p-4">
              <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">Bill To</h2>
              <p className="font-semibold">
                <input
                  type="text"
                  value={clientName}
                  onChange={(event) => setClientName(event.target.value)}
                  placeholder="Client Name"
                  className="w-full border-b border-transparent bg-transparent outline-none focus:border-slate-300"
                />
              </p>
              <p>
                <input
                  type="text"
                  value={clientAddressLine1}
                  onChange={(event) => setClientAddressLine1(event.target.value)}
                  placeholder="Client Address"
                  className="w-full border-b border-transparent bg-transparent outline-none focus:border-slate-300"
                />
              </p>
              <p>
                <input
                  type="text"
                  value={clientAddressLine2}
                  onChange={(event) => setClientAddressLine2(event.target.value)}
                  placeholder="City / Postal Code / Country"
                  className="w-full border-b border-transparent bg-transparent outline-none focus:border-slate-300"
                />
              </p>
              {/* <p>
                <span className="font-semibold">Tax ID:</span>{" "}
                <input
                  type="text"
                  value={clientTaxId}
                  onChange={(event) => setClientTaxId(event.target.value)}
                  placeholder="X0000000X"
                  className="w-[28mm] border-b border-transparent bg-transparent outline-none focus:border-slate-300"
                />
              </p> */}
              <p>
                <span className="font-semibold">Contact:</span>{" "}
                <input
                  type="text"
                  value={clientContact}
                  onChange={(event) => setClientContact(event.target.value)}
                  placeholder="contact@client.com"
                  className="w-[44mm] border-b border-transparent bg-transparent outline-none focus:border-slate-300"
                />
              </p>
            </article>
          </div>

          <div className="mb-8">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="border-y border-slate-200 bg-slate-50 text-left">
                  <th className="px-3 py-2 font-semibold">Description</th>
                  <th className="px-3 py-2 font-semibold">Qty</th>
                  <th className="px-3 py-2 font-semibold">Unit Price</th>
                  <th className="px-3 py-2 text-right font-semibold">Amount</th>
                  <th className="w-[8mm] px-2 py-2 text-right font-semibold" />
                </tr>
              </thead>
              <tbody>
                {lineItems.map((item) => {
                  const amountValue = parseNumber(item.qty) * parseNumber(item.unitPrice);

                  return (
                    <tr key={item.id} className="border-b border-slate-200">
                      <td className="px-3 py-3">
                        <input
                          type="text"
                          value={item.description}
                          onChange={(event) => updateLineItem(item.id, "description", event.target.value)}
                          placeholder="Description of services"
                          className="w-full border-b border-transparent bg-transparent outline-none focus:border-slate-300"
                        />
                      </td>
                      <td className="px-3 py-3">
                        <input
                          type="number"
                          min="0"
                          step="1"
                          value={item.qty}
                          onChange={(event) => updateLineItem(item.id, "qty", event.target.value)}
                          className="w-[16mm] border-b border-transparent bg-transparent outline-none [appearance:textfield] focus:border-slate-300 [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                        />
                      </td>
                      <td className="px-3 py-3">
                        <div className="flex items-center gap-1">
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={item.unitPrice}
                            onChange={(event) => updateLineItem(item.id, "unitPrice", event.target.value)}
                            className="w-[24mm] border-b border-transparent bg-transparent outline-none [appearance:textfield] focus:border-slate-300 [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                          />
                          <span>€</span>
                        </div>
                      </td>
                      <td className="px-3 py-3 text-right">
                        <div className="ml-auto flex w-fit items-center gap-1">
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={amountValue.toFixed(2)}
                            onChange={(event) => updateAmountValue(item.id, event.target.value)}
                            className="w-[28mm] border-b border-transparent bg-transparent text-right outline-none [appearance:textfield] focus:border-slate-300 [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                          />
                          <span>€</span>
                        </div>
                      </td>

                      <td className="px-2 py-3 text-right align-middle">
                        <button
                          type="button"
                          onClick={() => removeLineItem(item.id)}
                          disabled={lineItems.length <= 1}
                          className="pdf-hide-on-export rounded p-1 text-slate-500 hover:bg-slate-100 hover:text-red-600 disabled:cursor-not-allowed disabled:text-slate-300"
                          aria-label="Delete row"
                        >
                          <FiTrash2 size={14} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            <div className="mt-2 pt-2">
              <div className="flex items-center">
                <button
                  type="button"
                  onClick={addLineItem}
                  className="pdf-hide-on-export rounded border border-slate-300 px-3 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                >
                  + Add line
                </button>
              </div>
            </div>
          </div>

          <div className="flex justify-end">
            <div className="w-[78mm] space-y-2 rounded border border-slate-200 p-4 text-sm">
              <div className="flex items-center justify-between text-base font-semibold">
                <span>Total Due</span>
                <span>{formatMoney(totalAmount)}</span>
              </div>
            </div>
          </div>

          <footer className="mt-auto grid grid-cols-2 gap-4 border-t border-slate-200 pt-4 text-xs text-slate-600">
            <div>
              <p className="mb-1 font-semibold text-slate-700">Payment Terms</p>
              <p>IBAN: ES00 0000 0000 0000 0000 0000</p>
              <p>BIC/SWIFT: BANKESMMXXX</p>
            </div>
          </footer>
        </section>
      </div>

      <PDFRenderButton targetRef={pageRef} fileName={pdfFileName} label="Generate invoice" />
    </div>
  );
};

export default InvoiceGenerator;
