# Field Notes Cover Studio

A web app for designing custom wraparound covers for classic Field Notes memo books.

## Features

- **Dual Editor View**: Edit front and back covers independently with real-time preview
- **Live Wrap Preview**: See the complete wraparound cover with fold lines and cut guides
- **Text Editing**: Add and style text with font controls, alignment, colors, and more
- **Image Support**: Upload images for individual covers or as a wrap-spanning background
- **Print-Ready Export**: Generate PDFs at exact real-world scale with cut lines and guides
- **DPI Warnings**: Get alerts when images are too low resolution for quality printing
- **Project Save/Load**: Save your designs as JSON and load them later

## Physical Specifications

- **Cover size**: 3.5" × 5.5" (89mm × 140mm)
- **Corner radius**: 3/8" (9.5mm)
- **Spine width**: Adjustable (default 0.125")

## Getting Started

### Installation

```bash
npm install
```

### Development

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

### Build

```bash
npm run build
```

### Preview Production Build

```bash
npm run preview
```

## Usage

### Editing Covers

1. Use the **Front Cover** and **Back Cover** columns to edit each side
2. Click "+ Text" to add text objects
3. Click "+ Image" to upload images
4. Select objects by clicking on them
5. Drag to reposition, use handles to resize
6. Use the **Properties** panel to fine-tune selected objects
7. Use the **Layers** panel to reorder, lock, or hide objects

### Background Colors

- Change each cover's background color using the "BG" color picker in the toolbar

### Wrap Mode Images

- Use **Settings > Wrap Background Image** to add an image that spans both covers
- Great for full-bleed designs or patterns

### Adjusting Spine Width

1. Measure your notebook's thickness
2. Enter the value in **Settings > Spine Width**
3. The preview and export will update automatically

### Exporting

1. Choose which guides to include in the export
2. Click **Export PDF** to download a print-ready file
3. Print at **100% scale** (disable "Fit to page")
4. Cut along the magenta dashed line
5. Remove staples from your notebook, wrap the new cover, re-staple

### Saving Projects

- Click **Save Project** to download your design as JSON
- Click **Load Project** to restore a saved design
- Your latest changes are also saved to browser storage automatically

## Typography

The app uses [Jost](https://fonts.google.com/specimen/Jost), a geometric sans-serif similar to Futura, which captures the classic Field Notes aesthetic.

## Tech Stack

- React 18 + TypeScript
- Vite
- Konva (react-konva) for canvas editing
- jsPDF for PDF generation

## License

MIT
