const API = "https://kandyan-harvest-backend-new.vercel.app/api";
const token = localStorage.getItem("token");


// Load Pending Users
async function loadPendingUsers(){

  const res = await fetch(`${API}/admin/users/pending`, {
    headers:{ Authorization:`Bearer ${token}` }
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    console.error("loadPendingUsers failed:", res.status, err);
    return;
  }

  const users = await res.json();

  const c = document.getElementById("content");
  c.innerHTML = '<div class="panel-card"><h2>Pending Users</h2><div class="data-grid"></div></div>';
  const grid = c.querySelector(".data-grid");

  users.forEach(u=>{
    grid.innerHTML += `
      <div class="data-card">
        <h3>${u.email}</h3>
        <div class="data-meta">
          <div>Role: ${u.role}</div>
          <div class="badge pending">Pending</div>
        </div>
        <div class="card-actions">
          <button class="btn primary" onclick="approveUser('${u._id}')">Approve</button>
          <button class="btn ghost" onclick="rejectUser('${u._id}')">Reject</button>
        </div>
      </div>
    `;
  });

}

// Load All Users
async function loadAllUsers(){
  const res = await fetch(`${API}/admin/users`, {
    headers:{ Authorization:`Bearer ${token}` }
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    console.error("loadAllUsers failed:", res.status, err);
    return;
  }

  const users = await res.json();

  const c = document.getElementById("content");
  c.innerHTML = '<div class="panel-card"><h2>All Users</h2><div class="data-grid"></div></div>';
  const grid = c.querySelector(".data-grid");

  users.forEach(u=>{
    grid.innerHTML += `
      <div class="data-card">
        <h3>${u.email}</h3>
        <div class="data-meta">
          <div>Role: ${u.role}</div>
          <div>Verified: ${u.isVerified ? "Yes" : "No"}</div>
        </div>
      </div>
    `;
  });
}

// Load Orders
async function loadOrders(){
  const res = await fetch(`${API}/admin/orders`, {
    headers:{ Authorization:`Bearer ${token}` }
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    console.error("loadOrders failed:", res.status, err);
    return;
  }

  const orders = await res.json();

  const c = document.getElementById("content");
  c.innerHTML = '<div class="panel-card"><h2>Orders</h2><div class="data-grid"></div></div>';
  const grid = c.querySelector(".data-grid");

  orders.forEach(o=>{
    const item = o.items && o.items.length ? o.items[0] : null;
    const status = (o.status || "").toUpperCase();
    const statusClass = status === "PENDING"
      ? "pending"
      : status === "ACCEPTED"
        ? "approved"
        : status === "REJECTED"
          ? "rejected"
          : "";

    grid.innerHTML += `
      <div class="data-card">
        <h3>${item ? item.productName : "Order"}</h3>
        <div class="data-meta">
          <div>Qty: ${item ? item.quantityKg : "-"}</div>
          <div class="badge ${statusClass}">${status || "UNKNOWN"}</div>
        </div>
      </div>
    `;
  });
}

// Load Deliveries
async function loadDeliveries(){
  const res = await fetch(`${API}/admin/deliveries`, {
    headers:{ Authorization:`Bearer ${token}` }
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    console.error("loadDeliveries failed:", res.status, err);
    return;
  }

  const deliveries = await res.json();

  const c = document.getElementById("content");
  c.innerHTML = '<div class="panel-card"><h2>Deliveries</h2><div class="data-grid"></div></div>';
  const grid = c.querySelector(".data-grid");

  const formatLocation = (loc) => {
    if (!loc) return "-";
    if (typeof loc === "string") return loc;
    return loc.address || `${loc.lat || ""}, ${loc.lng || ""}`;
  };

  deliveries.forEach(d=>{
    const status = (d.status || "").toUpperCase();
    const statusClass = status === "DELIVERED"
      ? "delivered"
      : status === "COMPLETED"
        ? "delivered"
        : status === "IN_TRANSIT"
          ? "approved"
          : status === "ASSIGNED"
            ? "pending"
            : "";

    grid.innerHTML += `
      <div class="data-card">
        <h3>Delivery</h3>
        <div class="data-meta">
          <div>${formatLocation(d.pickupLocation)} -> ${formatLocation(d.dropLocation)}</div>
          <div>Charge: Rs.${d.deliveryCharge}</div>
          <div class="badge ${statusClass}">${status || "UNKNOWN"}</div>
        </div>
      </div>
    `;
  });
}


// Approve User
async function approveUser(id){

  await fetch(`${API}/admin/users/${id}/approve`, {
    method:"PUT",
    headers:{ Authorization:`Bearer ${token}` }
  });

  loadPendingUsers();
}



// Reject User
async function rejectUser(id){

  await fetch(`${API}/admin/users/${id}/reject`, {
    method:"PUT",
    headers:{ Authorization:`Bearer ${token}` }
  });

  loadPendingUsers();
}



// Logout
function logout(){
  localStorage.removeItem("token");
  window.location = "login.html";
}

function toggleSidebar(){
  document.querySelector(".sidebar").classList.toggle("active");
}

function setActive(button){

  const buttons = document.querySelectorAll(".sidebar .menu-btn");
  buttons.forEach(b => b.classList.remove("active"));

  button.classList.add("active");
}

window.loadAllUsers = loadAllUsers;
window.loadOrders = loadOrders;
window.loadDeliveries = loadDeliveries;

document.addEventListener("DOMContentLoaded", () => {
  loadPendingUsers();
});
