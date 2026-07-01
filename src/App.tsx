import { useState, useEffect, useRef } from 'react';
import QRCode from 'qrcode';
import './App.css';

export default function App() {
  // Form State
  const [payeeName, setPayeeName] = useState('Glitch Galaxy');
  const [upiId, setUpiId] = useState('glitchgalaxy.in@okhdfcbank');
  const [amount, setAmount] = useState('');
  const [remarks, setRemarks] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [invoiceNumber, setInvoiceNumber] = useState(() => String(Math.floor(1000 + Math.random() * 9000)));
  const [whatsappNumber, setWhatsappNumber] = useState('');
  const [transactionDate, setTransactionDate] = useState(() => {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  });
  const [showTransactionDate, setShowTransactionDate] = useState(true);

  // Visibility toggles for fields on poster/receipt
  const [showPayeeName, setShowPayeeName] = useState(true);
  const [showUpiId, setShowUpiId] = useState(true);
  const [showAmount, setShowAmount] = useState(true);
  const [showCustomerName, setShowCustomerName] = useState(true);
  const [showInvoiceId, setShowInvoiceId] = useState(true);

  // Derived state
  const fullInvoiceId = invoiceNumber.trim() ? `INV/26-27/${invoiceNumber.trim()}` : '';

  const formatDateForReceipt = (dateStr: string) => {
    if (!dateStr) return '';
    const [yyyy, mm, dd] = dateStr.split('-');
    if (!yyyy || !mm || !dd) return dateStr;
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const monthIndex = parseInt(mm, 10) - 1;
    const monthName = months[monthIndex] || mm;
    return `${dd} ${monthName} ${yyyy}`;
  };

  // Canvas / QR State
  const [qrSize, setQrSize] = useState(260);
  const [qrX, setQrX] = useState(211);
  const [qrY, setQrY] = useState(455); // Original Y coordinate
  const qrColorDark = '#000000'; // Pure black for cream template
  const qrColorLight = '#ffffff'; // White background for cream template

  // UI state
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [showWhatsappModal, setShowWhatsappModal] = useState(false);

  // References
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Default coordinate helpers
  const resetCoordinates = () => {
    setQrSize(260);
    setQrX(211);
    setQrY(455); // Original Y coordinate
  };

  // Reset all form details and coordinates
  const resetFormDetails = () => {
    setPayeeName('Glitch Galaxy');
    setUpiId('glitchgalaxy.in@okhdfcbank');
    setAmount('');
    setRemarks('');
    setCustomerName('');
    setInvoiceNumber(String(Math.floor(1000 + Math.random() * 9000)));
    setWhatsappNumber('');
    setShowPayeeName(true);
    setShowUpiId(true);
    setShowAmount(true);
    setShowCustomerName(true);
    setShowInvoiceId(true);
    setTransactionDate(() => {
      const today = new Date();
      const yyyy = today.getFullYear();
      const mm = String(today.getMonth() + 1).padStart(2, '0');
      const dd = String(today.getDate()).padStart(2, '0');
      return `${yyyy}-${mm}-${dd}`;
    });
    setShowTransactionDate(true);

    resetCoordinates();
  };

  // Auto center QR both horizontally and vertically
  const autoCenterBoth = () => {
    const canvasWidth = 682;
    const placeholderCenterY = 585; // Original Center Y for QR code area
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

      const scale = 2; // Resolution multiplier

      // Define static dimensions scaled up
      canvas.width = 682 * scale;
      canvas.height = 1024 * scale;

      // Enable high quality rendering parameters
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';

      // Construct NPCI-compliant UPI URL format
      const upiParams = new URLSearchParams();
      upiParams.append('pa', upiId.trim());
      upiParams.append('pn', payeeName.trim());
      
      if (amount.trim()) {
        const parsedAmount = parseFloat(amount);
        if (!isNaN(parsedAmount) && parsedAmount > 0) {
          upiParams.append('am', parsedAmount.toFixed(2));
        }
      }
      
      upiParams.append('cu', 'INR');
      
      if (fullInvoiceId) {
        // Strip out all special characters using /[^a-zA-Z0-9]/g to keep it strictly alphanumeric
        const cleanInvoiceId = fullInvoiceId.replace(/[^a-zA-Z0-9]/g, '');
        if (cleanInvoiceId) {
          upiParams.append('tr', cleanInvoiceId);
        }
      }
      
      upiParams.append('mc', '0000');
      
      let finalRemarks = remarks;
      if (customerName) {
        finalRemarks = finalRemarks ? `${finalRemarks} - Cust: ${customerName}` : `Cust: ${customerName}`;
      }
      if (finalRemarks.trim()) {
        upiParams.append('tn', finalRemarks.trim());
      }
      
      const upiUrl = `upi://pay?${upiParams.toString()}`;

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

      // Fill canvas background with solid white
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // --- LIGHT TEMPLATE MODE ---
      try {
        const shiftY = 0;
        // Load base image
        const img = await loadImage('/assets/template_light.jpg');
        if (!active) return;

        ctx.drawImage(img, 0, shiftY * scale, canvas.width, canvas.height);

        // --- SCAN AND DETECT TOP BADGE (before cream-to-white conversion) ---
        let targetX1 = 217 * scale;
        let targetX2 = 465 * scale;
        let targetY1 = (148 + shiftY) * scale;
        let targetY2 = (242 + shiftY) * scale;

        try {
          const scanData = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
          let minX = 999 * scale, maxX = 0, minY = 999 * scale, maxY = 0;
          let found = false;
          // Scan range around the top logo badge (shifted)
          for (let y = (120 + shiftY) * scale; y < (280 + shiftY) * scale; y++) {
            for (let x = 150 * scale; x < 530 * scale; x++) {
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
          if (found && (maxX - minX) > 100 * scale && (maxY - minY) > 40 * scale) {
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
        const captureX = targetX1 - 8 * scale;
        const captureY = targetY1 - 8 * scale;
        const captureW = targetW + 16 * scale;
        const captureH = targetH + 16 * scale;

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
        ctx.fillRect(120 * scale, (244 + shiftY) * scale, 442 * scale, 111 * scale);

        ctx.fillStyle = '#000000';
        ctx.font = `800 ${24 * scale}px "Inter", sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        if ('letterSpacing' in ctx) {
          // @ts-ignore
          ctx.letterSpacing = `${3 * scale}px`;
        }
        ctx.fillText('SCAN TO PAY', 341 * scale, (300 + shiftY) * scale);
        if ('letterSpacing' in ctx) {
          // @ts-ignore
          ctx.letterSpacing = '0px';
        }

        // Cover only the inner content area — leave template dashed border lines intact
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(168 * scale, (318 + shiftY) * scale, 346 * scale, 372 * scale);

        // Redraw the two vertical dashed border lines that the white fill may have covered
        ctx.strokeStyle = '#cccccc';
        ctx.lineWidth = 1 * scale;
        ctx.setLineDash([6 * scale, 6 * scale]);
        // Left dashed line
        ctx.beginPath();
        ctx.moveTo(155 * scale, (244 + shiftY) * scale);
        ctx.lineTo(155 * scale, (700 + shiftY) * scale);
        ctx.stroke();
        // Right dashed line
        ctx.beginPath();
        ctx.moveTo(527 * scale, (244 + shiftY) * scale);
        ctx.lineTo(527 * scale, (700 + shiftY) * scale);
        ctx.stroke();
        ctx.setLineDash([]);

        // --- DRAW GLITCH GALAXY LOGO (ROUNDED CARD) ---
        try {
          const logoImg = await loadImage('/assets/logo_glitch.png');
          if (active) {
            // Centred in the gap between SCAN TO PAY (Y=300) and QR brackets (~Y=455)
            const destW = 75 * scale;
            const destH = Math.round((logoImg.height / logoImg.width) * destW);
            const destX = Math.round((canvas.width - destW) / 2);
            // Gap midpoint: (318 + 455) / 2 = 386 -> shift by shiftY
            const destY = Math.round((386.5 + shiftY) * scale - destH / 2);
            const radius = 12 * scale;

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

        // Re-draw corner brackets around the QR space
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 4 * scale;
        const bracketLen = 24 * scale;
        const bOffset = 14 * scale; // Padding offset outward from QR box
        const bx = qrX * scale - bOffset;
        const by = qrY * scale - bOffset;
        const bs = qrSize * scale + (bOffset * 2);

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
        ctx.drawImage(qrImg, qrX * scale, qrY * scale, qrSize * scale, qrSize * scale);

        // --- REPLACE NAVI LOGO WITH 60+ APPS ---
        // Cover Navi logo (clear region)
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(550 * scale, (850 + shiftY) * scale, 85 * scale, 100 * scale);

        // Draw "60+" circular badge (larger size to match PhonePe)
        const badgeCenterX = 590 * scale;
        const badgeCenterY = (900 + shiftY) * scale; // Center aligned vertically with other logos
        const badgeRadius = 23 * scale; // Larger size matching PhonePe circle

        ctx.fillStyle = '#000000'; // Match pure black-and-white theme
        ctx.beginPath();
        ctx.arc(badgeCenterX, badgeCenterY, badgeRadius, 0, 2 * Math.PI);
        ctx.fill();

        // Draw "60+" text inside circle
        ctx.fillStyle = '#ffffff';
        ctx.font = `bold ${13 * scale}px "Space Mono", monospace`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('60+', badgeCenterX, badgeCenterY);

        // Draw "Apps" label below circle (aligned horizontally with other labels)
        ctx.fillStyle = '#444444'; // Muted dark label color
        ctx.font = `500 ${12 * scale}px "Inter", sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'alphabetic';
        ctx.fillText('Apps', badgeCenterX, (942 + shiftY) * scale);

        // Warning banner removed

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
        if (showInvoiceId && fullInvoiceId.trim()) {
          receiptFields.push({ label: 'INVOICE ID', value: fullInvoiceId.trim() });
        }
        if (showTransactionDate && transactionDate) {
          receiptFields.push({ label: 'DATE', value: formatDateForReceipt(transactionDate) });
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
        const cardW = 500 * scale;
        const cardH = 205 * scale;
        const cardX = Math.round((canvas.width - cardW) / 2);
        const cardY = Math.round(centerY - cardH / 2) - 46 * scale;

        ctx.fillStyle = '#fafafa'; // Light grey/white receipt card background
        ctx.strokeStyle = '#000000'; // Pure black borders
        ctx.lineWidth = 1.5 * scale;
        ctx.beginPath();
        if (typeof ctx.roundRect === 'function') {
          ctx.roundRect(cardX, cardY, cardW, cardH, 6 * scale);
        } else {
          ctx.rect(cardX, cardY, cardW, cardH);
        }
        ctx.fill();
        ctx.stroke();

        // Draw Receipt Header
        ctx.fillStyle = '#000000';
        ctx.font = `bold ${13 * scale}px "Space Mono", monospace`;
        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';
        ctx.fillText('TRANSACTION RECEIPT', cardX + 16 * scale, cardY + 19 * scale);

        // Draw Header divider dashed line
        ctx.strokeStyle = '#cccccc';
        ctx.lineWidth = 1.2 * scale;
        ctx.setLineDash([4 * scale, 4 * scale]);
        ctx.beginPath();
        ctx.moveTo(cardX + 16 * scale, cardY + 38 * scale);
        ctx.lineTo(cardX + cardW - 16 * scale, cardY + 36 * scale);
        ctx.stroke();
        ctx.setLineDash([]); // reset line dash

        // Draw Key-Value rows dynamically centered in the remaining height
        if (receiptFields.length > 0) {
          const itemHeight = 22 * scale;
          const startY = cardY + 38 * scale + (cardH - 38 * scale - 16 * scale - (receiptFields.length * itemHeight)) / 2 + (itemHeight / 2);

          receiptFields.forEach((field, index) => {
            const y = startY + (index * itemHeight);

            // Draw label
            ctx.fillStyle = '#666666';
            ctx.font = `700 ${11 * scale}px "Space Mono", monospace`;
            ctx.textAlign = 'left';
            ctx.textBaseline = 'middle';
            ctx.fillText(field.label, cardX + 16 * scale, y);

            // Draw value
            ctx.fillStyle = '#000000';
            ctx.font = `600 ${14 * scale}px "Inter", sans-serif`;
            ctx.textAlign = 'right';
            ctx.textBaseline = 'middle';
            ctx.fillText(field.value, cardX + cardW - 16 * scale, y);
          });
        } else {
          // Empty state placeholder
          ctx.fillStyle = '#888888';
          ctx.font = `italic ${11 * scale}px "Inter", sans-serif`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText('Scan to Pay using any UPI app', cardX + (cardW / 2), cardY + 105 * scale);
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
    fullInvoiceId,
    showPayeeName,
    showUpiId,
    showAmount,
    showCustomerName,
    showInvoiceId,
    transactionDate,
    showTransactionDate,
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
    
    // Format filename based on invoice ID and customer name
    const invoicePart = fullInvoiceId.trim().replace(/[^a-zA-Z0-9]/g, '_');
    const customerPart = customerName.trim().replace(/[^a-zA-Z0-9]/g, '_');
    
    let fileName = '';
    if (invoicePart && customerPart) {
      fileName = `${invoicePart}_${customerPart}`;
    } else if (invoicePart) {
      fileName = invoicePart;
    } else if (customerPart) {
      fileName = customerPart;
    } else {
      fileName = 'glitch_galaxy_qr';
    }
    
    downloadLink.download = `${fileName}.png`;
    downloadLink.href = pngUrl;
    
    // Trigger download
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);
  };

  const handleWhatsAppShare = () => {
    // Open choice modal (copies image and opens WhatsApp link)
    setShowWhatsappModal(true);
  };

  const executeWhatsAppLink = (mode: 'web' | 'app') => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Construct text message
    let text = `*Payment Details*\n`;
    text += `• *Payee Name:* ${payeeName}\n`;
    text += `• *UPI ID:* ${upiId}\n`;
    if (amount.trim()) {
      const parsedAmount = parseFloat(amount);
      if (!isNaN(parsedAmount)) {
        text += `• *Amount:* INR ${parsedAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}\n`;
      }
    }
    if (customerName.trim()) {
      text += `• *Customer:* ${customerName.trim()}\n`;
    }
    if (fullInvoiceId) {
      text += `• *Invoice:* ${fullInvoiceId}\n`;
    }
    if (transactionDate) {
      text += `• *Date:* ${formatDateForReceipt(transactionDate)}\n`;
    }
    if (remarks.trim()) {
      text += `• *Remarks:* ${remarks.trim()}\n`;
    }
    text += `\n*NOTICE: When uploading the QR in UPI apps, the transaction amount is limited to ₹2000. Please scan the QR code manually using your camera to pay.*`;

    // Clean phone number
    const cleanPhone = whatsappNumber.replace(/[^\d+]/g, '');
    
    // Construct query parameters; omit 'phone' if empty so WhatsApp prompts for contact choice
    const queryParams = [];
    if (cleanPhone) {
      queryParams.push(`phone=${encodeURIComponent(cleanPhone)}`);
    }
    queryParams.push(`text=${encodeURIComponent(text)}`);
    const queryString = queryParams.join('&');

    let finalUrl = '';
    if (mode === 'web') {
      finalUrl = `https://web.whatsapp.com/send?${queryString}`;
    } else {
      finalUrl = `https://api.whatsapp.com/send?${queryString}`;
    }

    try {
      // 1. Prepare PNG blob and file synchronously from canvas to avoid async callback guesture timeouts
      const dataUrl = canvas.toDataURL('image/png');
      const arr = dataUrl.split(',');
      const mime = arr[0].match(/:(.*?);/)![1];
      const bstr = atob(arr[1]);
      let n = bstr.length;
      const u8arr = new Uint8Array(n);
      while (n--) {
        u8arr[n] = bstr.charCodeAt(n);
      }
      const blob = new Blob([u8arr], { type: mime });

      // Copy to clipboard with explicit 'image/png' type and auto-download fallback
      if (navigator.clipboard && navigator.clipboard.write) {
        try {
          // @ts-ignore
          const clipboardItem = new ClipboardItem({ 'image/png': blob });
          navigator.clipboard.write([clipboardItem])
            .then(() => console.log('Poster copied to clipboard successfully!'))
            .catch((err) => {
              console.warn('Clipboard write rejected, falling back to download:', err);
              handleDownload();
            });
        } catch (clipErr) {
          console.warn('Failed to build ClipboardItem, falling back to download:', clipErr);
          handleDownload();
        }
      } else {
        console.warn('Clipboard API not supported, falling back to download');
        handleDownload();
      }

      // 2. Try Web Share API synchronously (attaches the image file natively on mobile phones)
      if (mode === 'app' && navigator.canShare) {
        const file = new File([u8arr], `upi_qr_${payeeName.trim().replace(/[^a-zA-Z0-9]/g, '_').toLowerCase()}.png`, { type: mime });
        const shareData = {
          files: [file],
          text: text
        };
        if (navigator.canShare(shareData)) {
          navigator.share(shareData).catch((e) => {
            console.warn('Native share failed or cancelled, opening backup url:', e);
            window.open(finalUrl, '_blank');
          });
          setShowWhatsappModal(false);
          return;
        }
      }
    } catch (err) {
      console.error('Error preparing synchronous image share:', err);
    }

    // Fallback: Open URL directly (prefills text message in WhatsApp)
    window.open(finalUrl, '_blank');
    setShowWhatsappModal(false);
  };

  return (
    <div className="app-container" ref={containerRef}>
      
      {/* LEFT: Control panel card */}
      <div className="control-panel">
        



        {/* Form Fields */}
        <div className="form-group">
          <label className="form-label" htmlFor="payee-name">1) Your Name (Payee)</label>
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
          <label className="form-label" htmlFor="upi-id">2) Your UPI ID (VPA)</label>
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
          <label className="form-label" htmlFor="amount">3) Amount (Optional)</label>
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
          <label className="form-label" htmlFor="customer-name">4) Customer Name (Optional)</label>
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
          <label className="form-label" htmlFor="invoice-number">5) Invoice Number (INV/26-27/...)</label>
          <div className="input-wrapper">
            <span className="invoice-prefix" style={{
              position: 'absolute',
              left: '14px',
              fontFamily: 'var(--font-mono)',
              fontSize: '14px',
              color: 'var(--text-secondary)',
              fontWeight: 500,
              pointerEvents: 'none'
            }}>INV/26-27/</span>
            <input
              id="invoice-number"
              type="text"
              className="form-input input-mono"
              style={{ paddingLeft: '110px' }}
              value={invoiceNumber}
              onChange={(e) => setInvoiceNumber(e.target.value.replace(/[^a-zA-Z0-9]/g, ''))}
              placeholder="e.g. 1001"
              maxLength={10}
            />
          </div>
        </div>
        <div className="form-group">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <label className="form-label" htmlFor="transaction-date" style={{ marginBottom: 0 }}>6) Transaction Date</label>
            <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: 'var(--text-secondary)', cursor: 'pointer', fontWeight: 500 }}>
              <input
                type="checkbox"
                checked={showTransactionDate}
                onChange={(e) => setShowTransactionDate(e.target.checked)}
                style={{ cursor: 'pointer' }}
              />
              Show on Receipt
            </label>
          </div>
          <input
            id="transaction-date"
            type="date"
            className="form-input"
            value={transactionDate}
            onChange={(e) => setTransactionDate(e.target.value)}
            style={{
              background: 'var(--bg-pitch)',
              color: 'var(--text-primary)',
              border: '1px solid var(--border-color)',
              fontFamily: 'var(--font-mono)'
            }}
          />
        </div>

        <div className="form-group">
          <label className="form-label" htmlFor="remarks">7) Remarks (Optional)</label>
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

        <div className="form-group">
          <label className="form-label" htmlFor="whatsapp-number">7) WhatsApp Number (Optional)</label>
          <input
            id="whatsapp-number"
            type="text"
            className="form-input input-mono"
            value={whatsappNumber}
            onChange={(e) => setWhatsappNumber(e.target.value.replace(/[^0-9+]/g, ''))}
            placeholder="e.g. 919876543210 (with country code)"
            maxLength={15}
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
                  min="300"
                  max="900"
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

          <button className="btn btn-whatsapp" onClick={handleWhatsAppShare}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
              <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.008.01c3.202.001 6.212 1.246 8.477 3.514 2.266 2.268 3.507 5.28 3.505 8.484-.004 6.657-5.34 11.997-11.953 11.997-2.005-.001-3.973-.502-5.724-1.455L0 24zm6.59-4.846c1.6.95 3.188 1.449 4.825 1.451 5.436 0 9.86-4.37 9.864-9.752.002-2.607-1.01-5.059-2.85-6.902C16.643 2.109 14.195.992 11.6.992c-5.445 0-9.87 4.372-9.875 9.757-.002 1.8.48 3.55 1.396 5.105L2.1 21.056l5.055-1.325h-.508zm12.392-7.531c-.303-.151-1.793-.88-2.074-.982-.281-.101-.485-.151-.689.151-.204.302-.79.982-.968 1.189-.179.208-.358.233-.661.082-.303-.151-1.28-.47-2.439-1.499-.902-.801-1.51-1.791-1.687-2.093-.178-.302-.019-.465.132-.615.136-.134.303-.353.454-.529.152-.177.202-.303.303-.504.102-.202.051-.378-.025-.529-.076-.151-.689-1.658-.944-2.271-.249-.597-.502-.516-.689-.526-.178-.009-.383-.011-.587-.011-.204 0-.536.076-.816.378-.28.303-1.071 1.042-1.071 2.541s1.097 2.949 1.25 3.151c.153.202 2.158 3.284 5.228 4.602.73.313 1.299.5 1.743.642.733.232 1.4.199 1.928.121.587-.087 1.793-.73 2.047-1.432.256-.702.256-1.305.179-1.432-.077-.127-.281-.202-.584-.353z" />
            </svg>
            Send via WhatsApp
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
          Format: <span>{`upi://pay?pa=${upiId}&pn=${payeeName}${amount ? `&am=${amount}` : ''}&cu=INR${fullInvoiceId ? `&tr=${fullInvoiceId}` : ''}${customerName ? `&tn=${remarks ? `${remarks} - ` : ''}Cust: ${customerName}` : remarks ? `&tn=${remarks}` : ''}`}</span>
        </div>
        {/* Powered-by footer */}
        <div className="powered-by-footer">
          <img src="/assets/brand_logo.png" alt="Glitch Galaxy" className="powered-by-logo" />
          <span>Powered by <strong>Glitch Galaxy</strong> QR Code Generator</span>
        </div>

      </div>

      {/* WhatsApp Modal Overlay */}
      {showWhatsappModal && (
        <div className="whatsapp-modal-overlay">
          <div className="whatsapp-modal-card">
            <h3 className="whatsapp-modal-title">Share via WhatsApp</h3>
            <p className="whatsapp-modal-desc">
              The poster has been downloaded and copied to your clipboard.
              <br /><br />
              Select your WhatsApp platform below, then simply <strong>paste (Ctrl+V / Cmd+V)</strong> in the chat to send the image!
            </p>
            
            <div className="whatsapp-modal-buttons">
              <button 
                className="modal-btn modal-btn-whatsapp" 
                onClick={() => executeWhatsAppLink('app')}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.008.01c3.202.001 6.212 1.246 8.477 3.514 2.266 2.268 3.507 5.28 3.505 8.484-.004 6.657-5.34 11.997-11.953 11.997-2.005-.001-3.973-.502-5.724-1.455L0 24zm6.59-4.846c1.6.95 3.188 1.449 4.825 1.451 5.436 0 9.86-4.37 9.864-9.752.002-2.607-1.01-5.059-2.85-6.902C16.643 2.109 14.195.992 11.6.992c-5.445 0-9.87 4.372-9.875 9.757-.002 1.8.48 3.55 1.396 5.105L2.1 21.056l5.055-1.325h-.508zm12.392-7.531c-.303-.151-1.793-.88-2.074-.982-.281-.101-.485-.151-.689.151-.204.302-.79.982-.968 1.189-.179.208-.358.233-.661.082-.303-.151-1.28-.47-2.439-1.499-.902-.801-1.51-1.791-1.687-2.093-.178-.302-.019-.465.132-.615.136-.134.303-.353.454-.529.152-.177.202-.303.303-.504.102-.202.051-.378-.025-.529-.076-.151-.689-1.658-.944-2.271-.249-.597-.502-.516-.689-.526-.178-.009-.383-.011-.587-.011-.204 0-.536.076-.816.378-.28.303-1.071 1.042-1.071 2.541s1.097 2.949 1.25 3.151c.153.202 2.158 3.284 5.228 4.602.73.313 1.299.5 1.743.642.733.232 1.4.199 1.928.121.587-.087 1.793-.73 2.047-1.432.256-.702.256-1.305.179-1.432-.077-.127-.281-.202-.584-.353z" />
                </svg>
                WhatsApp App (Phone)
              </button>
              
              <button 
                className="modal-btn modal-btn-web" 
                onClick={() => executeWhatsAppLink('web')}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
                  <line x1="8" y1="21" x2="16" y2="21" />
                  <line x1="12" y1="17" x2="12" y2="21" />
                </svg>
                WhatsApp Web (Browser)
              </button>
            </div>
            
            <button 
              className="modal-btn-close" 
              onClick={() => setShowWhatsappModal(false)}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
