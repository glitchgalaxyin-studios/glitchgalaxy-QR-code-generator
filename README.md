# UPI QR Code Generator

A professional, high-converting UPI QR Code & Payment Poster Generator designed for businesses, retailers, and freelancers across India. Generate ready-to-print, customizable payment counter posters with real-time preview, WhatsApp sharing, and direct export.

---

## ✨ Features

- **🎨 High-Resolution Payment Poster Canvas**:
  - Renders posters at **2x resolution multiplier** for crisp, print-quality graphics.
  - Dynamic transaction receipt card with Payee Name, UPI VPA, Customer Name, Invoice Number, Transaction Date, and Amount.
  - Works with all popular UPI apps (**Google Pay, PhonePe, Paytm, BHIM, Cred, and 60+ banking apps**).

- **⚡ NPCI-Compliant Payload Generation**:
  - Encodes standard `upi://pay` deep links according to NPCI specifications (`pa`, `pn`, `am`, `cu`, `tr`, `tn`, `mc`).
  - Sanitized invoice reference numbers (`tr`) and remarks (`tn`).

- **📱 Smart Sharing & Exporting**:
  - **Download PNG Poster**: One-click download of the generated payment poster.
  - **WhatsApp Share**: Automatically copies the high-res poster image to your clipboard and opens WhatsApp (mobile or web) with a pre-filled, professional invoice breakdown.
  - **Copy UPI Link**: One-click copy of the raw UPI payment deep link with toast feedback.
  - **Print Poster**: Dedicated print dialog that formats the high-resolution poster for counter displays, table stands, and sticker printing.

- **🚀 Quick Productivity Controls**:
  - **Quick Amount Presets**: One-click chips for `₹100`, `₹250`, `₹500`, `₹1,000`, `₹2,000`, `₹5,000`, and `Clear`.
  - **Live INR Currency Formatting**: Displays formatted amounts (e.g., `₹1,500.00`) in real time.
  - **Popular Bank Handle Presets**: Quick auto-complete for bank handles (`@okhdfcbank`, `@okaxis`, `@okicici`, `@oksbi`, `@paytm`, `@ybl`).
  - **Real-Time VPA Validation**: Visual checkmark indicator for valid UPI address formatting.
  - **One-Click Invoice Generator**: Quick `🎲 New INV#` button to roll randomized invoice IDs (`INV/26-27/XXXX`).

- **🎯 Advanced Canvas Alignment**:
  - Adjust QR code size (`120px` to `350px`).
  - Fine-tune horizontal (`X`) and vertical (`Y`) position offsets.
  - One-click **Auto Center QR** and **Reset Offsets**.

- **🔄 Custom Animated Conic Loader**:
  - Smooth loading state displayed during QR generation and canvas rendering.

---

## 🛠️ Tech Stack

- **Framework**: [React 19](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/)
- **Bundler**: [Vite 8](https://vitejs.dev/)
- **QR Engine**: [qrcode](https://www.npmjs.com/package/qrcode)
- **Rendering**: HTML5 Canvas API (Scaled high-DPI rasterization)
- **Linter**: [Oxlint](https://oxc.rs/)

---

## 🚀 Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (version 18.0 or higher recommended)
- [npm](https://www.npmjs.com/)

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/glitchgalaxyin-studios/glitchgalaxy-QR-code-generator.git
   cd glitchgalaxy-QR-code-generator
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

### Development Server

Start the local development server with network access:

```bash
npm run dev -- --host
```

- **Local URL**: `http://localhost:5173/`
- **Network URL**: Access from mobile phones on the same Wi-Fi network.

### Production Build

To compile and bundle for production:

```bash
npm run build
```

To preview the production build locally:

```bash
npm run preview
```

### Linting

Run Oxlint to check code quality:

```bash
npm run lint
```

---

## 📋 UPI Specification Reference

The generated QR code embeds a standard NPCI URI:

```
upi://pay?pa=<UPI_ID>&pn=<PAYEE_NAME>&am=<AMOUNT>&cu=INR&tr=<INVOICE_ID>&tn=<REMARKS>&mc=0000
```

| Parameter | Description |
|---|---|
| `pa` | Payee Virtual Payment Address (VPA) / UPI ID |
| `pn` | Payee / Business Name |
| `am` | Transaction Amount in INR (formatted to 2 decimal places) |
| `cu` | Currency code (`INR`) |
| `tr` | Transaction Reference / Clean Invoice ID |
| `tn` | Transaction note / remarks |
| `mc` | Merchant category code (`0000` default) |

---

## 📄 Credits & Branding

QR generator by **GLITCH GALAXY**
