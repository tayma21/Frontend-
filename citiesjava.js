const BACKEND_URL = "https://dcai-backend.onrender.com";

// Optional quick test function
async function getPrediction(cityName) {
  try {
    const token = localStorage.getItem("access_token");

    const response = await fetch(`${BACKEND_URL}/predict/${encodeURIComponent(cityName)}`, {
      method: "GET",
      headers: token ? { Authorization: `Bearer ${token}` } : {}
    });

    if (!response.ok) {
      throw new Error(`Request failed: ${response.status}`);
    }

    const data = await response.json();
    console.log("Backend response:", data);

    const resultEl = document.getElementById("result");
    if (resultEl) {
      resultEl.innerText = JSON.stringify(data, null, 2);
    }
  } catch (error) {
    console.error("Error:", error);

    const resultEl = document.getElementById("result");
    if (resultEl) {
      resultEl.innerText = "Failed to connect to backend";
    }
  }
}

// 1. THIS IS THE LIST THAT FILLS THE MENU
const cities = [
  "New York, NY", "Los Angeles, CA", "Chicago, IL", "Phoenix, AZ",
  "Las Vegas, NV", "Denton, TX", "Billings, MT", "San Diego, CA",
  "Kodiak, AK", "Aspen, CO", "Dodge City, KS", "San Francisco, CA",
  "Greensburg, KS", "Honolulu, HI", "Albuquerque, NM", "San Jose, CA",
  "Tucson, AZ", "Reno, NV", "El Paso, TX", "Salt Lake City, UT"
];

// 2. THIS FUNCTION PUTS THE CITIES INTO THE DROPDOWN
function initPage() {
  const dropdown = document.getElementById("city-dropdown");
  if (dropdown) {
    dropdown.innerHTML = '<option value="" disabled selected>Select a city...</option>';

    cities.forEach(city => {
      const option = document.createElement("option");
      option.value = city;
      option.textContent = city;
      dropdown.appendChild(option);
    });
  }

  // Update file name text when a user selects a file
  const fileInput = document.getElementById("file-input");
  const fileNameDisplay = document.getElementById("file-name");

  if (fileInput && fileNameDisplay) {
    fileInput.addEventListener("change", e => {
      if (e.target.files.length > 0) {
        fileNameDisplay.textContent = "Selected: " + e.target.files[0].name;
        fileNameDisplay.style.color = "#3ea174";
      }
    });
  }
}

// 3. ANALYZE PRE-TRAINED CITIES
async function handleCitySelect() {
  const dropdown = document.getElementById("city-dropdown");
  const selectedCity = dropdown ? dropdown.value : "";
  const token = localStorage.getItem("access_token");

  if (!selectedCity) {
    alert("Please select a city!");
    return;
  }

  if (!token) {
    alert("Please login first!");
    return;
  }

  document.body.style.cursor = "wait";

  try {
    const response = await fetch(`${BACKEND_URL}/predict/${encodeURIComponent(selectedCity)}`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("Server error:", data);
      alert(data.detail || "Prediction request failed.");
      return;
    }

    console.log("City prediction response:", data);

    localStorage.setItem("lastPrediction", JSON.stringify(data));
    localStorage.setItem("selectedCity", selectedCity);

    window.location.href = "result.html";
  } catch (err) {
    console.error("Connection error:", err);
    alert("Error connecting to server.");
  } finally {
    document.body.style.cursor = "default";
  }
}

// 4. ANALYZE NEW UPLOADED FILES
async function handleUploadAndAnalyze() {
  const fileInput = document.getElementById("file-input");
  const file = fileInput ? fileInput.files[0] : null;
  const token = localStorage.getItem("access_token");

  if (!file) {
    alert("Please select a CSV file first!");
    return;
  }

  if (!token) {
    alert("Please login first!");
    return;
  }

  document.body.style.cursor = "wait";

  const formData = new FormData();
  formData.append("files", file);

  try {
    const response = await fetch(`${BACKEND_URL}/predict/upload`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`
      },
      body: formData
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("Upload error:", data);
      alert(data.detail || "Upload failed.");
      return;
    }

    console.log("Upload prediction response:", data);

    localStorage.setItem("lastPrediction", JSON.stringify(data));
    localStorage.setItem("selectedCity", "Upload: " + file.name);

    window.location.href = "result.html";
  } catch (err) {
    console.error("Upload connection error:", err);
    alert("Upload failed.");
  } finally {
    document.body.style.cursor = "default";
  }
}

// IMPORTANT: This tells the browser to run the "initPage" function as soon as the page opens
window.addEventListener("DOMContentLoaded", initPage);
