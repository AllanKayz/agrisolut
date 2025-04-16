// Elements
const imageUpload = document.getElementById('imageUpload');
const imagePreview = document.getElementById('imagePreview');
const detectButton = document.getElementById('detectButton');
const diseaseName = document.getElementById('diseaseName').querySelector('span');
const confidence = document.getElementById('confidence').querySelector('span');

// Load the pre-trained ml5.js model (e.g., MobileNet)
let classifier;
ml5.imageClassifier('MobileNet')
  .then(model => {
    classifier = model;
    console.log('Model Loaded');
  })
  .catch(err => console.error('Error loading model:', err));

// Preview the uploaded image
imageUpload.addEventListener('change', () => {
  const file = imageUpload.files[0];
  if (file) {
    const reader = new FileReader();
    reader.onload = () => {
      imagePreview.src = reader.result;
    };
    reader.readAsDataURL(file);
  }
});

// Detect the plant disease
detectButton.addEventListener('click', () => {
  if (!imagePreview.src) {
    alert('Please upload an image first.');
    return;
  }

  if (!classifier) {
    alert('Model still loading. Please wait.');
    return;
  }

  classifier.classify(imagePreview)
    .then(results => {
      const topResult = results[0];
      diseaseName.textContent = topResult.label;
      confidence.textContent = `${(topResult.confidence * 100).toFixed(2)}%`;
    })
    .catch(err => {
      console.error('Error during classification:', err);
      alert('Error detecting plant disease. Please try again.');
    });
});