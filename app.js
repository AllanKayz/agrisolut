// Elements
const imageUpload = document.getElementById('imageUpload');
const imagePreview = document.getElementById('imagePreview');
const detectButton = document.getElementById('detectButton');
const predictionsList = document.getElementById('predictions');
const dropZone = document.getElementById('dropZone');
const browseButton = document.getElementById('browseButton');
const loader = document.getElementById('loader');
const cameraButton = document.getElementById('cameraButton');
const cameraContainer = document.getElementById('cameraContainer');
const cameraStream = document.getElementById('cameraStream');
const captureButton = document.getElementById('captureButton');
const uploadButton = document.getElementById('uploadButton');

let uploadedFile = null;
let stream = null;

// Function to handle file selection and preview
function handleFile(file) {
  if (file) {
    uploadedFile = file;
    const reader = new FileReader();
    reader.onload = () => {
      imagePreview.src = reader.result;
      imagePreview.classList.remove('hidden');
    };
    reader.readAsDataURL(file);
  }
}

// Event listeners for file input
imageUpload.addEventListener('change', () => {
  handleFile(imageUpload.files[0]);
});

browseButton.addEventListener('click', () => {
  imageUpload.click();
});

// Event listeners for file input
cameraButton.addEventListener('click', async () => {
  try {
    stream = await navigator.mediaDevices.getUserMedia({ video: true });
    cameraStream.srcObject = stream;
    cameraContainer.classList.remove('hidden');
    dropZone.classList.add('hidden');
    cameraButton.classList.add('hidden');
  } catch (err) {
    console.error('Error accessing camera:', err);
    alert('Could not access the camera. Please make sure you have a camera connected and have granted permission.');
  }
});

captureButton.addEventListener('click', () => {
  const canvas = document.createElement('canvas');
  canvas.width = cameraStream.videoWidth;
  canvas.height = cameraStream.videoHeight;
  const ctx = canvas.getContext('2d');
  ctx.drawImage(cameraStream, 0, 0, canvas.width, canvas.height);
  canvas.toBlob(blob => {
    const file = new File([blob], "capture.jpg", { type: "image/jpeg" });
    handleFile(file);
  }, 'image/jpeg');
  stopCamera();
  cameraContainer.classList.add('hidden');
  dropZone.classList.remove('hidden');
  cameraButton.classList.remove('hidden');
});

uploadButton.addEventListener('click', () => {
  stopCamera();
  cameraContainer.classList.add('hidden');
  dropZone.classList.remove('hidden');
  cameraButton.classList.remove('hidden');
});

// Load the pre-trained ml5.js model
let classifier;
const loaderText = loader.querySelector('p');
loaderText.textContent = 'Loading fallback model...';
ml5.imageClassifier('MobileNet')
  .then(model => {
    classifier = model;
    loader.classList.add('hidden');
    detectButton.disabled = false;
    console.log('Model Loaded');
  })
  .catch(err => {
    console.error('Error loading model:', err);
    loader.querySelector('p').textContent = 'Error loading model.';
  });

// Detect the plant disease
detectButton.addEventListener('click', async () => {
  if (!imagePreview.src || imagePreview.classList.contains('hidden')) {
    alert('Please upload an image first.');
    return;
  }

  loader.classList.remove('hidden');
  loader.querySelector('p').textContent = 'Classifying...';

  const base64Image = imagePreview.src.split(',')[1];

  try {
    const response = await fetch('/classify', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ image: base64Image, mimeType: uploadedFile.type }),
    });

    if (!response.ok) {
      throw new Error('Error classifying image');
    }

    const results = await response.json();

    loader.classList.add('hidden');
    predictionsList.innerHTML = ''; // Clear previous results
    results.forEach(result => {
      const li = document.createElement('li');
      li.className = 'flex items-center justify-between';

      const name = document.createElement('span');
      name.className = 'text-gray-700';
      name.textContent = result.disease;

      const confidenceContainer = document.createElement('div');
      confidenceContainer.className = 'w-1/2 bg-gray-200 rounded-full h-4';

      const confidenceBar = document.createElement('div');
      const confidenceValue = (result.confidence * 100).toFixed(2);
      confidenceBar.className = 'bg-green-500 h-4 rounded-full text-xs text-white text-center leading-4';
      confidenceBar.style.width = `${confidenceValue}%`;
      confidenceBar.textContent = `${confidenceValue}%`;

      confidenceContainer.appendChild(confidenceBar);
      li.appendChild(name);
      li.appendChild(confidenceContainer);
      predictionsList.appendChild(li);
    });
  } catch (err) {
    console.warn('Backend classification failed, falling back to ml5.js', err);
    try {
      if (!classifier) {
        throw new Error('ml5.js classifier not loaded');
      }
      const ml5Results = await classifier.classify(imagePreview);
      loader.classList.add('hidden');
      predictionsList.innerHTML = ''; // Clear previous results
      const top3 = ml5Results.slice(0, 3);
      top3.forEach(result => {
        const li = document.createElement('li');
        li.className = 'flex items-center justify-between';
        const name = document.createElement('span');
        name.className = 'text-gray-700';
        name.textContent = result.label.split(',')[0];
        const confidenceContainer = document.createElement('div');
        confidenceContainer.className = 'w-1/2 bg-gray-200 rounded-full h-4';
        const confidenceBar = document.createElement('div');
        const confidenceValue = (result.confidence * 100).toFixed(2);
        confidenceBar.className = 'bg-green-500 h-4 rounded-full text-xs text-white text-center leading-4';
        confidenceBar.style.width = `${confidenceValue}%`;
        confidenceBar.textContent = `${confidenceValue}%`;
        confidenceContainer.appendChild(confidenceBar);
        li.appendChild(name);
        li.appendChild(confidenceContainer);
        predictionsList.appendChild(li);
      });
    } catch (ml5Err) {
      console.warn('ml5.js classification failed, falling back to Plant.id API', ml5Err);
      try {
        const response = await fetch('/plantid', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ image: imagePreview.src }),
        });
        if (!response.ok) {
          throw new Error('Error from Plant.id API');
        }
        const results = await response.json();
        loader.classList.add('hidden');
        predictionsList.innerHTML = ''; // Clear previous results
        if (results.result.is_healthy.binary) {
          const li = document.createElement('li');
          li.className = 'flex items-center justify-between';
          const name = document.createElement('span');
          name.className = 'text-gray-700';
          name.textContent = 'Healthy';
          li.appendChild(name);
          predictionsList.appendChild(li);
        } else {
          results.result.disease.suggestions.forEach(result => {
            const li = document.createElement('li');
            li.className = 'flex items-center justify-between';
            const name = document.createElement('span');
            name.className = 'text-gray-700';
            name.textContent = result.name;
            const confidenceContainer = document.createElement('div');
            confidenceContainer.className = 'w-1/2 bg-gray-200 rounded-full h-4';
            const confidenceBar = document.createElement('div');
            const confidenceValue = (result.probability * 100).toFixed(2);
            confidenceBar.className = 'bg-blue-500 h-4 rounded-full text-xs text-white text-center leading-4';
            confidenceBar.style.width = `${confidenceValue}%`;
            confidenceBar.textContent = `${confidenceValue}%`;
            confidenceContainer.appendChild(confidenceBar);
            li.appendChild(name);
            li.appendChild(confidenceContainer);
            predictionsList.appendChild(li);
          });
        }
      } catch (plantIdErr) {
        loader.classList.add('hidden');
        console.error('Error with Plant.id fallback:', plantIdErr);
        alert('All fallbacks failed. Please try again.');
      }
    }
  }
});