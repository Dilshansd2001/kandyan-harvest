const API = "http://localhost:5000/api";
const token = localStorage.getItem("token");
const socketUrl = "http://localhost:5000";

let map;
let directionsService;
let directionsRenderer;
let activeNavDeliveryId = null;
let activeDeliveriesById = {};
let pendingNotificationCount = 0;
let driverSocket = null;
const notificationBadge = document.getElementById("notificationBadge");
const notificationBell = document.getElementById("notificationBell");
const toastContainer = document.getElementById("notificationToastContainer");

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
    const activeBtn = document.querySelector('.sidebar .menu-btn[onclick*="showDriverTab(\'active\')"]');
    if (activeBtn) setActive(activeBtn);
    showDriverTab("active");
    viewDeliveryDetails(payload.delivery_id);
    return;
  }

  const availableBtn = document.querySelector('.sidebar .menu-btn[onclick*="showDriverTab(\'available\')"]');
  if (availableBtn) setActive(availableBtn);
  showDriverTab("available");
}

async function viewDeliveryDetails(deliveryId) {
  if (!deliveryId) return;

  const res = await fetch(`${API}/deliveries/${deliveryId}`, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });

  const delivery = await res.json().catch(() => ({}));
  if (!res.ok) return;

  const productName =
    delivery.order && Array.isArray(delivery.order.items) && delivery.order.items.length
      ? delivery.order.items[0].productName
      : "-";

  const pickup = delivery.pickupLocation?.address || "-";
  const drop = delivery.dropLocation?.address || "-";

  alert(
    `Product: ${productName}\n` +
    `Pickup: ${pickup}\n` +
    `Drop: ${drop}\n` +
    `Status: ${delivery.status || "-"}\n` +
    `Delivery ID: ${delivery._id}`
  );
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
  if (driverSocket) return;

  driverSocket = io(socketUrl, {
    auth: { token }
  });

  driverSocket.on("new_notification", (payload) => {
    showNotificationToast(payload || { message: "New notification received" });
    updateNotificationBadge(pendingNotificationCount + 1);
  });
}

document.addEventListener("DOMContentLoaded", () => {
  fetchUnreadNotifications();
  initNotificationSocket();
  showDriverTab("available");
});


// ----------------------
// Available Deliveries
// ----------------------

async function loadAvailable() {

  const res = await fetch(`${API}/driver/deliveries/available`, {
    headers: { Authorization: `Bearer ${token}` }
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    console.error("loadAvailable failed:", res.status, err);
    return;
  }

  const deliveries = await res.json();
  console.log("AVAILABLE DELIVERIES", deliveries);
  if (!Array.isArray(deliveries)) {
    console.error("loadAvailable: expected array, got", deliveries);
    return;
  }

  const container = document.getElementById("availableDeliveries");
  container.innerHTML = "";

  const formatLocation = (loc) => {
    if (!loc) return "-";
    if (typeof loc === "string") return loc;
    return loc.address || `${loc.lat || ""}, ${loc.lng || ""}`;
  };

  deliveries.forEach(d => {

    const orderItems = d.order && d.order.items ? d.order.items : [];
    const itemNames = orderItems.map(i => i.productName).join(", ");
    const itemQty = orderItems.reduce((sum, i) => sum + (i.quantityKg || 0), 0);

    container.innerHTML += `
      <div class="card">
        <p>Pickup: ${formatLocation(d.pickupLocation)}</p>
        <p>Drop: ${formatLocation(d.dropLocation)}</p>
        <p>Items: ${itemNames || "-"}</p>
        <p>Quantity: ${itemQty || d.loadKg || 0} KG</p>
        <p>Distance: ${d.distanceKm || "-"} KM</p>
        <p>Hire Price: Rs.${d.deliveryCharge}</p>

        <button onclick="acceptDelivery('${d._id}')">
          Accept Delivery
        </button>
      </div>
    `;
  });

}


// ----------------------
// Accept Delivery
// ----------------------

async function acceptDelivery(id) {

  const res = await fetch(`${API}/driver/deliveries/${id}/accept`, {
    method: "PUT",
    headers: { Authorization: `Bearer ${token}` }
  });

  const data = await res.json();
  if (data && data.delivery) {
    openDeliveryNavigation(data.delivery);
  }

  loadAvailable();
  loadActive();
}


// ----------------------
// Active Deliveries
// ----------------------

async function loadActive() {

  const res = await fetch(`${API}/driver/deliveries/active`, {
    headers: { Authorization: `Bearer ${token}` }
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    console.error("loadActive failed:", res.status, err);
    return;
  }

  const deliveries = await res.json();
  if (!Array.isArray(deliveries)) {
    console.error("loadActive: expected array, got", deliveries);
    return;
  }

  const container = document.getElementById("activeDeliveries");
  container.innerHTML = "";
  activeDeliveriesById = {};

  const formatLocation = (loc) => {
    if (!loc) return "-";
    if (typeof loc === "string") return loc;
    return loc.address || `${loc.lat || ""}, ${loc.lng || ""}`;
  };

  deliveries.forEach(d => {
    activeDeliveriesById[d._id] = d;

    const orderItems = d.order && d.order.items ? d.order.items : [];
    const itemNames = orderItems.map(i => i.productName).join(", ");
    const itemQty = orderItems.reduce((sum, i) => sum + (i.quantityKg || 0), 0);
    const status = (d.status || "").toUpperCase();
    const statusClass = status === "ASSIGNED"
      ? "assigned"
      : status === "IN_TRANSIT"
        ? "in_transit"
        : "";

    container.innerHTML += `
      <div class="card delivery-card active-delivery-card">
        <div class="active-delivery-header">
          <div class="active-delivery-id">Delivery ID: ${d._id ? d._id.slice(-8).toUpperCase() : "-"}</div>
          <div class="delivery-status ${statusClass}">${status || "UNKNOWN"}</div>
        </div>

        <div class="route-list">
          <div class="route-item">
            <i class="fas fa-map-marker-alt"></i>
            <div><strong>Pickup:</strong> ${formatLocation(d.pickupLocation)}</div>
          </div>
          <div class="route-item">
            <i class="fas fa-map-marker-alt"></i>
            <div><strong>Drop-off:</strong> ${formatLocation(d.dropLocation)}</div>
          </div>
        </div>

        <div class="finance-box">
          <div class="finance-item">
            <span>Hire Price</span>
            <strong>Rs.${d.deliveryCharge || 0}</strong>
          </div>
          <div class="finance-item">
            <span>Distance</span>
            <strong>${d.distanceKm || "-"} KM</strong>
          </div>
        </div>

        <div class="delivery-meta">
          <div><strong>Items:</strong> ${itemNames || "-"}</div>
          <div><strong>Quantity:</strong> ${itemQty || d.loadKg || 0} KG</div>
        </div>

        <div class="delivery-actions">
          <button class="btn ghost" onclick="openDeliveryNavigationById('${d._id}')">
            Open Navigation
          </button>

          ${d.status === "ASSIGNED" ? `
            <button class="btn primary" onclick="startDelivery('${d._id}')">
              Start Delivery
            </button>
          ` : ""}

          ${d.status === "IN_TRANSIT" ? `
            <button class="btn primary" onclick="completeDelivery('${d._id}')">
              Complete Delivery
            </button>
          ` : ""}
        </div>
      </div>
    `;
  });

}


// ----------------------
// Start Delivery
// ----------------------

async function startDelivery(id) {

  await fetch(`${API}/driver/deliveries/${id}/start`, {
    method: "PUT",
    headers: { Authorization: `Bearer ${token}` }
  });

  loadActive();
}


// ----------------------
// Complete Delivery
// ----------------------

async function completeDelivery(id) {

  await fetch(`${API}/driver/deliveries/${id}/complete`, {
    method: "PUT",
    headers: { Authorization: `Bearer ${token}` }
  });

  loadActive();
  loadCompleted();
}


// ----------------------
// Completed Deliveries
// ----------------------

async function loadCompleted() {

  const res = await fetch(`${API}/driver/deliveries/completed`, {
    headers: { Authorization: `Bearer ${token}` }
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    console.error("loadCompleted failed:", res.status, err);
    return;
  }

  const deliveries = await res.json();
  if (!Array.isArray(deliveries)) {
    console.error("loadCompleted: expected array, got", deliveries);
    return;
  }

  const container = document.getElementById("completedDeliveries");
  container.innerHTML = "";

  const formatLocation = (loc) => {
    if (!loc) return "-";
    if (typeof loc === "string") return loc;
    return loc.address || `${loc.lat || ""}, ${loc.lng || ""}`;
  };

  deliveries.forEach(d => {
    const status = (d.status || "COMPLETED").toUpperCase();
    container.innerHTML += `
      <div class="card delivery-card active-delivery-card">
        <div class="active-delivery-header">
          <div class="active-delivery-id">Delivery ID: ${d._id ? d._id.slice(-8).toUpperCase() : "-"}</div>
          <div class="delivery-status completed">${status}</div>
        </div>

        <div class="route-list">
          <div class="route-item">
            <i class="fas fa-map-marker-alt"></i>
            <div><strong>Pickup:</strong> ${formatLocation(d.pickupLocation)}</div>
          </div>
          <div class="route-item">
            <i class="fas fa-map-marker-alt"></i>
            <div><strong>Drop-off:</strong> ${formatLocation(d.dropLocation)}</div>
          </div>
        </div>

        <div class="finance-box">
          <div class="finance-item">
            <span>Hire Price</span>
            <strong>Rs.${d.deliveryCharge || 0}</strong>
          </div>
          <div class="finance-item">
            <span>Distance</span>
            <strong>${d.distanceKm || "-"} KM</strong>
          </div>
        </div>

        <div class="delivery-meta">
          <div><strong>Items:</strong> ${(d.order && d.order.items) ? d.order.items.map(i => i.productName).join(", ") : "-"}</div>
          <div><strong>Quantity:</strong> ${(d.order && d.order.items) ? d.order.items.reduce((sum, i) => sum + (i.quantityKg || 0), 0) : (d.loadKg || 0)} KG</div>
        </div>
      </div>
    `;
  });

}

function logout(){
  if (driverSocket) {
    driverSocket.disconnect();
    driverSocket = null;
  }
  localStorage.removeItem("token");
  window.location="login.html";
}

function toggleSidebar(){
  document.querySelector(".sidebar").classList.toggle("active");
}

function setActive(button){

  const buttons = document.querySelectorAll(".sidebar .menu-btn");
  buttons.forEach(b => b.classList.remove("active"));

  button.classList.add("active");
}

function showDriverTab(tab){
  document.querySelectorAll(".tabSection").forEach(s => {
    s.style.display = "none";
  });

  const active = document.getElementById(`${tab}Tab`);
  if (active) active.style.display = "block";

  if (tab === "available") loadAvailable();
  if (tab === "active") loadActive();
  if (tab === "completed") loadCompleted();
  if (tab === "revenue") loadDriverRevenue();
}

if (notificationBell) {
  notificationBell.addEventListener("click", async () => {
    await markAllNotificationsRead();
    const activeBtn = document.querySelector('.sidebar .menu-btn[onclick*="showDriverTab(\'active\')"]');
    if (activeBtn) setActive(activeBtn);
    showDriverTab("active");
  });
}

function openDeliveryNavigation(delivery){
  if (!delivery || !delivery.dropLocation) {
    document.getElementById("etaInfo").innerText = "Drop location not available.";
    return;
  }

  const drop = delivery.dropLocation;
  if (drop.lat == null || drop.lng == null) {
    document.getElementById("etaInfo").innerText = "Drop coordinates not available.";
    return;
  }

  activeNavDeliveryId = delivery._id || null;

  loadDriverNavigation(drop.lat, drop.lng);
}

function openDeliveryNavigationById(id){
  const delivery = activeDeliveriesById[id];
  openDeliveryNavigation(delivery);
}

function loadDriverNavigation(dropLat, dropLng){

  if (!navigator.geolocation) {
    document.getElementById("etaInfo").innerText = "Geolocation not supported.";
    return;
  }

  navigator.geolocation.getCurrentPosition((pos) => {

    const driverLat = pos.coords.latitude;
    const driverLng = pos.coords.longitude;

    map = new google.maps.Map(document.getElementById("driverMap"),{
      zoom: 7,
      center: { lat: driverLat, lng: driverLng }
    });

    directionsService = new google.maps.DirectionsService();
    directionsRenderer = new google.maps.DirectionsRenderer();

    directionsRenderer.setMap(map);

    drawRoute(driverLat, driverLng, dropLat, dropLng);

    const navActions = document.getElementById("navActions");
    if (navActions) {
      navActions.innerHTML = `
        <button onclick="openExternalNavigation(${dropLat}, ${dropLng})">
          Open Google Maps
        </button>
      `;
    }

  }, () => {
    document.getElementById("etaInfo").innerText = "Unable to get driver location.";
  });
}

function drawRoute(startLat, startLng, endLat, endLng){

  directionsService.route({
    origin: { lat: startLat, lng: startLng },
    destination: { lat: endLat, lng: endLng },
    travelMode: "DRIVING"
  }, (result, status) => {

    if (status === "OK") {

      directionsRenderer.setDirections(result);

      const leg = result.routes[0].legs[0];

      document.getElementById("etaInfo").innerText =
        `Distance: ${leg.distance.text} | ETA: ${leg.duration.text}`;
    }
  });
}

function openExternalNavigation(lat, lng){
  window.open(
    `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`,
    "_blank"
  );
}

window.showDriverTab = showDriverTab;

// ================= REVENUE =================
async function loadDriverRevenue() {
  const res = await fetch(`${API}/driver/deliveries/completed`, {
    headers: { Authorization: `Bearer ${token}` }
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    console.error("loadDriverRevenue failed:", res.status, err);
    return;
  }

  const deliveries = await res.json();
  if (!Array.isArray(deliveries)) {
    console.error("loadDriverRevenue: expected array, got", deliveries);
    return;
  }

  const totalCompleted = deliveries.length;
  const totalCharges = deliveries.reduce(
    (sum, d) => sum + Number(d.deliveryCharge || 0),
    0
  );

  const totalCompletedEl = document.getElementById("driverTotalCompleted");
  const totalChargesEl = document.getElementById("driverTotalCharges");
  if (totalCompletedEl) totalCompletedEl.textContent = totalCompleted;
  if (totalChargesEl) totalChargesEl.textContent = `Rs ${totalCharges}`;

  const list = document.getElementById("driverRevenueList");
  if (!list) return;
  list.innerHTML = "";

  const formatLocation = (loc) => {
    if (!loc) return "-";
    if (typeof loc === "string") return loc;
    return loc.address || `${loc.lat || ""}, ${loc.lng || ""}`;
  };

  deliveries.forEach((d) => {
    const status = (d.status || "COMPLETED").toUpperCase();
    const itemNames =
      d.order && Array.isArray(d.order.items)
        ? d.order.items.map((i) => i.productName).join(", ")
        : "-";
    const totalQty =
      d.order && Array.isArray(d.order.items)
        ? d.order.items.reduce((sum, i) => sum + (i.quantityKg || 0), 0)
        : (d.loadKg || 0);

    list.innerHTML += `
      <div class="card delivery-card active-delivery-card">
        <div class="active-delivery-header">
          <div class="active-delivery-id">Trip ID: ${d._id ? d._id.slice(-8).toUpperCase() : "-"}</div>
          <div class="delivery-status completed">${status}</div>
        </div>

        <div class="route-list">
          <div class="route-item">
            <i class="fas fa-map-marker-alt"></i>
            <div><strong>Pickup:</strong> ${formatLocation(d.pickupLocation)}</div>
          </div>
          <div class="route-item">
            <i class="fas fa-map-marker-alt"></i>
            <div><strong>Drop-off:</strong> ${formatLocation(d.dropLocation)}</div>
          </div>
        </div>

        <div class="finance-box">
          <div class="finance-item">
            <span>Hire Price</span>
            <strong>Rs.${d.deliveryCharge || 0}</strong>
          </div>
          <div class="finance-item">
            <span>Distance</span>
            <strong>${d.distanceKm || "-"} KM</strong>
          </div>
        </div>

        <div class="delivery-meta">
          <div><strong>Items:</strong> ${itemNames}</div>
          <div><strong>Quantity:</strong> ${totalQty} KG</div>
        </div>
      </div>
    `;
  });
}
