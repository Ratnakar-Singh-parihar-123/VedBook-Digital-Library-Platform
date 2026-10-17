import path from "node:path";
import { readFile, writeFile } from "node:fs/promises";
import { getDocument } from "pdfjs-dist/legacy/build/pdf.mjs";
import { createCanvas } from "@napi-rs/canvas";
import { getCoversDir } from "./storage.js";

export const generateBookCover = async (pdfPath, pdfFilename) => {
  const pdfBytes = new Uint8Array(await readFile(pdfPath));

  const loadingTask = getDocument({
    data: pdfBytes,
    useSystemFonts: true,
    isEvalSupported: false,
  });

  let pdf;

  try {
    pdf = await loadingTask.promise;

    if (pdf.numPages < 1) {
      throw new Error("PDF has no pages");
    }

    // Get the first page of the PDF
    const page = await pdf.getPage(1);
    const viewport = page.getViewport({ scale: 1.5 });

    const canvas = createCanvas(
      Math.ceil(viewport.width),
      Math.ceil(viewport.height),
    );

    const context = canvas.getContext("2d");

    await page.render({
      canvas,
      canvasContext: context,
      viewport,
    }).promise;

    const baseName = path.parse(pdfFilename).name;
    const filename = `${baseName}.png`;
    const outputPath = path.join(getCoversDir(), filename);

    await writeFile(outputPath, await canvas.encode("png"));

    return `uploads/covers/${filename}`;
  } finally {
    if (typeof loadingTask.destroy === "function") {
      await loadingTask.destroy().catch((error) => {
        console.error("PDF loading task cleanup failed:", error.message);
      });
    }
  }
};
