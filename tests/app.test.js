// tests/app.test.js

// Mock ml5.js and fetch at the top level, as they are used by app.js when required.
global.ml5 = {
  imageClassifier: jest.fn(() => Promise.resolve({
    classify: () => Promise.resolve([{ label: 'test', confidence: 0.5 }])
  })),
};

global.fetch = jest.fn(() =>
  Promise.resolve({
    ok: true,
    json: () => Promise.resolve([{ disease: 'test', confidence: 0.9 }]),
  })
);

// Prevent errors from JSDOM css parser
const originalConsoleError = console.error;
console.error = (message, ...args) => {
  if (typeof message === 'string' && message.includes('Could not parse CSS stylesheet')) {
    return;
  }
  originalConsoleError(message, ...args);
};


describe('app.js event listeners', () => {
    beforeEach(() => {
        // Set up a fresh DOM for each test
        document.body.innerHTML = `
            <input type="file" id="imageUpload">
            <img id="imagePreview" class="hidden">
            <button id="detectButton">Detect</button>
            <ul id="predictions"></ul>
            <div id="dropZone"></div>
            <button id="browseButton">Browse</button>
            <div id="loader" class="hidden"><p></p></div>
            <button id="cameraButton"></button>
            <div id="cameraContainer" class="hidden">
              <video id="cameraStream"></video>
              <button id="captureButton"></button>
              <button id="uploadButton"></button>
            </div>
        `;
        // Reset modules to ensure app.js runs fresh for each test
        jest.resetModules();
        global.fetch.mockClear();
    });

    test('should attach only one click listener to detectButton', () => {
        const detectButton = document.getElementById('detectButton');
        const addEventListenerSpy = jest.spyOn(detectButton, 'addEventListener');

        // Load and execute app.js
        require('../app.js');

        // Check that addEventListener was called exactly once with 'click'
        const clickListenerCalls = addEventListenerSpy.mock.calls.filter(
            (call) => call[0] === 'click'
        );
        expect(clickListenerCalls.length).toBe(1);

        // It's good practice to restore the original method
        addEventListenerSpy.mockRestore();
    });

    test('should attach only one drop listener to dropZone', () => {
        const dropZone = document.getElementById('dropZone');
        const addEventListenerSpy = jest.spyOn(dropZone, 'addEventListener');

        require('../app.js');

        const dropListenerCalls = addEventListenerSpy.mock.calls.filter(
            (call) => call[0] === 'drop'
        );
        expect(dropListenerCalls.length).toBe(1);

        addEventListenerSpy.mockRestore();
    });

    test('should attach only one dragover listener to dropZone', () => {
        const dropZone = document.getElementById('dropZone');
        const addEventListenerSpy = jest.spyOn(dropZone, 'addEventListener');

        require('../app.js');

        const dragoverListenerCalls = addEventListenerSpy.mock.calls.filter(
            (call) => call[0] === 'dragover'
        );
        expect(dragoverListenerCalls.length).toBe(1);

        addEventListenerSpy.mockRestore();
    });

    test('should call /plantid as a second fallback', async () => {
        // Mock the fetch API to fail for /classify
        global.fetch.mockImplementation((url) => {
            if (url === '/classify') {
                return Promise.resolve({ ok: false });
            }
            if (url === '/plantid') {
                return Promise.resolve({
                    ok: true,
                    json: () => Promise.resolve({ result: { is_healthy: { binary: true } } }),
                });
            }
        });

        // Mock ml5 to fail
        global.ml5.imageClassifier = jest.fn(() => Promise.resolve({
            classify: () => Promise.reject('ml5 error')
        }));

        require('../app.js');
        const detectButton = document.getElementById('detectButton');
        const imagePreview = document.getElementById('imagePreview');
        imagePreview.src = 'test';
        imagePreview.classList.remove('hidden');

        await detectButton.click();

        // Allow time for promises to resolve
        await new Promise(resolve => setTimeout(resolve, 100));

        expect(global.fetch).toHaveBeenCalledWith('/classify', expect.any(Object));
        expect(global.fetch).toHaveBeenCalledWith('/plantid', expect.any(Object));
    });
});
