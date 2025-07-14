import { getDocument, GlobalWorkerOptions } from './pdfjs.js';

// Set workerSrc to the correct location (src directory)
GlobalWorkerOptions.workerSrc = '../src/pdf.worker.js';

const urlParams = new URLSearchParams(window.location.search);
const file = urlParams.get('file') || '7bridges.pdf';
const pdfUrl = `./pdfs/${file}`;

const viewer = document.getElementById('ssv-pdf-viewer');
const prevBtn = document.getElementById('ssv-prev');
const nextBtn = document.getElementById('ssv-next');
const pageIndicator = document.getElementById('ssv-page-indicator');

let pdfDoc = null;
let currentPage = 1;
let totalPages = 1;
let pageRendering = false;
let pageCache = {};

function renderPage(num) {
  pageRendering = true;
  pdfDoc.getPage(num).then(page => {
    const viewport = page.getViewport({ scale: calcScale(page) });
    let canvas = document.createElement('canvas');
    let context = canvas.getContext('2d');
    canvas.width = viewport.width;
    canvas.height = viewport.height;
    // Remove old canvas
    viewer.innerHTML = '';
    viewer.appendChild(canvas);
    // Render PDF page into canvas context
    let renderTask = page.render({ canvasContext: context, viewport });
    renderTask.promise.then(() => {
      pageRendering = false;
      // Preload prev/next
      preloadPage(num - 1);
      preloadPage(num + 1);
    });
  });
  updateIndicator();
}

function calcScale(page) {
  // Fit page to viewer height
  const container = viewer;
  const desiredHeight = container.clientHeight || 600;
  const viewport = page.getViewport({ scale: 1 });
  return desiredHeight / viewport.height;
}

function updateIndicator() {
  pageIndicator.textContent = `${currentPage} of ${totalPages}`;
}

function showPage(num) {
  if (num < 1 || num > totalPages || pageRendering) return;
  currentPage = num;
  renderPage(currentPage);
}

function preloadPage(num) {
  if (num < 1 || num > totalPages || pageCache[num]) return;
  pdfDoc.getPage(num).then(page => {
    pageCache[num] = page;
  });
}

prevBtn.addEventListener('click', () => showPage(currentPage - 1));
nextBtn.addEventListener('click', () => showPage(currentPage + 1));

document.addEventListener('keydown', e => {
  if (e.key === 'ArrowLeft') showPage(currentPage - 1);
  if (e.key === 'ArrowRight') showPage(currentPage + 1);
});

getDocument(pdfUrl).promise.then(doc => {
  pdfDoc = doc;
  totalPages = doc.numPages;
  showPage(1);
}); 