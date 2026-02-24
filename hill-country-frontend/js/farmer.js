const API = "http://localhost:5000/api";
const token = localStorage.getItem("token");
const socketUrl = "http://localhost:5000";

let harvestMap;
let harvestMarker;
let harvestsById = {};
let harvestImageIndex = {};
let marketPriceChart = null;
let marketAnalyticsInitialized = false;
let pendingNotificationCount = 0;
let farmerSocket = null;
const districtCities = {
  Ampara: ["Ampara", "Kalmunai", "Akkaraipattu", "Sainthamaruthu", "Pottuvil"],
  Anuradhapura: ["Anuradhapura", "Kekirawa", "Medawachchiya", "Thambuttegama", "Eppawala"],
  Badulla: ["Badulla", "Bandarawela", "Ella", "Haputale", "Mahiyanganaya"],
  Batticaloa: ["Batticaloa", "Kattankudy", "Eravur", "Valachchenai", "Chenkalady"],
  Colombo: ["Colombo", "Dehiwala-Mount Lavinia", "Maharagama", "Kotte", "Moratuwa"],
  Galle: ["Galle", "Ambalangoda", "Hikkaduwa", "Elpitiya", "Baddegama"],
  Gampaha: ["Gampaha", "Negombo", "Wattala", "Ja-Ela", "Kadawatha"],
  Hambantota: ["Hambantota", "Tangalle", "Beliatta", "Ambalantota", "Tissamaharama"],
  Jaffna: ["Jaffna", "Nallur", "Chavakachcheri", "Point Pedro", "Karainagar"],
  Kalutara: ["Kalutara", "Panadura", "Beruwala", "Horana", "Matugama"],
  Kandy: ["Kandy", "Peradeniya", "Katugastota", "Gampola", "Nawalapitiya"],
  Kegalle: ["Kegalle", "Mawanella", "Warakapola", "Rambukkana", "Ruwanwella"],
  Kilinochchi: ["Kilinochchi", "Paranthan", "Poonakary", "Pallai", "Akkarayan"],
  Kurunegala: ["Kurunegala", "Kuliyapitiya", "Narammala", "Mawathagama", "Polgahawela"],
  Mannar: ["Mannar", "Madhu", "Murunkan", "Pesalai", "Nanattan"],
  Matale: ["Matale", "Dambulla", "Galewela", "Ukuwela", "Rattota"],
  Matara: ["Matara", "Weligama", "Akuressa", "Dikwella", "Kamburupitiya"],
  Monaragala: ["Monaragala", "Wellawaya", "Bibile", "Kataragama", "Buttala"],
  Mullaitivu: ["Mullaitivu", "Puthukkudiyiruppu", "Oddusuddan", "Mankulam", "Maritimepattu"],
  "Nuwara Eliya": ["Nuwara Eliya", "Hatton", "Talawakele", "Ginigathhena", "Kotagala"],
  Polonnaruwa: ["Polonnaruwa", "Kaduruwela", "Hingurakgoda", "Medirigiriya", "Dimbulagala"],
  Puttalam: ["Puttalam", "Chilaw", "Wennappuwa", "Nattandiya", "Marawila"],
  Ratnapura: ["Ratnapura", "Balangoda", "Embilipitiya", "Pelmadulla", "Kuruwita"],
  Trincomalee: ["Trincomalee", "Kinniya", "Kantale", "Mutur", "Nilaveli"],
  Vavuniya: ["Vavuniya", "Nedunkeni", "Cheddikulam", "Omanthai", "Mamaduwa"]
};
const produceByCategory = {
  Vegetable: [
    "Beans",
    "Carrot",
    "Leeks",
    "Tomato",
    "Brinjal",
    "Pumpkin",
    "Bitter Gourd"
  ],
  Fruit: [
    "Mango",
    "Banana",
    "Papaya",
    "Pineapple",
    "Avocado",
    "Guava",
    "Watermelon"
  ]
};
const harvestImageInput = document.getElementById("harvestImages");
const imagePreview = document.getElementById("imagePreview");
const fileNameNote = document.getElementById("fileNameNote");
const districtSelect = document.getElementById("district");
const mainCitySelect = document.getElementById("mainCity");
const categorySelect = document.getElementById("category");
const productNameSelect = document.getElementById("productName");
const editCategorySelect = document.getElementById("editCategory");
const editProductNameSelect = document.getElementById("editProductName");
const marketCategorySelect = document.getElementById("marketCategorySelect");
const marketVarietySelect = document.getElementById("marketVarietySelect");
const predictionList = document.getElementById("predictionList");
const notificationBadge = document.getElementById("notificationBadge");
const notificationBell = document.getElementById("notificationBell");
const toastContainer = document.getElementById("notificationToastContainer");

function updateNotificationBadge(count) {
  pendingNotificationCount = Math.max(0, Number(count) || 0);
  if (!notificationBadge) return;

  notificationBadge.textContent = pendingNotificationCount > 99 ? "99+" : String(pendingNotificationCount);
  notificationBadge.style.display = pendingNotificationCount > 0 ? "flex" : "none";
}

function showNotificationToast(payload) {
  if (!toastContainer || !payload?.message) return;

  const toast = document.createElement("div");
  toast.className = "notification-toast";
  toast.textContent = payload.message;
  toastContainer.appendChild(toast);

  toast.addEventListener("click", async () => {
    if (payload.notificationId) {
      try {
        const res = await fetch(`${API}/notifications/${payload.notificationId}/read`, {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        if (res.ok) {
          updateNotificationBadge(pendingNotificationCount - 1);
        }
      } catch (err) {
        console.error("Failed to mark notification as read:", err.message);
      }
    }

    if (payload.order_id) {
      const ordersBtn = document.querySelector('.sidebar .menu-btn[onclick*="myOrders"]');
      if (ordersBtn) setActive(ordersBtn);
      showTab("myOrders");
      viewOrderDetails(payload.order_id);
    }
  });

  setTimeout(() => {
    toast.remove();
  }, 4000);
}

async function viewOrderDetails(orderId) {
  if (!orderId) return;

  const res = await fetch(`${API}/orders/${orderId}`, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });

  const order = await res.json().catch(() => ({}));
  if (!res.ok) return;

  const firstItem = Array.isArray(order.items) && order.items.length ? order.items[0] : null;
  alert(
    `Product: ${firstItem?.productName || "-"}\n` +
    `Quantity: ${firstItem?.quantityKg || "-"} KG\n` +
    `Price: Rs.${order.offered_price || firstItem?.pricePerKg || 0}\n` +
    `Status: ${order.status || "-"}\n` +
    `Order ID: ${order._id}`
  );
}

async function fetchUnreadNotifications() {
  if (!token) return;

  try {
    const res = await fetch(`${API}/notifications/my`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    if (!res.ok) return;

    const data = await res.json().catch(() => ({}));
    updateNotificationBadge(data.count || 0);
  } catch (err) {
    console.error("Failed to fetch notifications:", err.message);
  }
}

async function markAllNotificationsRead() {
  if (!token || pendingNotificationCount <= 0) return;

  try {
    const res = await fetch(`${API}/notifications/read-all`, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    if (res.ok) {
      updateNotificationBadge(0);
    }
  } catch (err) {
    console.error("Failed to mark notifications as read:", err.message);
  }
}

function initNotificationSocket() {
  if (!token || typeof io !== "function") return;
  if (farmerSocket) return;

  farmerSocket = io(socketUrl, {
    auth: { token }
  });

  farmerSocket.on("new_notification", (payload) => {
    showNotificationToast(payload || { message: "New notification received" });
    updateNotificationBadge(pendingNotificationCount + 1);
    if (document.getElementById("myOrdersTab")?.style.display === "block") {
      loadOrders();
    }
  });
}

function initHarvestMap() {
  const mapEl = document.getElementById("harvestMap");
  const input = document.getElementById("pickupAddress");
  if (!mapEl || !input || !window.google || !google.maps) return;

  const sriLanka = { lat: 7.8731, lng: 80.7718 };
  harvestMap = new google.maps.Map(mapEl, {
    center: sriLanka,
    zoom: 7
  });

  harvestMarker = new google.maps.Marker({
    map: harvestMap
  });

  harvestMap.addListener("click", (e) => {
    const lat = e.latLng.lat();
    const lng = e.latLng.lng();

    harvestMarker.setPosition(e.latLng);

    document.getElementById("pickupLat").value = lat;
    document.getElementById("pickupLng").value = lng;

    reverseGeocode(lat, lng);
  });

  if (google.maps.places && google.maps.places.Autocomplete) {
    const autocomplete = new google.maps.places.Autocomplete(input);

    autocomplete.addListener("place_changed", () => {
      const place = autocomplete.getPlace();
      if (!place.geometry) return;

      harvestMap.setCenter(place.geometry.location);
      harvestMap.setZoom(14);

      harvestMarker.setPosition(place.geometry.location);

      document.getElementById("pickupLat").value =
        place.geometry.location.lat();
      document.getElementById("pickupLng").value =
        place.geometry.location.lng();
    });
  }
}

function reverseGeocode(lat, lng) {
  const geocoder = new google.maps.Geocoder();

  geocoder.geocode(
    { location: { lat, lng } },
    (results, status) => {
      if (status === "OK" && results[0]) {
        document.getElementById("pickupAddress").value =
          results[0].formatted_address;
      }
    }
  );
}

function updateCityDropdown(selectedCity = "") {
  if (!districtSelect || !mainCitySelect) return;

  const selectedDistrict = districtSelect.value;
  mainCitySelect.innerHTML = '<option value="">Select Main City</option>';

  if (!selectedDistrict || !districtCities[selectedDistrict]) return;

  districtCities[selectedDistrict].forEach((city) => {
    const option = document.createElement("option");
    option.value = city;
    option.textContent = city;
    if (selectedCity && selectedCity === city) {
      option.selected = true;
    }
    mainCitySelect.appendChild(option);
  });
}

if (districtSelect && mainCitySelect) {
  districtSelect.addEventListener("change", () => updateCityDropdown());
  updateCityDropdown();
}

function updateVarieties(categoryId, productId, selectedProduct = "") {
  const categoryEl = document.getElementById(categoryId);
  const productEl = document.getElementById(productId);
  if (!categoryEl || !productEl) return;

  const selectedCategory = categoryEl.value;
  const products = produceByCategory[selectedCategory] || [];

  productEl.innerHTML = '<option value="">Select Product Variety</option>';

  products.forEach((item) => {
    const option = document.createElement("option");
    option.value = item;
    option.textContent = item;
    if (selectedProduct && selectedProduct === item) {
      option.selected = true;
    }
    productEl.appendChild(option);
  });
}

function updateProductDropdown(categoryId, productId, selectedProduct = "") {
  updateVarieties(categoryId, productId, selectedProduct);
}

if (categorySelect && productNameSelect) {
  categorySelect.addEventListener("change", () => {
    updateVarieties("category", "productName");
  });
  updateVarieties("category", "productName");
}

if (editCategorySelect && editProductNameSelect) {
  editCategorySelect.addEventListener("change", () => {
    updateVarieties("editCategory", "editProductName");
  });
  updateVarieties("editCategory", "editProductName");
}

window.updateVarieties = updateVarieties;
window.updateProductDropdown = updateProductDropdown;

function buildPredictions(analyticsData, selectedVariety) {
  if (!predictionList) return;

  predictionList.innerHTML = "";

  if (!selectedVariety || !analyticsData) {
    const li = document.createElement("li");
    li.textContent = "Select a variety to view its current market status and forecast.";
    predictionList.appendChild(li);
    return;
  }

  const statusLine = document.createElement("li");
  statusLine.textContent = `${selectedVariety}: ${analyticsData.message}`;
  predictionList.appendChild(statusLine);

  const detailLine = document.createElement("li");
  detailLine.textContent = `Available: ${analyticsData.availableQuantity} KG | Avg weekly demand: ${analyticsData.averageWeeklyDemand} KG`;
  predictionList.appendChild(detailLine);
}

function renderMarketChart(analyticsData, productName) {
  const canvas = document.getElementById("marketPriceChart");
  if (!canvas || !window.Chart || !productName || !analyticsData) return;

  const labels = (analyticsData.weeklyAverages || []).map((w) => w.label);
  const dataset = (analyticsData.weeklyAverages || []).map((w) => Number(w.avgPrice || 0));

  if (marketPriceChart) {
    marketPriceChart.destroy();
  }

  marketPriceChart = new Chart(canvas, {
    type: "line",
    data: {
      labels,
      datasets: [
        {
          label: `${productName} Price (Rs/kg)`,
          data: dataset,
          borderColor: "#2e7d32",
          backgroundColor: "rgba(46,125,50,0.16)",
          borderWidth: 3,
          pointRadius: 4,
          pointBackgroundColor: "#2e7d32",
          pointBorderColor: "#ffffff",
          pointBorderWidth: 2,
          tension: 0.3,
          fill: true
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          labels: {
            color: "#2e7d32",
            font: { weight: "600" }
          }
        }
      },
      scales: {
        x: {
          ticks: { color: "#2e7d32" },
          grid: { color: "#e8edf3" }
        },
        y: {
          beginAtZero: false,
          ticks: {
            color: "#2e7d32",
            callback: (value) => `Rs ${value}`
          },
          grid: { color: "#e8edf3" }
        }
      }
    }
  });
}

async function fetchMarketAnalytics(productName) {
  const res = await fetch(
    `${API}/farmer/market-analytics?productName=${encodeURIComponent(productName)}`,
    {
      headers: {
        Authorization: `Bearer ${token}`
      }
    }
  );

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.message || "Failed to load market analytics");
  }
  return data;
}

function loadMarketAnalytics() {
  if (!marketCategorySelect || !marketVarietySelect) return;

  if (!marketAnalyticsInitialized) {
    marketCategorySelect.addEventListener("change", () => {
      updateVarieties("marketCategorySelect", "marketVarietySelect");
      if (marketPriceChart) {
        marketPriceChart.destroy();
        marketPriceChart = null;
      }
      buildPredictions(null, "");
    });

    marketVarietySelect.addEventListener("change", async (e) => {
      if (!e.target.value) {
        if (marketPriceChart) {
          marketPriceChart.destroy();
          marketPriceChart = null;
        }
        buildPredictions(null, "");
        return;
      }

      try {
        const analyticsData = await fetchMarketAnalytics(e.target.value);
        renderMarketChart(analyticsData, e.target.value);
        buildPredictions(analyticsData, e.target.value);
      } catch (err) {
        if (marketPriceChart) {
          marketPriceChart.destroy();
          marketPriceChart = null;
        }
        buildPredictions(
          {
            message: err.message,
            availableQuantity: 0,
            averageWeeklyDemand: 0
          },
          e.target.value
        );
      }
    });

    marketAnalyticsInitialized = true;
  }

  if (!marketCategorySelect.value) {
    marketCategorySelect.value = "Vegetable";
  }

  updateVarieties("marketCategorySelect", "marketVarietySelect", marketVarietySelect.value);

  if (!marketVarietySelect.value && marketVarietySelect.options.length > 1) {
    marketVarietySelect.value = marketVarietySelect.options[1].value;
  }

  if (!marketVarietySelect.value) {
    buildPredictions(null, "");
    return;
  }

  fetchMarketAnalytics(marketVarietySelect.value)
    .then((analyticsData) => {
      renderMarketChart(analyticsData, marketVarietySelect.value);
      buildPredictions(analyticsData, marketVarietySelect.value);
    })
    .catch((err) => {
      if (marketPriceChart) {
        marketPriceChart.destroy();
        marketPriceChart = null;
      }
      buildPredictions(
        {
          message: err.message,
          availableQuantity: 0,
          averageWeeklyDemand: 0
        },
        marketVarietySelect.value
      );
    });
}

function renderSelectedImagePreviews(files) {
  if (!imagePreview || !fileNameNote) return;

  imagePreview.innerHTML = "";

  if (!files || files.length === 0) {
    fileNameNote.textContent = "No file selected";
    return;
  }

  fileNameNote.textContent = `${files.length} image${files.length > 1 ? "s" : ""} selected`;

  Array.from(files).forEach((file) => {
    if (!file.type.startsWith("image/")) return;
    const img = document.createElement("img");
    img.src = URL.createObjectURL(file);
    img.alt = "Selected preview";
    img.onload = () => URL.revokeObjectURL(img.src);
    imagePreview.appendChild(img);
  });
}

if (harvestImageInput) {
  harvestImageInput.addEventListener("change", (e) => {
    renderSelectedImagePreviews(e.target.files);
  });
}

function toggleSidebar() {
  document.querySelector(".sidebar").classList.toggle("active");
}

function setActive(button) {
  const buttons = document.querySelectorAll(".sidebar .menu-btn");
  buttons.forEach((b) => b.classList.remove("active"));
  button.classList.add("active");
}

function showTab(tabName) {
  document.querySelectorAll(".tabSection").forEach((tab) => {
    tab.style.display = "none";
  });

  const activeTab = document.getElementById(`${tabName}Tab`);
  if (activeTab) activeTab.style.display = "block";

  if (tabName === "myHarvest") {
    loadHarvests();
  }

  if (tabName === "myOrders") {
    loadOrders();
    markAllNotificationsRead();
  }

  if (tabName === "revenue") {
    loadAnalytics();
  }

  if (tabName === "marketAnalytics") {
    loadMarketAnalytics();
  }
}

function logout() {
  if (farmerSocket) {
    farmerSocket.disconnect();
    farmerSocket = null;
  }
  localStorage.removeItem("token");
  window.location = "login.html";
}

// ================= ADD HARVEST =================
const harvestForm = document.getElementById("harvestForm");
if (harvestForm) {
  harvestForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const harvestId = document.getElementById("harvestId").value;

    let res;
    if (harvestId) {
      const payload = {
        productName: harvestForm.productName.value,
        quantityKg: harvestForm.quantityKg.value,
        district: harvestForm.district.value,
        category: harvestForm.category.value,
        availableDate: harvestForm.availableDate.value,
        description: harvestForm.description.value
      };

      res = await fetch(`${API}/farmer/harvest/${harvestId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });
    } else {
      const formData = new FormData(harvestForm);

      res = await fetch(`${API}/farmer/harvest`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`
        },
        body: formData
      });
    }

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      console.error("addHarvest failed:", res.status, err);
      alert("Harvest add failed");
      return;
    }

    document.getElementById("harvestId").value = "";
    const submitBtn = document.getElementById("submitHarvestBtn");
    if (submitBtn) submitBtn.textContent = "Add Harvest";

    alert(harvestId ? "Harvest Updated" : "Harvest Added");
    harvestForm.reset();
    renderSelectedImagePreviews([]);
    loadHarvests();
    loadAnalytics();
  });
}

// ================= LOAD MY HARVEST =================
async function loadHarvests() {
  const res = await fetch(`${API}/farmer/harvest`, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    console.error("loadHarvests failed:", res.status, err);
    return;
  }

  const data = await res.json();
  const harvests = Array.isArray(data) ? data : data.harvests;
  if (!Array.isArray(harvests)) {
    console.error("loadHarvests: expected array, got", data);
    return;
  }

  const container = document.getElementById("myHarvestList");
  if (!container) return;
  container.innerHTML = "";
  harvestsById = {};
  harvestImageIndex = {};

  harvests.forEach((h) => {
    harvestsById[h._id] = h;
    harvestImageIndex[h._id] = 0;

    const slider = renderSlider(h._id, h.images || []);

    container.innerHTML += `
      <div class="harvest-card">
        <div class="harvest-header">
          <div>
            <h3>${h.productName || ""}</h3>
            <p class="muted">${h.category || ""} • ${h.district || ""}</p>
          </div>
          <span class="badge">${h.status || "AVAILABLE"}</span>
        </div>

        ${slider}

        <div class="harvest-metrics">
          <div>
            <span>Quantity</span>
            <strong>${h.quantityKg || 0} KG</strong>
          </div>
          <div>
            <span>Available Date</span>
            <strong>${h.availableDate ? new Date(h.availableDate).toDateString() : "-"}</strong>
          </div>
        </div>

        <div class="harvest-actions">
          <button class="btn ghost" onclick="editHarvest('${h._id}')">Edit</button>
          <button class="btn danger" onclick="deleteHarvest('${h._id}')">Delete</button>
        </div>
      </div>
    `;
  });
}

function renderSlider(id, images) {
  if (!images || images.length === 0) return "";
  const first = images[0];
  return `
    <div class="slider">
      <button onclick="prevImg('${id}')">&#8249;</button>
      <img id="img-${id}" src="http://localhost:5000/uploads/${first}">
      <button onclick="nextImg('${id}')">&#8250;</button>
    </div>
  `;
}

function prevImg(id) {
  const images = harvestsById[id]?.images || [];
  if (images.length === 0) return;
  let idx = harvestImageIndex[id] || 0;
  idx = (idx - 1 + images.length) % images.length;
  harvestImageIndex[id] = idx;
  const img = document.getElementById(`img-${id}`);
  if (img) img.src = `http://localhost:5000/uploads/${images[idx]}`;
}

function nextImg(id) {
  const images = harvestsById[id]?.images || [];
  if (images.length === 0) return;
  let idx = harvestImageIndex[id] || 0;
  idx = (idx + 1) % images.length;
  harvestImageIndex[id] = idx;
  const img = document.getElementById(`img-${id}`);
  if (img) img.src = `http://localhost:5000/uploads/${images[idx]}`;
}

function editHarvest(id) {
  const h = harvestsById[id];
  if (!h || !harvestForm) return;

  openEditModal(id);
}

// ================= DELETE =================
async function deleteHarvest(id) {
  await fetch(`${API}/farmer/harvest/${id}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${token}`
    }
  });

  loadHarvests();
  loadAnalytics();
}

// expose for inline handlers
window.toggleSidebar = toggleSidebar;
window.setActive = setActive;
window.logout = logout;
window.showTab = showTab;
window.loadHarvests = loadHarvests;
window.loadOrders = loadOrders;
window.deleteHarvest = deleteHarvest;
window.initHarvestMap = initHarvestMap;
window.prevImg = prevImg;
window.nextImg = nextImg;
window.editHarvest = editHarvest;
window.openEditModal = openEditModal;
window.closeEditModal = closeEditModal;
window.acceptOrder = acceptOrder;
window.rejectOrder = rejectOrder;

// ================= ORDERS =================
async function loadOrders() {
  const res = await fetch(`${API}/farmer/orders`, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    console.error("loadOrders failed:", res.status, err);
    return;
  }

  const data = await res.json();
  const orders = Array.isArray(data) ? data : data.orders;
  if (!Array.isArray(orders)) {
    console.error("loadOrders: expected array, got", data);
    return;
  }

  const container = document.getElementById("myOrdersList");
  if (!container) return;
  container.innerHTML = '<div class="orders-grid"></div>';
  const grid = container.querySelector(".orders-grid");

  orders.forEach((o) => {
    const item = o.items && o.items.length ? o.items[0] : null;
    const product = item ? item.productName : "Order";
    const qty = item ? item.quantityKg : "-";
    const status = (o.status || "").toUpperCase();
    const statusClass = status === "PENDING"
      ? "pending"
      : status === "ACCEPTED"
        ? "accepted"
        : status === "REJECTED"
          ? "rejected"
          : "";

    grid.innerHTML += `
      <div class="order-card">
        <h3>${product}</h3>
        <div class="order-meta">
          <div>Qty: ${qty} KG</div>
          <div>Offered Price: Rs ${o.offered_price ?? (item ? item.pricePerKg : "-")}</div>
          <div class="order-status ${statusClass}">${status || "UNKNOWN"}</div>
        </div>
        ${status === "PENDING" ? `
          <div class="order-actions">
            <button class="btn accept" onclick="acceptOrder('${o._id}')">Accept</button>
            <button class="btn reject" onclick="rejectOrder('${o._id}')">Reject</button>
          </div>
        ` : ""}
      </div>
    `;
  });
}

async function acceptOrder(id) {
  await fetch(`${API}/farmer/orders/${id}/accept`, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${token}`
    }
  });

  loadOrders();
  loadAnalytics();
}

async function rejectOrder(id) {
  await fetch(`${API}/farmer/orders/${id}/reject`, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${token}`
    }
  });

  loadOrders();
  loadAnalytics();
}

// ================= ANALYTICS =================
async function loadAnalytics() {
  const res = await fetch(`${API}/farmer/analytics`, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    console.error("loadAnalytics failed:", res.status, err);
    return;
  }

  const data = await res.json();
  const totalHarvest = document.getElementById("totalHarvest");
  const totalOrders = document.getElementById("totalOrders");
  const totalRevenue = document.getElementById("totalRevenue");

  if (totalHarvest) totalHarvest.textContent = data.totalHarvest ?? 0;
  if (totalOrders) totalOrders.textContent = data.totalOrders ?? 0;
  if (totalRevenue) totalRevenue.textContent = `Rs ${data.totalRevenue ?? 0}`;
}

// initial load
showTab("myHarvest");
fetchUnreadNotifications();
initNotificationSocket();

if (notificationBell) {
  notificationBell.addEventListener("click", () => {
    const ordersBtn = document.querySelector('.sidebar .menu-btn[onclick*="myOrders"]');
    if (ordersBtn) {
      setActive(ordersBtn);
    }
    showTab("myOrders");
  });
}

// ================= EDIT MODAL =================
function openEditModal(id) {
  const h = harvestsById[id];
  if (!h) return;

  const modal = document.getElementById("editHarvestModal");
  if (!modal) return;

  document.getElementById("editHarvestId").value = id;
  document.getElementById("editQuantityKg").value = h.quantityKg || "";
  document.getElementById("editDistrict").value = h.district || "";
  document.getElementById("editCategory").value = h.category || "";
  updateProductDropdown("editCategory", "editProductName", h.productName || "");
  document.getElementById("editAvailableDate").value = h.availableDate
    ? new Date(h.availableDate).toISOString().slice(0, 10)
    : "";
  document.getElementById("editDescription").value = h.description || "";

  modal.classList.add("open");
  modal.setAttribute("aria-hidden", "false");
}

function closeEditModal() {
  const modal = document.getElementById("editHarvestModal");
  if (!modal) return;
  modal.classList.remove("open");
  modal.setAttribute("aria-hidden", "true");
}

const editHarvestForm = document.getElementById("editHarvestForm");
if (editHarvestForm) {
  editHarvestForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const id = document.getElementById("editHarvestId").value;
    if (!id) return;

    const payload = {
      productName: document.getElementById("editProductName").value,
      quantityKg: document.getElementById("editQuantityKg").value,
      district: document.getElementById("editDistrict").value,
      category: document.getElementById("editCategory").value,
      availableDate: document.getElementById("editAvailableDate").value,
      description: document.getElementById("editDescription").value
    };

    const res = await fetch(`${API}/farmer/harvest/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify(payload)
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      console.error("editHarvest failed:", res.status, err);
      alert("Harvest update failed");
      return;
    }

    closeEditModal();
    loadHarvests();
    loadAnalytics();
  });
}
