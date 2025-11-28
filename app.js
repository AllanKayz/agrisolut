// Elements
const imageUpload = document.getElementById('imageUpload');
const imagePreview = document.getElementById('imagePreview');
const detectButton = document.getElementById('detectButton');
const predictionsList = document.getElementById('predictions');
const dropZone = document.getElementById('dropZone');
const browseButton = document.getElementById('browseButton');
const loader = document.getElementById('loader');

// Function to handle file selection and preview
function handleFile(file) {
  if (file) {
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

// Event listeners for drag and drop
dropZone.addEventListener('dragover', (e) => {
  e.preventDefault();
  dropZone.classList.add('bg-gray-100');
});

dropZone.addEventListener('dragleave', () => {
  dropZone.classList.remove('bg-gray-100');
});

dropZone.addEventListener('drop', (e) => {
  e.preventDefault();
  dropZone.classList.remove('bg-gray-100');
  const file = e.dataTransfer.files[0];
  handleFile(file);
});

// Load the pre-trained ml5.js model
let classifier;
loader.classList.remove('hidden');
ml5.imageClassifier('MobileNet')
  .then(model => {
    classifier = model;
    loader.classList.add('hidden');
    console.log('Model Loaded');
  })
  .catch(err => {
    console.error('Error loading model:', err);
    loader.querySelector('p').textContent = 'Error loading model.';
  });

// Detect the plant disease
detectButton.addEventListener('click', () => {
  if (!imagePreview.src || imagePreview.classList.contains('hidden')) {
    alert('Please upload an image first.');
    return;
  }

  if (!classifier) {
    alert('Model still loading. Please wait.');
    return;
  }

  loader.classList.remove('hidden');
  loader.querySelector('p').textContent = 'Classifying...';

  classifier.classify(imagePreview)
    .then(results => {
      loader.classList.add('hidden');
      predictionsList.innerHTML = ''; // Clear previous results
      const top3 = results.slice(0, 3);
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
    })
    .catch(err => {
      loader.classList.add('hidden');
      console.error('Error during classification:', err);
      alert('Error detecting plant disease. Please try again.');
    });
});