const API = "https://kandyan-harvest.vercel.app/api";
const token = localStorage.getItem("token");
const socketUrl = "https://kandyan-harvest.vercel.app";

let pendingNotificationCount = 0;
let supermarketSocket = null;
const notificationBadge = document.getElementById("notificationBadge");
const notificationBell = document.getElementById("notificationBell");
const toastContainer = document.getElementById("notificationToastContainer");
const orderDetailsModal = document.getElementById("orderDetailsModal");
const detailOrderId = document.getElementById("detailOrderId");
const detailProductName = document.getElementById("detailProductName");
const detailQuantity = document.getElementById("detailQuantity");
const detailPrice = document.getElementById("detailPrice");
const detailStatus = document.getElementById("detailStatus");
const orderDetailsCloseTop = document.getElementById("orderDetailsCloseTop");
const orderDetailsCloseBottom = document.getElementById("orderDetailsCloseBottom");
const productInfoModal = document.getElementById("productInfoModal");
const productInfoTitle = document.getElementById("productInfoTitle");
const productInfoBody = document.getElementById("productInfoBody");
const productInfoCloseTop = document.getElementById("productInfoCloseTop");
const productInfoCloseBottom = document.getElementById("productInfoCloseBottom");

function closeProductInfoModal() {
  if (!productInfoModal) return;
  productInfoModal.classList.remove("open");
}

function openProductInfo(encodedDescription, encodedProductName) {
  const description = decodeURIComponent(encodedDescription || "");
  const productName = decodeURIComponent(encodedProductName || "Product");

  if (productInfoTitle) {
    productInfoTitle.textContent = `${productName} Description`;
  }
  if (productInfoBody) {
    productInfoBody.textContent = description || "No description provided by the farmer.";
  }

  if (productInfoModal) {
    productInfoModal.classList.add("open");
  }
}

function closeOrderDetailsModal() {
  if (!orderDetailsModal) return;
  orderDetailsModal.classList.remove("open");
}

function openOrderDetailsModal(order) {
  if (!orderDetailsModal || !order) return;

  const firstItem = Array.isArray(order.items) && order.items.length ? order.items[0] : null;
  if (detailOrderId) detailOrderId.textContent = order._id || "-";
  if (detailProductName) detailProductName.textContent = firstItem?.productName || "-";
  if (detailQuantity) detailQuantity.textContent = `${firstItem?.quantityKg ?? "-"} KG`;
  if (detailPrice) detailPrice.textContent = `Rs.${order.offered_price || firstItem?.pricePerKg || 0}`;
  if (detailStatus) detailStatus.textContent = order.status || "-";

  orderDetailsModal.classList.add("open");
}

function updateNotificationBadge(count) {
  pendingNotificationCount = Math.max(0, Number(count) || 0);
  if (!notificationBadge) return;

  notificationBadge.textContent = pendingNotificationCount > 99 ? "99+" : String(pendingNotificationCount);
  notificationBadge.style.display = pendingNotificationCount > 0 ? "flex" : "none";
}

async function markNotificationRead(notificationId) {
  if (!notificationId || !token) return;

  try {
    const res = await fetch(`${API}/notifications/${notificationId}/read`, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    if (res.ok) {
      updateNotificationBadge(pendingNotificationCount - 1);
    }
  } catch (err) {
    console.error("markNotificationRead failed:", err.message);
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

    if (res.ok) updateNotificationBadge(0);
  } catch (err) {
    console.error("markAllNotificationsRead failed:", err.message);
  }
}

function openNotificationTarget(payload) {
  if (payload?.delivery_id) {
    const deliveriesBtn = document.querySelector('.sidebar .menu-btn[onclick*="loadDeliveries"]');
    if (deliveriesBtn) setActive(deliveriesBtn);
    loadDeliveries();
    return;
  }

  const ordersBtn = document.querySelector('.sidebar .menu-btn[onclick*="loadOrders"]');
  if (ordersBtn) setActive(ordersBtn);
  loadOrders();
  if (payload?.order_id) {
    viewOrderDetails(payload.order_id);
  }
}

function showNotificationToast(payload) {
  if (!toastContainer || !payload?.message) return;

  const toast = document.createElement("div");
  toast.className = "notification-toast";
  toast.textContent = payload.message;
  toastContainer.appendChild(toast);

  toast.addEventListener("click", async () => {
    await markNotificationRead(payload.notificationId);
    openNotificationTarget(payload);
  });

  setTimeout(() => {
    toast.remove();
  }, 4500);
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
    console.error("fetchUnreadNotifications failed:", err.message);
  }
}

function initNotificationSocket() {
  if (!token || typeof io !== "function") return;
  if (supermarketSocket) return;

  supermarketSocket = io(socketUrl, {
    auth: { token }
  });

  supermarketSocket.on("new_notification", (payload) => {
    showNotificationToast(payload || { message: "New notification received" });
    updateNotificationBadge(pendingNotificationCount + 1);
  });
}

let selectedHarvestId = null;
let map;
let marker;
let selectedLat = null;
let selectedLng = null;
let selectedAddress = "";
let locationPickerReady = false;
let autocomplete;

// -----------------------------
// Marketplace
// -----------------------------

async function loadMarketplace(){

  const content = document.getElementById("content");

  const res = await fetch("marketplace-content.html");
  const html = await res.text();

  content.innerHTML = html;

  loadMarketplaceData();
}

async function loadMarketplaceData(){

  const res = await fetch(`${API}/harvest/marketplace`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  const data = await res.json();

  const list = document.getElementById("marketplaceList");
  list.innerHTML = "";

  const escapeHtml = (value) => {
    return String(value || "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#39;");
  };

  data.forEach(item => {
    const images = item.images && item.images.length
      ? item.images.map(img => `https://kandyan-harvest.vercel.app/uploads/${img}`)
      : ["no-image.png"];
    const category = (item.category || "").toString();
    const variety = (item.productName || "").toString();
    const district = (item.district || "").toString();
    const addedDate = item.createdAt || "";
    const description = (item.description || "").toString().trim() || "No description provided by the farmer.";
    const descriptionPreview = description.length > 140
      ? `${description.slice(0, 137)}...`
      : description;
    const encodedDescription = encodeURIComponent(description);
    const encodedProduct = encodeURIComponent(item.productName || "Product");

    list.innerHTML += `
      <div class="card marketplace-card product-card" data-category="${category}" data-variety="${variety}" data-district="${district}" data-added="${addedDate}">
        <div class="slider cardSlider">
          <button class="prevBtn">❮</button>
          <div class="slides">
            ${images.map(img => `
              <img src="${img}" class="slide">
            `).join("")}
          </div>
          <button class="nextBtn">❯</button>
        </div>
        <h3>${item.productName}</h3>
        <div class="marketplace-meta">
          <div>District: ${item.district}</div>
          <div>Category: ${item.category}</div>
          <div>Available: ${item.quantityKg} KG</div>
        </div>

        <div class="marketplace-actions">
          <div class="info-wrap">
            <button class="info-btn" type="button" aria-label="View product description" onclick="openProductInfo('${encodedDescription}', '${encodedProduct}')">
              <i class="fas fa-info-circle"></i>
            </button>
            <div class="info-tooltip">${escapeHtml(descriptionPreview)}</div>
          </div>
          <button class="order-btn" onclick="openOrderPopup('${item._id}', '${item.productName}')">
             Order Now
          </button>
        </div>
      </div>
    `;
  });

  initMarketplaceFilters();
  applyMarketplaceFilters();
  initSliders();
}

function initMarketplaceFilters() {
  const categoryEl = document.getElementById("filterCategory");
  const varietyEl = document.getElementById("filterVariety");
  const districtEl = document.getElementById("filterDistrict");
  const dateEl = document.getElementById("filterDate");

  if (!categoryEl || !varietyEl || !districtEl || !dateEl) return;

  categoryEl.addEventListener("change", () => {
    updateVarietyOptions();
    updateDistrictOptions();
    applyMarketplaceFilters();
  });
  varietyEl.addEventListener("change", applyMarketplaceFilters);
  districtEl.addEventListener("change", applyMarketplaceFilters);
  dateEl.addEventListener("change", applyMarketplaceFilters);

  updateVarietyOptions();
  updateDistrictOptions();
}

function updateVarietyOptions() {
  const categoryEl = document.getElementById("filterCategory");
  const varietyEl = document.getElementById("filterVariety");
  if (!categoryEl || !varietyEl) return;

  const selectedCategory = categoryEl.value;
  const cards = Array.from(document.querySelectorAll("#marketplaceList .product-card"));

  const varieties = cards
    .filter((card) => selectedCategory === "all" || card.dataset.category === selectedCategory)
    .map((card) => card.dataset.variety)
    .filter(Boolean);

  const uniqueSortedVarieties = [...new Set(varieties)].sort((a, b) => a.localeCompare(b));

  varietyEl.innerHTML = '<option value="all">All Varieties</option>';
  uniqueSortedVarieties.forEach((variety) => {
    const option = document.createElement("option");
    option.value = variety;
    option.textContent = variety;
    varietyEl.appendChild(option);
  });

  varietyEl.value = "all";
}

function updateDistrictOptions() {
  const districtEl = document.getElementById("filterDistrict");
  if (!districtEl) return;

  const cards = Array.from(document.querySelectorAll("#marketplaceList .product-card"));
  const districts = cards
    .map((card) => card.dataset.district || "")
    .filter(Boolean);

  const uniqueSortedDistricts = [...new Set(districts)].sort((a, b) => a.localeCompare(b));

  districtEl.innerHTML = '<option value="all">All Districts</option>';
  uniqueSortedDistricts.forEach((district) => {
    const option = document.createElement("option");
    option.value = district;
    option.textContent = district;
    districtEl.appendChild(option);
  });

  districtEl.value = "all";
}

function isWithinDateFilter(dateValue, dateFilter) {
  if (!dateValue || dateFilter === "anytime") return true;

  const addedDate = new Date(dateValue);
  if (Number.isNaN(addedDate.getTime())) return true;

  const now = new Date();

  if (dateFilter === "today") {
    return (
      addedDate.getFullYear() === now.getFullYear() &&
      addedDate.getMonth() === now.getMonth() &&
      addedDate.getDate() === now.getDate()
    );
  }

  if (dateFilter === "this_week") {
    const weekStart = new Date(now);
    weekStart.setHours(0, 0, 0, 0);
    weekStart.setDate(now.getDate() - now.getDay());
    return addedDate >= weekStart && addedDate <= now;
  }

  return true;
}

function applyMarketplaceFilters() {
  const categoryEl = document.getElementById("filterCategory");
  const varietyEl = document.getElementById("filterVariety");
  const districtEl = document.getElementById("filterDistrict");
  const dateEl = document.getElementById("filterDate");

  if (!categoryEl || !varietyEl || !districtEl || !dateEl) return;

  const selectedCategory = categoryEl.value;
  const selectedVariety = varietyEl.value;
  const selectedDistrict = districtEl.value;
  const selectedDate = dateEl.value;

  document.querySelectorAll("#marketplaceList .product-card").forEach((card) => {
    const categoryMatch =
      selectedCategory === "all" || card.dataset.category === selectedCategory;
    const varietyMatch =
      selectedVariety === "all" || card.dataset.variety === selectedVariety;
    const districtMatch =
      selectedDistrict === "all" || card.dataset.district === selectedDistrict;
    const dateMatch = isWithinDateFilter(card.dataset.added, selectedDate);

    card.style.display = categoryMatch && varietyMatch && districtMatch && dateMatch ? "" : "none";
  });
}

// -----------------------------
// Orders
// -----------------------------

async function loadOrders(){

  const res = await fetch(`${API}/orders/my`, {
    headers: { Authorization: `Bearer ${token}` }
  });

  const orders = await res.json();

  const c = document.getElementById("content");
  c.innerHTML = '<div class="panel-card"><h2>My Orders</h2><div class="orders-grid"></div></div>';
  const grid = c.querySelector(".orders-grid");

  orders.forEach(o => {
    const item = o.items && o.items.length ? o.items[0] : null;
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
        <h3>${item ? item.productName : "Order"}</h3>
        <div class="order-meta">
          <div>Quantity: ${item ? item.quantityKg : "-"} KG</div>
          <div class="order-status ${statusClass}">${status || "UNKNOWN"}</div>
        </div>
        <div class="delivery-actions" style="margin-top:10px;">
          <button class="order-btn" onclick="viewOrderDetails('${o._id}')">View Order</button>
        </div>
      </div>
    `;
  });
}

async function viewOrderDetails(orderId) {
  if (!orderId) return;

  const res = await fetch(`${API}/orders/${orderId}`, {
    headers: { Authorization: `Bearer ${token}` }
  });

  const order = await res.json().catch(() => ({}));
  if (!res.ok) {
    alert(order.message || "Unable to load order details");
    return;
  }

  openOrderDetailsModal(order);
}

// -----------------------------
// Deliveries
// -----------------------------

async function loadDeliveries(){

  const c = document.getElementById("content");
  c.innerHTML = '<div class="panel-card"><h2>Deliveries</h2></div>';

  const [activeRes, completedRes] = await Promise.all([
    fetch(`${API}/supermarket/deliveries/active`, {
      headers: { Authorization: `Bearer ${token}` }
    }),
    fetch(`${API}/supermarket/deliveries/completed`, {
      headers: { Authorization: `Bearer ${token}` }
    })
  ]);

  const active = await activeRes.json();
  const completed = await completedRes.json();

  const formatLocation = (loc) => {
    if (!loc) return "-";
    if (typeof loc === "string") return loc;
    return loc.address || `${loc.lat || ""}, ${loc.lng || ""}`;
  };

  const getStepStates = (status) => {
    const normalized = (status || "").toUpperCase();
    return {
      ready: normalized === "ASSIGNED" || normalized === "IN_TRANSIT" || normalized === "COMPLETED",
      transit: normalized === "IN_TRANSIT" || normalized === "COMPLETED",
      delivered: normalized === "COMPLETED"
    };
  };

  const getStatusBadgeClass = (status) => {
    const normalized = (status || "").toUpperCase();
    return normalized === "COMPLETED" ? "completed" : "active";
  };

  const panel = c.querySelector(".panel-card");

  panel.innerHTML += `
    <div class="delivery-section">
      <div class="delivery-label">Active Deliveries</div>
      <div class="delivery-grid active-grid"></div>
    </div>
    <div class="delivery-section">
      <div class="delivery-label">Completed Deliveries</div>
      <div class="delivery-grid completed-grid"></div>
    </div>
  `;

  const activeGrid = panel.querySelector(".active-grid");
  const completedGrid = panel.querySelector(".completed-grid");

  active.forEach(d => {
    const steps = getStepStates(d.status);
    const statusLabel = (d.status || "IN_TRANSIT").replace("_", " ");
    const driverName = d.driver?.fullName || "Driver not assigned";
    const driverPhone = d.driver?.phone || "-";
    const pickup = formatLocation(d.pickupLocation);
    const drop = formatLocation(d.dropLocation);

    activeGrid.innerHTML += `
      <div class="delivery-card">
        <div class="delivery-tracker">
          <div class="tracker-step ${steps.ready ? "active" : ""}">Order Ready</div>
          <div class="tracker-step ${steps.transit ? "active" : ""}">In Transit</div>
          <div class="tracker-step ${steps.delivered ? "active" : ""}">Delivered</div>
        </div>

        <div class="delivery-route">
          <div class="route-row"><i class="fas fa-map-marker-alt"></i><strong>Pickup:</strong> ${pickup}</div>
          <div class="route-row"><i class="fas fa-map-marker-alt"></i><strong>Destination:</strong> ${drop}</div>
        </div>

        <div class="driver-box">
          <div><strong>Driver:</strong> ${driverName}</div>
          <div><strong>Contact:</strong> ${driverPhone}</div>
        </div>

        <div class="delivery-status ${getStatusBadgeClass(d.status)}">${statusLabel}</div>

        <div class="delivery-actions">
          <button class="delivery-btn primary" onclick="viewOnMap('${d._id}')">View on Map</button>
          <button class="delivery-btn" onclick="contactDriver('${d.driver?.phone || ""}')">Contact Driver</button>
        </div>
      </div>
    `;
  });

  completed.forEach(d => {
    const steps = getStepStates(d.status || "COMPLETED");
    const driverName = d.driver?.fullName || "Driver";
    const driverPhone = d.driver?.phone || "-";
    const pickup = formatLocation(d.pickupLocation);
    const drop = formatLocation(d.dropLocation);

    completedGrid.innerHTML += `
      <div class="delivery-card">
        <div class="delivery-tracker">
          <div class="tracker-step ${steps.ready ? "active" : ""}">Order Ready</div>
          <div class="tracker-step ${steps.transit ? "active" : ""}">In Transit</div>
          <div class="tracker-step ${steps.delivered ? "active" : ""}">Delivered</div>
        </div>

        <div class="delivery-route">
          <div class="route-row"><i class="fas fa-map-marker-alt"></i><strong>Pickup:</strong> ${pickup}</div>
          <div class="route-row"><i class="fas fa-map-marker-alt"></i><strong>Destination:</strong> ${drop}</div>
        </div>

        <div class="driver-box">
          <div><strong>Driver:</strong> ${driverName}</div>
          <div><strong>Contact:</strong> ${driverPhone}</div>
          <div><strong>Charge:</strong> Rs. ${d.deliveryCharge || 0}</div>
        </div>

        <div class="delivery-status completed">Completed</div>

        <div class="delivery-actions">
          <button class="delivery-btn primary" onclick="viewOnMap('${d._id}')">View on Map</button>
          <button class="delivery-btn" onclick="contactDriver('${d.driver?.phone || ""}')">Contact Driver</button>
        </div>
      </div>
    `;
  });
}

function viewOnMap(deliveryId) {
  if (!deliveryId) return;

  Promise.all([
    fetch(`${API}/supermarket/deliveries/active`, {
      headers: { Authorization: `Bearer ${token}` }
    }).then((r) => r.json()),
    fetch(`${API}/supermarket/deliveries/completed`, {
      headers: { Authorization: `Bearer ${token}` }
    }).then((r) => r.json())
  ])
    .then(([active, completed]) => {
      const all = [...(Array.isArray(active) ? active : []), ...(Array.isArray(completed) ? completed : [])];
      const delivery = all.find((d) => d._id === deliveryId);
      if (!delivery) return;

      const pickup = delivery.pickupLocation || {};
      const drop = delivery.dropLocation || {};

      const pickupQuery = pickup.lat != null && pickup.lng != null
        ? `${pickup.lat},${pickup.lng}`
        : encodeURIComponent(pickup.address || "");
      const dropQuery = drop.lat != null && drop.lng != null
        ? `${drop.lat},${drop.lng}`
        : encodeURIComponent(drop.address || "");

      if (!pickupQuery || !dropQuery) return;

      window.open(
        `https://www.google.com/maps/dir/?api=1&origin=${pickupQuery}&destination=${dropQuery}`,
        "_blank"
      );
    })
    .catch(() => {});
}

function contactDriver(phone) {
  if (!phone || phone === "-") {
    alert("Driver contact is not available yet.");
    return;
  }
  window.location.href = `tel:${phone}`;
}

// -----------------------------
// Order Popup
// -----------------------------

function openOrderPopup(id, productName){

  selectedHarvestId = id;
  selectedLat = null;
  selectedLng = null;
  selectedAddress = "";

  document.getElementById("modalProduct").innerText = productName;
  document.getElementById("offeredPrice").value = "";
  document.getElementById("orderKg").value = "";
  document.getElementById("locationSearch").value = "";
  document.getElementById("selectedAddress").innerText = "";
  document.getElementById("orderDate").value = "";
  document.getElementById("totalPrice").innerText = "0";

  document.getElementById("orderModal").style.display = "block";
  document.body.classList.add("modal-open");

  setTimeout(initLocationPicker, 300);
}

function closeOrderPopup(){
  document.getElementById("orderModal").style.display = "none";
  document.body.classList.remove("modal-open");
}

function setActive(button){

  const buttons = document.querySelectorAll(".sidebar .menu-btn");
  buttons.forEach(b => b.classList.remove("active"));

  button.classList.add("active");
}

function calculateTotal(){

  const offeredPrice = document.getElementById("offeredPrice").value;
  const kg = document.getElementById("orderKg").value;
  const total = Number(kg || 0) * Number(offeredPrice || 0);

  document.getElementById("totalPrice").innerText = total;
}

async function submitOrder(){

  const offeredPrice = Number(document.getElementById("offeredPrice").value);
  const kg = document.getElementById("orderKg").value;
  const date = document.getElementById("orderDate").value;

  if(
    !kg ||
    !date ||
    !selectedLat ||
    !selectedLng ||
    !Number.isFinite(offeredPrice) ||
    offeredPrice <= 0
  ){
    alert("Please enter a valid offered price and select location from map");
    return;
  }

  if (!selectedAddress) {
    selectedAddress = `${selectedLat}, ${selectedLng}`;
  }

  const res = await fetch(`${API}/orders`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify({
      harvestId: selectedHarvestId,
      quantityKg: Number(kg),
      offered_price: offeredPrice,
      deliveryDate: date,
      deliveryLocation: {
        lat: selectedLat,
        lng: selectedLng,
        address: selectedAddress
      }
    })
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    alert(data.message || "Order failed");
    return;
  }

  alert("Order placed successfully");

  closeOrderPopup();
}

function logout(){
  if (supermarketSocket) {
    supermarketSocket.disconnect();
    supermarketSocket = null;
  }
  localStorage.removeItem("token");
  window.location = "login.html";
}

loadMarketplace();
fetchUnreadNotifications();
initNotificationSocket();

if (notificationBell) {
  notificationBell.addEventListener("click", async () => {
    await markAllNotificationsRead();
    const ordersBtn = document.querySelector('.sidebar .menu-btn[onclick*="loadOrders"]');
    if (ordersBtn) setActive(ordersBtn);
    loadOrders();
  });
}

if (orderDetailsCloseTop) {
  orderDetailsCloseTop.addEventListener("click", closeOrderDetailsModal);
}

if (orderDetailsCloseBottom) {
  orderDetailsCloseBottom.addEventListener("click", closeOrderDetailsModal);
}

if (orderDetailsModal) {
  orderDetailsModal.addEventListener("click", (e) => {
    if (e.target === orderDetailsModal) {
      closeOrderDetailsModal();
    }
  });
}

if (productInfoCloseTop) {
  productInfoCloseTop.addEventListener("click", closeProductInfoModal);
}

if (productInfoCloseBottom) {
  productInfoCloseBottom.addEventListener("click", closeProductInfoModal);
}

if (productInfoModal) {
  productInfoModal.addEventListener("click", (e) => {
    if (e.target === productInfoModal) {
      closeProductInfoModal();
    }
  });
}

function initSliders(){
  setTimeout(() => {
    document.querySelectorAll(".slider").forEach(slider => {
      const slides = slider.querySelectorAll(".slide");
      const prevBtn = slider.querySelector(".prevBtn");
      const nextBtn = slider.querySelector(".nextBtn");
      if(!slides.length) return;

      let index = 0;
      slides[index].classList.add("active");

      prevBtn.onclick = () => {
        slides[index].classList.remove("active");
        index = (index - 1 + slides.length) % slides.length;
        slides[index].classList.add("active");
      };

      nextBtn.onclick = () => {
        slides[index].classList.remove("active");
        index = (index + 1) % slides.length;
        slides[index].classList.add("active");
      };
    });
  }, 200);
}

function initLocationPicker(){

  if (locationPickerReady) {
    if (map) {
      google.maps.event.trigger(map, "resize");
      map.setCenter({ lat: 7.8731, lng: 80.7718 });
      map.setZoom(7);
    }
    if (marker) {
      marker.setMap(null);
      marker = null;
    }
    return;
  }

  if (!window.google || !google.maps || !google.maps.places) {
    console.warn("Google Maps library not loaded.");
    return;
  }

  const mapEl = document.getElementById("map");
  const searchEl = document.getElementById("locationSearch");

  if (!mapEl || !searchEl) return;

  map = new google.maps.Map(mapEl, {
    center: { lat: 7.8731, lng: 80.7718 },
    zoom: 7
  });

  initAutocomplete();

  map.addListener("click", (e) => {
    setMarker(e.latLng);
    reverseGeocode(e.latLng);
  });

  locationPickerReady = true;
}

function initAutocomplete(){
  const input = document.getElementById("locationSearch");
  if (!input) return;

  autocomplete = new google.maps.places.Autocomplete(input, {
    componentRestrictions: { country: "lk" }
  });

  autocomplete.addListener("place_changed", () => {
    const place = autocomplete.getPlace();
    if (!place.geometry) return;

    const location = place.geometry.location;
    map.setCenter(location);
    map.setZoom(14);

    setMarker(location);

    selectedAddress = place.formatted_address || "";
    document.getElementById("selectedAddress").innerText = selectedAddress;
  });
}

function setMarker(location){

  if (marker) marker.setMap(null);

  marker = new google.maps.Marker({
    position: location,
    map: map
  });

  selectedLat = location.lat();
  selectedLng = location.lng();

  if (!selectedAddress) {
    selectedAddress = `${selectedLat}, ${selectedLng}`;
    document.getElementById("selectedAddress").innerText = selectedAddress;
  }
}

function reverseGeocode(latLng){

  const geocoder = new google.maps.Geocoder();

  geocoder.geocode({ location: latLng }, (results, status) => {
    if (status === "OK" && results[0]) {
      selectedAddress = results[0].formatted_address || "";
      document.getElementById("selectedAddress").innerText = selectedAddress;
    }
  });
}

