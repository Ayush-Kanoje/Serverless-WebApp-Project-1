// -----------------------------------------------------------------
// Replace this with the "ApiEndpoint" value from your SAM deploy output.
// Example: "https://abc123xyz.execute-api.ap-south-1.amazonaws.com"
// -----------------------------------------------------------------
const API_BASE_URL = "https://q8tddz7kcd.execute-api.ap-south-1.amazonaws.com";

const counterEl = document.getElementById("counter");
const statusEl = document.getElementById("status");

async function loadVisitorCount() {
  try {
    const response = await fetch(`${API_BASE_URL}/visitor`, {
      method: "GET",
    });

    if (!response.ok) {
      throw new Error(`Request failed with status ${response.status}`);
    }

    const data = await response.json();
    counterEl.textContent = data.count.toLocaleString();
    statusEl.textContent = "Live count from DynamoDB";
  } catch (err) {
    console.error("Failed to fetch visitor count:", err);
    counterEl.textContent = "!";
    statusEl.textContent = "Could not reach the API. Check API_BASE_URL in script.js.";
  }
}

loadVisitorCount();

// Image Modal Logic
const modal = document.getElementById("image-modal");
const archImg = document.getElementById("arch-img");
const modalImg = document.getElementById("modal-img");
const closeBtn = document.getElementById("close-modal");

if (archImg && modal && modalImg && closeBtn) {
  archImg.onclick = function() {
    modal.style.display = "flex";
    modalImg.src = this.src;
  }

  closeBtn.onclick = function() {
    modal.style.display = "none";
  }

  // Close modal when clicking outside the image
  modal.onclick = function(event) {
    if (event.target === modal) {
      modal.style.display = "none";
    }
  }
}