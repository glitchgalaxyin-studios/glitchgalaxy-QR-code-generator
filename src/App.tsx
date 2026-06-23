import { useState, useEffect, useRef } from 'react';
import QRCode from 'qrcode';
import './App.css';

export default function App() {
  // Form State
  const [payeeName, setPayeeName] = useState('');
  const [upiId, setUpiId] = useState('');
  const [amount, setAmount] = useState('');
  const [remarks, setRemarks] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [invoiceId, setInvoiceId] = useState('');

  // Visibility toggles for fields on poster/receipt
  const [showPayeeName, setShowPayeeName] = useState(true);
  const [showUpiId, setShowUpiId] = useState(true);
  const [showAmount, setShowAmount] = useState(true);
  const [showCustomerName, setShowCustomerName] = useState(true);
  const [showInvoiceId, setShowInvoiceId] = useState(true);


  // Canvas / QR State
  const [qrSize, setQrSize] = useState(260);
  const [qrX, setQrX] = useState(211);
  const [qrY, setQrY] = useState(455); // Shifted down to accommodate the logo above it
  const qrColorDark = '#000000'; // Pure black for cream template
  const qrColorLight = '#ffffff'; // White background for cream template

  // UI state
  const [showAdvanced, setShowAdvanced] = useState(false);

  // References
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Default coordinate helpers
  const resetCoordinates = () => {
    setQrSize(260);
    setQrX(211);
    setQrY(455); // Shifted down to accommodate the logo above it
  };

  // Reset all form details and coordinates
  const resetFormDetails = () => {
    setPayeeName('');
    setUpiId('');
    setAmount('');
    setRemarks('');
    setCustomerName('');
    setInvoiceId('');
    setShowPayeeName(true);
    setShowUpiId(true);
    setShowAmount(true);
    setShowCustomerName(true);
    setShowInvoiceId(true);

    resetCoordinates();
  };

  // Auto center QR both horizontally and vertically
  const autoCenterBoth = () => {
    const canvasWidth = 682;
    const placeholderCenterY = 585; // Center Y for QR code area
    setQrX(Math.round((canvasWidth - qrSize) / 2));
    setQrY(Math.round(placeholderCenterY - (qrSize / 2)));
  };

  // Helper to load an image from URL
  const loadImage = (src: string): Promise<HTMLImageElement> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error(`Failed to load image: ${src}`));
      img.src = src;
    });
  };


  // Main Canvas Drawing Effect
  useEffect(() => {
    let active = true;

    const render = async () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // Define static dimensions
      canvas.width = 682;
      canvas.height = 1024;

      // Construct UPI URL format
      // upi://pay?pa=UPI_ID&pn=NAME&am=AMOUNT&cu=CURRENCY_CODE&tr=INVOICE_ID&tn=REMARKS
      let upiUrl = `upi://pay?pa=${upiId}&pn=${encodeURIComponent(payeeName)}`;
      if (amount) {
        upiUrl += `&am=${amount}`;
      }
      upiUrl += `&cu=INR`; // default currency code
      if (invoiceId) {
        upiUrl += `&tr=${encodeURIComponent(invoiceId)}`;
      }
      
      let finalRemarks = remarks;
      if (customerName) {
        finalRemarks = finalRemarks ? `${finalRemarks} - Cust: ${customerName}` : `Cust: ${customerName}`;
      }
      if (finalRemarks) {
        upiUrl += `&tn=${encodeURIComponent(finalRemarks)}`;
      }

      // Generate QR Code as Data URL
      let qrDataUrl = '';
      try {
        qrDataUrl = await QRCode.toDataURL(upiUrl, {
          margin: 1,
          width: 512,
          color: {
            dark: qrColorDark,
            light: qrColorLight
          }
        });
      } catch (err) {
        console.error('QR Generation failed:', err);
        return;
      }

      if (!active) return;

      // Clear Canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // --- LIGHT TEMPLATE MODE ---
      try {
        // Load base image
        const img = await loadImage('/assets/template_light.jpg');
        if (!active) return;

        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

        // --- SCAN AND DETECT TOP BADGE (before cream-to-white conversion) ---
        let targetX1 = 217;
        let targetX2 = 465;
        let targetY1 = 148;
        let targetY2 = 242;

        try {
          const scanData = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
          let minX = 999, maxX = 0, minY = 999, maxY = 0;
          let found = false;
          // Scan range around the top logo badge
          for (let y = 120; y < 280; y++) {
            for (let x = 150; x < 530; x++) {
              const idx = (y * canvas.width + x) * 4;
              const r = scanData[idx];
              const g = scanData[idx+1];
              const b = scanData[idx+2];
              if (r > 253 && g > 253 && b > 253) {
                if (x < minX) minX = x;
                if (x > maxX) maxX = x;
                if (y < minY) minY = y;
                if (y > maxY) maxY = y;
                found = true;
              }
            }
          }
          if (found && (maxX - minX) > 100 && (maxY - minY) > 40) {
            targetX1 = minX;
            targetX2 = maxX;
            targetY1 = minY;
            targetY2 = maxY;
          }
        } catch (e) {
          console.error("Error scanning top card bounds:", e);
        }

        const targetW = targetX2 - targetX1;
        const targetH = targetY2 - targetY1;
        const captureX = targetX1 - 8;
        const captureY = targetY1 - 8;
        const captureW = targetW + 16;
        const captureH = targetH + 16;

        // Erase the top badge
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(captureX, captureY, captureW, captureH);

        // Convert the cream background of the template image to pure white
        try {
          const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const data = imgData.data;
          for (let i = 0; i < data.length; i += 4) {
            const r = data[i];
            const g = data[i + 1];
            const b = data[i + 2];
            // Cream color check: very light and close to background color #FAF6F0
            // Red > 230, Green > 225, Blue > 215
            if (r > 230 && g > 225 && b > 215) {
              data[i] = 255;
              data[i + 1] = 255;
              data[i + 2] = 255;
            }
          }
          ctx.putImageData(imgData, 0, 0);
        } catch (e) {
          console.error('Error post-processing image data:', e);
        }

        // --- ERASE MESSY HAND-DRAWN ACCENTS & DRAW CLEAN "SCAN TO PAY" ---
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(120, 244, 442, 111);

        ctx.fillStyle = '#000000';
        ctx.font = '800 24px "Inter", sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        if ('letterSpacing' in ctx) {
          // @ts-ignore
          ctx.letterSpacing = '3px';
        }
        ctx.fillText('SCAN TO PAY', 341, 300);
        if ('letterSpacing' in ctx) {
          // @ts-ignore
          ctx.letterSpacing = '0px';
        }



        // Cover only the inner content area — leave template dashed border lines intact
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(168, 318, 346, 372);

        // Redraw the two vertical dashed border lines that the white fill may have covered
        ctx.strokeStyle = '#cccccc';
        ctx.lineWidth = 1;
        ctx.setLineDash([6, 6]);
        // Left dashed line
        ctx.beginPath();
        ctx.moveTo(155, 244);
        ctx.lineTo(155, 700);
        ctx.stroke();
        // Right dashed line
        ctx.beginPath();
        ctx.moveTo(527, 244);
        ctx.lineTo(527, 700);
        ctx.stroke();
        ctx.setLineDash([]);

        // --- DRAW GLITCH GALAXY LOGO (ROUNDED CARD) ---
        try {
          const logoImg = await loadImage('/assets/logo_glitch.png');
          if (active) {
            // Centred in the gap between SCAN TO PAY (Y=300) and QR brackets (~Y=455)
            const destW = 75;
            const destH = Math.round((logoImg.height / logoImg.width) * destW);
            const destX = Math.round((canvas.width - destW) / 2);
            // Gap midpoint: (318 + 455) / 2 = 386
            const destY = Math.round(386 - destH / 2);
            const radius = 12;

            // Clip to a rounded rectangle before drawing
            ctx.save();
            ctx.beginPath();
            if (typeof ctx.roundRect === 'function') {
              ctx.roundRect(destX, destY, destW, destH, radius);
            } else {
              // Fallback manual round rect
              ctx.moveTo(destX + radius, destY);
              ctx.lineTo(destX + destW - radius, destY);
              ctx.quadraticCurveTo(destX + destW, destY, destX + destW, destY + radius);
              ctx.lineTo(destX + destW, destY + destH - radius);
              ctx.quadraticCurveTo(destX + destW, destY + destH, destX + destW - radius, destY + destH);
              ctx.lineTo(destX + radius, destY + destH);
              ctx.quadraticCurveTo(destX, destY + destH, destX, destY + destH - radius);
              ctx.lineTo(destX, destY + radius);
              ctx.quadraticCurveTo(destX, destY, destX + radius, destY);
              ctx.closePath();
            }
            ctx.clip();
            ctx.drawImage(logoImg, destX, destY, destW, destH);
            ctx.restore();
          }
        } catch (e) {
          console.error('Error drawing Glitch Galaxy logo:', e);
        }

        // Re-draw corner brackets around the QR space (X=231 to 451, Y=410 to 630)
        // Make brackets pure black to match the clean B&W poster aesthetic
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 4;
        const bracketLen = 24;
        const bOffset = 14; // Padding offset outward from QR box
        const bx = qrX - bOffset;
        const by = qrY - bOffset;
        const bs = qrSize + (bOffset * 2);

        // Top Left Bracket
        ctx.beginPath();
        ctx.moveTo(bx + bracketLen, by);
        ctx.lineTo(bx, by);
        ctx.lineTo(bx, by + bracketLen);
        ctx.stroke();

        // Top Right Bracket
        ctx.beginPath();
        ctx.moveTo(bx + bs - bracketLen, by);
        ctx.lineTo(bx + bs, by);
        ctx.lineTo(bx + bs, by + bracketLen);
        ctx.stroke();

        // Bottom Left Bracket
        ctx.beginPath();
        ctx.moveTo(bx, by + bs - bracketLen);
        ctx.lineTo(bx, by + bs);
        ctx.lineTo(bx + bracketLen, by + bs);
        ctx.stroke();

        // Bottom Right Bracket
        ctx.beginPath();
        ctx.moveTo(bx + bs - bracketLen, by + bs);
        ctx.lineTo(bx + bs, by + bs);
        ctx.lineTo(bx + bs, by + bs - bracketLen);
        ctx.stroke();

        // Draw custom generated QR Code on top
        const qrImg = await loadImage(qrDataUrl);
        if (!active) return;
        ctx.drawImage(qrImg, qrX, qrY, qrSize, qrSize);

        // --- REPLACE NAVI LOGO WITH 60+ APPS ---
        // Cover Navi logo (clear region from X = 550 to 635, Y = 850 to 950)
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(550, 850, 85, 100);

        // Draw "60+" circular badge (larger size to match PhonePe)
        const badgeCenterX = 590;
        const badgeCenterY = 900; // Center aligned vertically with other logos
        const badgeRadius = 23; // Larger size matching PhonePe circle

        ctx.fillStyle = '#000000'; // Match pure black-and-white theme
        ctx.beginPath();
        ctx.arc(badgeCenterX, badgeCenterY, badgeRadius, 0, 2 * Math.PI);
        ctx.fill();

        // Draw "60+" text inside circle
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 13px "Space Mono", monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('60+', badgeCenterX, badgeCenterY);

        // Draw "Apps" label below circle (aligned horizontally with other labels)
        ctx.fillStyle = '#444444'; // Muted dark label color
        ctx.font = '500 12px "Inter", sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'alphabetic';
        ctx.fillText('Apps', badgeCenterX, 942);

        // --- DRAW TRANSACTION RECEIPT CARD AT THE TOP ---
        const receiptFields: { label: string; value: string }[] = [];
        if (showPayeeName && payeeName.trim()) {
          receiptFields.push({ label: 'PAYEE NAME', value: payeeName.trim() });
        }
        if (showUpiId && upiId.trim()) {
          receiptFields.push({ label: 'UPI ID / VPA', value: upiId.trim() });
        }
        if (showCustomerName && customerName.trim()) {
          receiptFields.push({ label: 'CUSTOMER', value: customerName.trim() });
        }
        if (showInvoiceId && invoiceId.trim()) {
          receiptFields.push({ label: 'INVOICE ID', value: invoiceId.trim() });
        }
        if (showAmount && amount.trim()) {
          const parsedAmount = parseFloat(amount);
          if (!isNaN(parsedAmount)) {
            receiptFields.push({
              label: 'AMOUNT',
              value: `INR ${parsedAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
            });
          }
        }

        // Draw Receipt Box (centered vertically where the Glitch Galaxy badge used to be, shifted up by 46px)
        const centerY = (targetY1 + targetY2) / 2;
        const cardW = 500;
        const cardH = 190;
        const cardX = Math.round((canvas.width - cardW) / 2);
        const cardY = Math.round(centerY - cardH / 2) - 46;

        ctx.fillStyle = '#fafafa'; // Light grey/white receipt card background
        ctx.strokeStyle = '#000000'; // Pure black borders
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        if (typeof ctx.roundRect === 'function') {
          ctx.roundRect(cardX, cardY, cardW, cardH, 6);
        } else {
          ctx.rect(cardX, cardY, cardW, cardH);
        }
        ctx.fill();
        ctx.stroke();

        // Draw Receipt Header
        ctx.fillStyle = '#000000';
        ctx.font = 'bold 13px "Space Mono", monospace';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';
        ctx.fillText('TRANSACTION RECEIPT', cardX + 16, cardY + 19);




        // Draw Header divider dashed line
        ctx.strokeStyle = '#cccccc';
        ctx.lineWidth = 1.2;
        ctx.setLineDash([4, 4]);
        ctx.beginPath();
        ctx.moveTo(cardX + 16, cardY + 38);
        ctx.lineTo(cardX + cardW - 16, cardY + 36);
        ctx.stroke();
        ctx.setLineDash([]); // reset line dash

        // Draw Key-Value rows dynamically centered in the remaining height
        if (receiptFields.length > 0) {
          const itemHeight = 22;
          const startY = cardY + 38 + (cardH - 38 - 16 - (receiptFields.length * itemHeight)) / 2 + (itemHeight / 2);

          receiptFields.forEach((field, index) => {
            const y = startY + (index * itemHeight);

            // Draw label
            ctx.fillStyle = '#666666';
            ctx.font = '700 11px "Space Mono", monospace';
            ctx.textAlign = 'left';
            ctx.textBaseline = 'middle';
            ctx.fillText(field.label, cardX + 16, y);

            // Draw value
            ctx.fillStyle = '#000000';
            ctx.font = '600 14px "Inter", sans-serif';
            ctx.textAlign = 'right';
            ctx.textBaseline = 'middle';
            ctx.fillText(field.value, cardX + cardW - 16, y);
          });
        } else {
          // Empty state placeholder
          ctx.fillStyle = '#888888';
          ctx.font = 'italic 11px "Inter", sans-serif';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText('Scan to Pay using any UPI app', cardX + (cardW / 2), cardY + 105);
        }

        // Reset alignment properties
        ctx.textAlign = 'start';
        ctx.textBaseline = 'alphabetic';

      } catch (err) {
        console.error('Error rendering light template:', err);
        // Fallback UI rendering if image fails
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = '#000000';
        ctx.font = '24px Inter';
        ctx.fillText('Failed to load template image.', 100, 500);
      }
    };

    render();

    return () => {
      active = false;
    };
  }, [
    payeeName,
    upiId,
    amount,
    remarks,
    customerName,
    invoiceId,
    showPayeeName,
    showUpiId,
    showAmount,
    showCustomerName,
    showInvoiceId,
    qrSize,
    qrX,
    qrY,
    qrColorDark,
    qrColorLight
  ]);

  // Handle PNG Download
  const handleDownload = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Convert canvas content to PNG Data URL
    const pngUrl = canvas.toDataURL('image/png');
    
    // Create download link
    const downloadLink = document.createElement('a');
    
    // Format filename based on template and payee name
    const sanitizedName = payeeName.trim().replace(/[^a-zA-Z0-9]/g, '_').toLowerCase();
    downloadLink.download = `upi_qr_${sanitizedName || 'code'}.png`;
    downloadLink.href = pngUrl;
    
    // Trigger download
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);
  };

  return (
    <div className="app-container" ref={containerRef}>
      
      {/* LEFT: Control panel card */}
      <div className="control-panel">
        



        {/* Form Fields */}
        <div className="form-group">
          <div className="label-row">
            <label className="form-label" htmlFor="payee-name">1) Your Name (Payee)</label>
            <label className="toggle-label">
              <input
                type="checkbox"
                checked={showPayeeName}
                onChange={(e) => setShowPayeeName(e.target.checked)}
              />
              Show on Receipt
            </label>
          </div>
          <input
            id="payee-name"
            type="text"
            className="form-input"
            value={payeeName}
            onChange={(e) => setPayeeName(e.target.value)}
            placeholder="e.g. Jane Doe"
            maxLength={35}
          />
        </div>

        <div className="form-group">
          <div className="label-row">
            <label className="form-label" htmlFor="upi-id">2) Your UPI ID (VPA)</label>
            <label className="toggle-label">
              <input
                type="checkbox"
                checked={showUpiId}
                onChange={(e) => setShowUpiId(e.target.checked)}
              />
              Show on Receipt
            </label>
          </div>
          <input
            id="upi-id"
            type="text"
            className="form-input input-mono"
            value={upiId}
            onChange={(e) => setUpiId(e.target.value)}
            placeholder="e.g. jane@upi"
          />
        </div>

        <div className="form-group">
          <div className="label-row">
            <label className="form-label" htmlFor="amount">3) Amount (Optional)</label>
            <label className="toggle-label">
              <input
                type="checkbox"
                checked={showAmount}
                onChange={(e) => setShowAmount(e.target.checked)}
              />
              Show on Receipt
            </label>
          </div>
          <div className="input-wrapper">
            <input
              id="amount"
              type="number"
              className="form-input form-input-currency input-mono"
              value={amount}
              onChange={(e) => setAmount(Math.max(0, parseFloat(e.target.value) || 0) ? e.target.value : '')}
              placeholder="e.g. 500"
              min="0"
              step="any"
            />
            <span className="currency-indicator">INR</span>
          </div>
        </div>

        <div className="form-group">
          <div className="label-row">
            <label className="form-label" htmlFor="customer-name">4) Customer Name (Optional)</label>
            <label className="toggle-label">
              <input
                type="checkbox"
                checked={showCustomerName}
                onChange={(e) => setShowCustomerName(e.target.checked)}
              />
              Show on Receipt
            </label>
          </div>
          <input
            id="customer-name"
            type="text"
            className="form-input"
            value={customerName}
            onChange={(e) => setCustomerName(e.target.value)}
            placeholder="e.g. John Doe"
            maxLength={35}
          />
        </div>

        <div className="form-group">
          <div className="label-row">
            <label className="form-label" htmlFor="invoice-id">5) Invoice ID (Optional)</label>
            <label className="toggle-label">
              <input
                type="checkbox"
                checked={showInvoiceId}
                onChange={(e) => setShowInvoiceId(e.target.checked)}
              />
              Show on Receipt
            </label>
          </div>
          <input
            id="invoice-id"
            type="text"
            className="form-input input-mono"
            value={invoiceId}
            onChange={(e) => setInvoiceId(e.target.value)}
            placeholder="e.g. INV-2026-001"
            maxLength={25}
          />
        </div>

        <div className="form-group">
          <label className="form-label" htmlFor="remarks">6) Remarks (Optional)</label>
          <input
            id="remarks"
            type="text"
            className="form-input"
            value={remarks}
            onChange={(e) => setRemarks(e.target.value)}
            placeholder="e.g. Design Invoice"
            maxLength={50}
          />
        </div>




        {/* Collapsible Advanced Layout Controls */}
        <div className="form-group">
          <button 
            className="advanced-toggle"
            onClick={() => setShowAdvanced(!showAdvanced)}
            aria-expanded={showAdvanced}
          >
            <span className={`advanced-icon ${showAdvanced ? 'open' : ''}`}>▶</span> 
            Advanced QR Alignment
          </button>
          
          {showAdvanced && (
            <div className="advanced-panel">
              <div className="slider-group">
                <div className="slider-header">
                  <span>QR Code Size</span>
                  <span className="slider-value">{qrSize}px</span>
                </div>
                <input
                  type="range"
                  className="slider-input"
                  min="120"
                  max="350"
                  value={qrSize}
                  onChange={(e) => setQrSize(parseInt(e.target.value))}
                />
              </div>

              <div className="slider-group">
                <div className="slider-header">
                  <span>X Coordinate Offset</span>
                  <span className="slider-value">{qrX}px</span>
                </div>
                <input
                  type="range"
                  className="slider-input"
                  min="50"
                  max="500"
                  value={qrX}
                  onChange={(e) => setQrX(parseInt(e.target.value))}
                />
              </div>

              <div className="slider-group">
                <div className="slider-header">
                  <span>Y Coordinate Offset</span>
                  <span className="slider-value">{qrY}px</span>
                </div>
                <input
                  type="range"
                  className="slider-input"
                  min="200"
                  max="800"
                  value={qrY}
                  onChange={(e) => setQrY(parseInt(e.target.value))}
                />
              </div>

              <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
                <button 
                  className="btn btn-secondary" 
                  style={{ flex: 1, padding: '8px 10px', fontSize: '11px' }}
                  onClick={autoCenterBoth}
                >
                  Auto Center QR
                </button>
                <button 
                  className="btn btn-secondary" 
                  style={{ flex: 1, padding: '8px 10px', fontSize: '11px' }}
                  onClick={resetCoordinates}
                >
                  Reset Offsets
                </button>
              </div>

            </div>
          )}
        </div>

        {/* Primary Exporter Buttons */}
        <div className="action-buttons">
          <button className="btn btn-primary" onClick={handleDownload}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
            Download PNG Poster
          </button>
          
          <button className="btn btn-secondary" onClick={resetFormDetails}>
            Reset Form Details
          </button>
        </div>

      </div>

      {/* RIGHT: Live Interactive Preview */}
      <div className="preview-container">
        
        {/* Live Canvas Display */}
        <div className="poster-card-wrapper">
          <canvas ref={canvasRef} className="poster-canvas" />
        </div>

        {/* Scan Status Instructions */}
        <div className="preview-info">
          Format: <span>{`upi://pay?pa=${upiId}&pn=${payeeName}${amount ? `&am=${amount}` : ''}&cu=INR${invoiceId ? `&tr=${invoiceId}` : ''}${customerName ? `&tn=${remarks ? `${remarks} - ` : ''}Cust: ${customerName}` : remarks ? `&tn=${remarks}` : ''}`}</span>
        </div>
        {/* Powered-by footer */}
        <div className="powered-by-footer">
          <img src="/assets/brand_logo.png" alt="Glitch Galaxy" className="powered-by-logo" />
          <span>Powered by <strong>Glitch Galaxy</strong> QR Code Generator</span>
        </div>

      </div>

    </div>
  );
}
