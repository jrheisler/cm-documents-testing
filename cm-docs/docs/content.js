const defaultOrigin = "China";

// Helper to categorize based on title keywords
function guessCategory(title) {
  title = title.toLowerCase();
  if (title.includes("laptop") || title.includes("headphone") || title.includes("tv")) return "electronics";
  if (title.includes("shirt") || title.includes("dress") || title.includes("jeans")) return "apparel";
  return "default";
}

// Load tariff table from GitHub (main branch)
async function getTariffTable() {
  const url = "https://raw.githubusercontent.com/jrheisler/amazon-tariff-extension/main/tariffs.json";
  try {
    const response = await fetch(url);
    return await response.json();
  } catch (err) {
    console.error("Failed to fetch tariff data:", err);
    return {}; // fallback to empty
  }
}

// Main logic
async function injectTariff() {
  const titleElem = document.getElementById("productTitle");
  const priceElem =
    document.querySelector("#corePrice_feature_div .a-price .a-offscreen") ||
    document.querySelector("#priceblock_ourprice") ||
    document.querySelector("#priceblock_dealprice");

  console.log("📦 Injecting tariff...");
  console.log("Product title:", titleElem?.innerText);
  console.log("Raw price:", priceElem?.innerText);

  if (!titleElem || !priceElem) return;

  const title = titleElem.innerText.trim();
  const priceText = priceElem.innerText.replace("$", "").replace(",", "");
  const price = parseFloat(priceText);
  if (isNaN(price)) return;

  const tariffTable = await getTariffTable();
  const category = guessCategory(title);
  const rate = tariffTable[category]?.[defaultOrigin] || 0;
  // Calculate tariff as a percentage of the price
  const tariff = (price * rate * 100) / (100 + rate * 100);

  const insertText = `📦 Estimated Tariff (${defaultOrigin}, ${category}): $${tariff.toFixed(2)} (${(rate * 100).toFixed(0)}%)`;

  // Avoid duplicate injection
  if (document.getElementById("tariff-estimate")) return;

  const tariffElem = document.createElement("div");
  tariffElem.id = "tariff-estimate";
  tariffElem.style.marginTop = "10px";
  tariffElem.style.color = "red";
  tariffElem.style.fontSize = "16px";
  
  // Calculate total price
  const totalPrice = price + tariff;
  tariffElem.innerHTML = `
 📦 Estimated Tariff (${defaultOrigin}, ${category}): $${tariff.toFixed(2)} (${(rate * 100).toFixed(0)}%)<br>
    <a href="https://www.paypal.com/ncp/payment/D4BGYM6GU2B88" target="_blank" style="color: blue; text-decoration: underline; font-size: 14px;">
      💖 Help us stop this Tariff Madness
    </a>
  `;

  priceElem.parentElement.appendChild(tariffElem);
}

// Wait for the DOM to fully load (Amazon loads in chunks)
const observer = new MutationObserver(() => {
  if (document.getElementById("productTitle") && document.querySelector(".a-price .a-offscreen")) {
    injectTariff();
    observer.disconnect();
  }
});

observer.observe(document.body, { childList: true, subtree: true });
