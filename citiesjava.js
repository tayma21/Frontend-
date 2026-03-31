const BACKEND_URL = "https://dcai-backend.onrender.com";

// Load supported cities from backend + set up file input listener
async function initPage() {
  // Redirect to login if no token
  if (!localStorage.getItem("token")) {
    window.location.href = "login.html";
    return;
  }

  const dropdown = document.getElementById("city-dropdown");

  if (dropdown) {
    try {
      const response = await fetch(`${BACKEND_URL}/cities`);
      const data = await response.json();

      const supportedCities = data.supported_cities || [];

      dropdown.innerHTML = '<option value="" disabled selected>Select a city...</option>';

      supportedCities.forEach(city => {
        const option = document.createElement("option");
        option.value = city;
        option.textContent = city.replace(/_/g, " "); // "Los_Angeles" → "Los Angeles"
        dropdown.appendChild(option);
      });

    } catch (error) {
      showError("Could not load cities. Check your connection.");
    }
  }

  // Update file name display when user picks a file
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

// Analyze pre-trained city
async function handleCitySelect() {
  const dropdown = document.getElementById("city-dropdown");
  const selectedCity = dropdown ? dropdown.value : "";
  const token = localStorage.getItem("token"); // ← consistent key

  clearError();

  if (!selectedCity) {
    showError("Please select a city.");
    return;
  }

  if (!token) {
    window.location.href = "login.html";
    return;
  }

  setLoading(true, "city");

  try {
    const response = await fetch(`${BACKEND_URL}/predict/${encodeURIComponent(selectedCity)}`, {
      method: "GET",
      headers: { Authorization: `Bearer ${token}` }
    });

    // Token expired or invalid
    if (response.status === 401) {
      localStorage.removeItem("token");
      window.location.href = "login.html";
      return;
    }

    const data = await response.json();

    if (!response.ok) {
      showError(data.detail || "Prediction failed. Please try again.");
      return;
    }

    // Save result and go to result page
    sessionStorage.setItem("result", JSON.stringify(data));
    window.location.href = "result.html";

  } catch (err) {
    showError("Could not connect to server. Please try again.");
  } finally {
    setLoading(false, "city");
  }
}

// Analyze uploaded CSV files
async function handleUploadAndAnalyze() {
  const fileInput = document.getElementById("file-input");
  const files = fileInput ? fileInput.files : [];
  const token = localStorage.getItem("token"); // ← consistent key

  clearError();

  if (!files || files.length === 0) {
    showError("Please select a CSV file first.");
    return;
  }

  if (!token) {
    window.location.href = "login.html";
    return;
  }

  setLoading(true, "upload");

  const formData = new FormData();
  for (let file of files) {
    formData.append("files", file);
  }

  try {
    const response = await fetch(`${BACKEND_URL}/predict/upload`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      // ⚠️ No Content-Type header — browser sets multipart boundary automatically
      body: formData
    });

    // Token expired or invalid
    if (response.status === 401) {
      localStorage.removeItem("token");
      window.location.href = "login.html";
      return;
    }

    const data = await response.json();

    if (!response.ok) {
      showError(data.detail || "Upload failed. Please check your file.");
      return;
    }

    // Save result and go to result page
    sessionStorage.setItem("result", JSON.stringify(data));
    window.location.href = "result.html";

  } catch (err) {
    showError("Upload failed. Could not connect to server.");
  } finally {
    setLoading(false, "upload");
  }
}

// ---- UI helpers ----
function showError(msg) {
  const el = document.getElementById("error-msg");
  if (el) el.textContent = msg;
}

function clearError() {
  const el = document.getElementById("error-msg");
  if (el) el.textContent = "";
}

function setLoading(isLoading, type) {
  document.body.style.cursor = isLoading ? "wait" : "default";

  if (type === "city") {
    const btn = document.getElementById("city-btn");
    if (btn) {
      btn.disabled = isLoading;
      btn.textContent = isLoading ? "Analyzing..." : "Analyze City";
    }
  }

  if (type === "upload") {
    const btn = document.getElementById("upload-btn");
    if (btn) {
      btn.disabled = isLoading;
      btn.textContent = isLoading ? "Analyzing..." : "Analyze";
    }
  }
}

window.addEventListener("DOMContentLoaded", initPage);
