importScripts('https://cdn.jsdelivr.net/npm/tesseract.js@5/dist/tesseract.min.js');

self.onmessage = async (e) => {
  const { image } = e.data;
  try {
    const worker = await Tesseract.createWorker('eng', 1, {
      logger: m => self.postMessage({ type: 'progress', progress: m })
    });
    const { data: { text } } = await worker.recognize(image);
    await worker.terminate();
    self.postMessage({ type: 'result', text });
  } catch (error) {
    self.postMessage({ type: 'error', error: error.message });
  }
};