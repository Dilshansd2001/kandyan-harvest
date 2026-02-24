const API = "http://localhost:5000/api";
const token = localStorage.getItem("token");

let selectedHarvestId = null;
let selectedPrice = 0;

loadMarketplace();
loadMetaData();


// -----------------------------
// Load District + Category
// -----------------------------

async function loadMetaData() {

  const districts = await fetch(`${API}/meta/districts`)
    .then(res => res.json());

  const categories = await fetch(`${API}/meta/categories`)
    .then(res => res.json());

  const districtSelect = document.getElementById("districtFilter");
  const categorySelect = document.getElementById("categoryFilter");

  districts.forEach(d => {
    districtSelect.innerHTML += `<option>${d}</option>`;
  });

  categories.forEach(c => {
    categorySelect.innerHTML += `<option>${c}</option>`;
  });
}


// -----------------------------
// Load Marketplace
// -----------------------------

async function loadMarketplace(url = `${API}/marketplace`) {

  const res = await fetch(url);
  const harvests = await res.json();

  const container = document.getElementById("marketContainer");
  container.innerHTML = "";

  harvests.forEach(h => {
    const imagesHtml = (h.images || [])
      .map(img => `<img src="http://localhost:5000/uploads/${img}" style="width:120px;height:120px;object-fit:cover;margin:5px;">`)
      .join("");

    const availableDate = h.availableDate
      ? new Date(h.availableDate).toLocaleDateString()
      : "N/A";

    container.innerHTML += `
      <div class="card">
        <h3>${h.productName}</h3>
        <div>${imagesHtml}</div>
        <p>District: ${h.district}</p>
        <p>Category: ${h.category}</p>
        <p>Available: ${h.quantityKg} KG</p>
        <p>Available Date: ${availableDate}</p>

        <button onclick="openOrderPopup('${h._id}', '${h.productName}', ${h.pricePerKg})">
          Order Now
        </button>
      </div>
    `;

  });

}


// -----------------------------
// Apply Filters
// -----------------------------

function applyFilters() {

  const district = document.getElementById("districtFilter").value;
  const category = document.getElementById("categoryFilter").value;
  const date = document.getElementById("dateFilter").value;

  let url = `${API}/marketplace/search?`;

  if(district) url += `district=${district}&`;
  if(category) url += `category=${category}&`;
  if(date) url += `availableDate=${date}`;

  loadMarketplace(url);
}


// -----------------------------
// Order Popup
// -----------------------------

function openOrderPopup(id, productName, price){

  selectedHarvestId = id;
  selectedPrice = price;

  document.getElementById("modalProduct").innerText = productName;
  document.getElementById("priceDisplay").innerText = price;
  document.getElementById("orderKg").value = "";
  document.getElementById("orderDate").value = "";
  document.getElementById("totalPrice").innerText = "0";

  document.getElementById("orderModal").style.display = "block";
}

function closeOrderPopup(){
  document.getElementById("orderModal").style.display = "none";
}

async function submitOrder(){

  const kg = document.getElementById("orderKg").value;
  const date = document.getElementById("orderDate").value;

  if(!kg || !date){
    alert("Fill all fields");
    return;
  }

  await fetch(`${API}/orders`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify({
      harvestId: selectedHarvestId,
      quantityKg: kg,
      deliveryDate: date
    })
  });

  alert("Order placed successfully");

  closeOrderPopup();
}

function calculateTotal(){

  const kg = document.getElementById("orderKg").value;
  const total = Number(kg || 0) * Number(selectedPrice || 0);

  document.getElementById("totalPrice").innerText = total;
}
