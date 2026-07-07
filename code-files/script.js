// -----------------------------------------------------------------
// Replace this with the "ApiEndpoint" value from your SAM/API Gateway deploy.
// Example: "https://q8tddz7kcd.execute-api.ap-south-1.amazonaws.com"
// -----------------------------------------------------------------
const API_BASE_URL = "https://q8tddz7kcd.execute-api.ap-south-1.amazonaws.com";

const counterEl = document.getElementById("counter");
const statusEl = document.getElementById("status");
const traceCaptionEl = document.getElementById("trace-caption");
const pulseAssets = document.getElementById("pulse-assets");
const pulseApi = document.getElementById("pulse-api");
const statusDot = document.getElementById("status-dot");

// Fire the "assets" pulse right away — by the time this script runs,
// the browser already fetched index.html/style.css/script.js via CloudFront + S3.
function animateAssetsPath() {
  if (!pulseAssets) return;
  pulseAssets.classList.add("run-assets");
}

function animateApiPathStart() {
  if (!pulseApi) return;
  pulseApi.classList.remove("run-api");
  // force reflow so the animation can restart
  void pulseApi.getBBox();
  pulseApi.classList.add("run-api");
}

async function loadVisitorCount() {
  animateAssetsPath();

  if (traceCaptionEl) {
    traceCaptionEl.textContent = "Calling API Gateway → Lambda → DynamoDB…";
  }
  animateApiPathStart();

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

    if (traceCaptionEl) {
      traceCaptionEl.textContent = "DynamoDB confirmed the write — count returned above.";
    }
  } catch (err) {
    console.error("Failed to fetch visitor count:", err);
    counterEl.textContent = "!";
    statusEl.textContent = "Could not reach the API. Check API_BASE_URL in script.js.";
    if (statusDot) statusDot.style.background = "#ff8686";
    if (traceCaptionEl) {
      traceCaptionEl.textContent = "Request failed before reaching DynamoDB. Check the console.";
    }
  }
}

loadVisitorCount();