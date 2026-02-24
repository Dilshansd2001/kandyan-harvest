const API = "https://kandyan-harvest.vercel.app/api";
const token = localStorage.getItem("token");


// ------------------
// Open Marketplace
// ------------------

function goMarketplace(){
  window.location = "marketplace.html";
}


// ------------------
// Load Orders
// ------------------

async function loadOrders(){

  const res = await fetch(`${API}/orders/my`, {
    headers: { Authorization: `Bearer ${token}` }
  });

  const orders = await res.json();

  const c = document.getElementById("content");
  c.innerHTML = "<h2>My Orders</h2>";

  orders.forEach(o => {

    c.innerHTML += `
      <div class="card">
        <h3>${o.items[0].productName}</h3>
        <p>Quantity: ${o.items[0].quantityKg} KG</p>
        <p>Status: ${o.status}</p>
      </div>
    `;
  });

}



// ------------------
// Active Deliveries
// ------------------

async function loadActiveDeliveries(){

  const res = await fetch(`${API}/supermarket/deliveries/active`, {
    headers: { Authorization: `Bearer ${token}` }
  });

  const deliveries = await res.json();

  const c = document.getElementById("content");
  c.innerHTML = "<h2>Active Deliveries</h2>";

  const formatLocation = (loc) => {
    if (!loc) return "-";
    if (typeof loc === "string") return loc;
    return loc.address || `${loc.lat || ""}, ${loc.lng || ""}`;
  };
  deliveries.forEach(d => {

    c.innerHTML += `
      <div class="card">
        <p>${formatLocation(d.pickupLocation)} → ${formatLocation(d.dropLocation)}</p>
        <p>Status: ${d.status}</p>
      </div>
    `;
  });

}



// ------------------
// Completed Deliveries
// ------------------

async function loadCompletedDeliveries(){

  const res = await fetch(`${API}/supermarket/deliveries/completed`, {
    headers: { Authorization: `Bearer ${token}` }
  });

  const deliveries = await res.json();

  const c = document.getElementById("content");
  c.innerHTML = "<h2>Completed Deliveries</h2>";

  const formatLocation = (loc) => {
    if (!loc) return "-";
    if (typeof loc === "string") return loc;
    return loc.address || `${loc.lat || ""}, ${loc.lng || ""}`;
  };
  deliveries.forEach(d => {

    c.innerHTML += `
      <div class="card">
        <p>${formatLocation(d.pickupLocation)} → ${formatLocation(d.dropLocation)}</p>
        <p>Charge: Rs.${d.deliveryCharge}</p>
      </div>
    `;
  });

}
function logout(){
  localStorage.removeItem("token");
  window.location="login.html";
}

function toggleSidebar(){
  document.querySelector(".sidebar").classList.toggle("active");
}


