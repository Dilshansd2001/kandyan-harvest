const API = "https://kandyan-harvest.vercel.app/api";
const token = localStorage.getItem("token");

loadOrders();


// ---------------------
// Load My Orders
// ---------------------

async function loadOrders() {

  const res = await fetch(`${API}/orders/my`, {
    headers: { Authorization: `Bearer ${token}` }
  });

  const orders = await res.json();

  const container = document.getElementById("ordersContainer");
  container.innerHTML = "";

  orders.forEach(o => {

    container.innerHTML += `
      <div class="card">

        <h3>${o.items[0].productName}</h3>

        <p>Quantity: ${o.items[0].quantityKg} KG</p>
        <p>Status: ${o.status}</p>

        <button onclick="viewOrder('${o._id}')">
          View Details
        </button>

      </div>
    `;
  });

}


// ---------------------
// View Order Details
// ---------------------

async function viewOrder(orderId) {

  const res = await fetch(`${API}/orders/${orderId}`, {
    headers: { Authorization: `Bearer ${token}` }
  });

  const order = await res.json();

  alert(`
Product: ${order.items[0].productName}
Quantity: ${order.items[0].quantityKg} KG
Status: ${order.status}
Delivery Location: ${order.deliveryLocation}
  `);

}
