// Simple Tesseract worker using CDN importScripts
// Listens for messages: { id, dataUrl }
// Posts progress messages: { type: 'progress', progress: { status, progress } }
// Posts result messages: { type: 'result', text }

self.onmessage = async function (e) {
  const { id, dataUrl } = e.data || {};
  try {
    // Load tesseract from CDN if not present
    if (typeof importScripts === 'function') {
      try {
        importScripts('https://unpkg.com/tesseract.js@2.1.5/dist/tesseract.min.js');
      } catch (err) {
        // ignore
      }
    }

    const Tesseract = self.Tesseract || (typeof window !== 'undefined' ? window.Tesseract : null);
    if (!Tesseract) {
      postMessage({ type: 'error', error: 'Tesseract not available in worker.' });
      return;
    }

    const worker = Tesseract.createWorker({
      logger: (m) => {
        postMessage({ type: 'progress', progress: m });
      },
    });

    await worker.load();
    await worker.loadLanguage('eng');
    await worker.initialize('eng');

    const { data: { text } } = await worker.recognize(dataUrl);
    await worker.terminate();

    postMessage({ type: 'result', text, id });
  } catch (err) {
    postMessage({ type: 'error', error: String(err), id });
  }
};
