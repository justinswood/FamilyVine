import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

const MAX_CANVAS_PX = 14000;
const MIN_EXPORT_SCALE = 0.3;
const EXPORT_PADDING = 60;

// Known visual overflow beyond layout bounds (px in tree coordinate space)
const OVERFLOW = {
  top: 30,    // Profile photos: top: -24px + shadow
  bottom: 40, // Connector lines + junction badges
  left: 10,   // Union background wash (-6px) + shadows
  right: 10,
};

/**
 * Pre-convert all images to inline data URLs for reliable html2canvas capture.
 */
async function inlineImages(container) {
  const imgs = container.querySelectorAll('img');
  const promises = Array.from(imgs).map(async (img) => {
    if (!img.src || img.src.startsWith('data:')) return;
    try {
      const response = await fetch(img.src, { mode: 'cors' });
      const blob = await response.blob();
      const dataUrl = await new Promise((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result);
        reader.readAsDataURL(blob);
      });
      img.src = dataUrl;
    } catch {
      // Cross-origin images (avatar API) — skip silently
    }
  });
  await Promise.all(promises);
}

/**
 * Export the family tree to a downloadable PDF.
 *
 * Strategy: size the transformRef (inner div) to the full tree dimensions,
 * use fitToView to position content, then capture the transformRef directly.
 * This avoids html2canvas window-clipping issues with position:fixed elements.
 */
export async function exportTreeToPdf({ transformRef, viewportRef, controllerRef, bounds, fitToView }) {
  if (!transformRef || !controllerRef?.current || !bounds || !fitToView) {
    throw new Error('Missing required refs for PDF export');
  }

  const controller = controllerRef.current;
  const savedTransform = controller.getTransform();

  // Save styles to restore
  const savedViewport = {
    overflow: viewportRef.style.overflow,
    width: viewportRef.style.width,
    height: viewportRef.style.height,
  };
  const savedTransformEl = {
    width: transformRef.style.width,
    height: transformRef.style.height,
    overflow: transformRef.style.overflow,
  };

  viewportRef.classList.add('fv-exporting');

  try {
    // Expand bounds to include visual overflow (photos, shadows, connectors)
    const expandedBounds = {
      minX: bounds.minX - OVERFLOW.left,
      minY: bounds.minY - OVERFLOW.top,
      maxX: bounds.maxX + OVERFLOW.right,
      maxY: bounds.maxY + OVERFLOW.bottom,
    };

    const treeWidth = expandedBounds.maxX - expandedBounds.minX;
    const treeHeight = expandedBounds.maxY - expandedBounds.minY;
    const totalWidth = treeWidth + EXPORT_PADDING * 2;
    const totalHeight = treeHeight + EXPORT_PADDING * 2;

    // Scale down if needed for canvas limits
    let sizeScale = 1;
    if (Math.max(totalWidth, totalHeight) > MAX_CANVAS_PX) {
      sizeScale = MAX_CANVAS_PX / Math.max(totalWidth, totalHeight);
    }
    sizeScale = Math.max(MIN_EXPORT_SCALE, sizeScale);

    const canvasWidth = Math.ceil(totalWidth * sizeScale);
    const canvasHeight = Math.ceil(totalHeight * sizeScale);

    // Remove overflow clipping on viewport
    viewportRef.style.overflow = 'visible';

    // Size BOTH viewport and transformRef to the canvas dimensions.
    // fitToView reads viewport dimensions to compute zoom/pan.
    // html2canvas captures transformRef at its rendered size.
    viewportRef.style.width = `${canvasWidth}px`;
    viewportRef.style.height = `${canvasHeight}px`;
    transformRef.style.width = `${canvasWidth}px`;
    transformRef.style.height = `${canvasHeight}px`;
    transformRef.style.overflow = 'visible';

    // Use the controller's fitToView — proven positioning logic.
    // It reads the viewport's getBoundingClientRect() for dimensions,
    // then computes zoom + pan to center expandedBounds with padding.
    fitToView(expandedBounds, EXPORT_PADDING);

    // Wait for layout + render
    await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));

    // Inline all images for reliable capture
    await inlineImages(transformRef);
    await new Promise(r => setTimeout(r, 300));

    // Compute render scale for resolution (up to 3x, within canvas limits)
    const maxRenderedDim = Math.max(canvasWidth, canvasHeight);
    const renderScale = Math.min(3, Math.floor(MAX_CANVAS_PX / maxRenderedDim)) || 1;

    // Capture the transformRef directly — NOT the viewport.
    // This avoids html2canvas clipping to the browser window size.
    const canvas = await html2canvas(transformRef, {
      backgroundColor: '#F9F8F3',
      scale: renderScale,
      useCORS: true,
      allowTaint: false,
      logging: false,
      width: canvasWidth,
      height: canvasHeight,
    });

    // Generate PDF
    const isLandscape = canvasWidth > canvasHeight;
    const pageFormat = Math.max(canvasWidth, canvasHeight) > 3000 ? 'a3' : 'a4';

    const doc = new jsPDF({
      orientation: isLandscape ? 'landscape' : 'portrait',
      unit: 'mm',
      format: pageFormat,
    });

    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const footerHeight = 8;
    const availableWidth = pageWidth - 10;
    const availableHeight = pageHeight - 10 - footerHeight;

    const imgAspect = canvasWidth / canvasHeight;
    const pageAspect = availableWidth / availableHeight;
    let imgWidth, imgHeight;

    if (imgAspect > pageAspect) {
      imgWidth = availableWidth;
      imgHeight = availableWidth / imgAspect;
    } else {
      imgHeight = availableHeight;
      imgWidth = availableHeight * imgAspect;
    }

    const xOffset = (pageWidth - imgWidth) / 2;
    const yOffset = (pageHeight - footerHeight - imgHeight) / 2;

    const imgData = canvas.toDataURL('image/jpeg', 0.92);
    doc.addImage(imgData, 'JPEG', xOffset, yOffset, imgWidth, imgHeight);

    doc.setFontSize(7);
    doc.setTextColor(134, 167, 137);
    const dateStr = new Date().toLocaleDateString('en-US', {
      year: 'numeric', month: 'long', day: 'numeric'
    });
    doc.text(`FamilyVine \u2014 ${dateStr}`, pageWidth / 2, pageHeight - 4, { align: 'center' });

    doc.save('FamilyVine-Tree.pdf');

  } finally {
    // Restore styles
    viewportRef.style.overflow = savedViewport.overflow;
    viewportRef.style.width = savedViewport.width;
    viewportRef.style.height = savedViewport.height;
    transformRef.style.width = savedTransformEl.width;
    transformRef.style.height = savedTransformEl.height;
    transformRef.style.overflow = savedTransformEl.overflow;

    // Restore pan/zoom
    controller.setTransform(savedTransform, true);
    viewportRef.classList.remove('fv-exporting');
  }
}
