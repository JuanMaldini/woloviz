import { toPng } from "html-to-image";
import jsPDF from "jspdf";

const PDFRenderButton = ({ targetRef, fileName, label = "Generate invoice" }) => {
  const handleGeneratePDF = async () => {
    if (!targetRef?.current || !fileName) {
      return;
    }

    const targetNode = targetRef.current;
    const previousTransform = targetNode.style.transform;
    const previousTransformOrigin = targetNode.style.transformOrigin;
    const hiddenControls = Array.from(targetNode.querySelectorAll(".pdf-hide-on-export"));
    const previousVisibilities = hiddenControls.map((control) => control.style.visibility);

    targetNode.style.transform = "none";
    targetNode.style.transformOrigin = "top left";
    hiddenControls.forEach((control) => {
      control.style.visibility = "hidden";
    });

    try {
      const imageData = await toPng(targetNode, {
        cacheBust: true,
        pixelRatio: 2,
        backgroundColor: "#ffffff",
      });

      const pdf = new jsPDF("p", "mm", "a4");
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();

      pdf.addImage(imageData, "PNG", 0, 0, pageWidth, pageHeight);
      pdf.save(fileName);
    } finally {
      hiddenControls.forEach((control, index) => {
        control.style.visibility = previousVisibilities[index];
      });
      targetNode.style.transform = previousTransform;
      targetNode.style.transformOrigin = previousTransformOrigin;
    }
  };

  return (
    <button
      type="button"
      onClick={handleGeneratePDF}
      className="mt-6 rounded bg-slate-800 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-slate-700"
    >
      {label}
    </button>
  );
};

export default PDFRenderButton;