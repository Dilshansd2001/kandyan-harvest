const API = "http://localhost:5000/api";
const token = localStorage.getItem("token");

loadPendingUsers();


// ------------------------
// Load Users With Documents
// ------------------------

async function loadPendingUsers() {

  const res = await fetch(`${API}/admin/users/pending`, {
    headers: { Authorization: `Bearer ${token}` }
  });

  const users = await res.json();

  const container = document.getElementById("userDocs");
  container.innerHTML = "";

  users.forEach(u => {

    container.innerHTML += `
      <div class="card">

        <h3>${u.email}</h3>
        <p>Role: ${u.role}</p>

        ${renderDocuments(u)}

        <button onclick="approveUser('${u._id}')">
          Approve
        </button>

        <button onclick="rejectUser('${u._id}')">
          Reject
        </button>

      </div>
    `;
  });
}



// ------------------------
// Render Documents
// ------------------------

function renderDocuments(user) {

  let html = "";

  if(user.farmPhoto) {
    html += `
      <p>Farm Photo:</p>
      <img src="http://localhost:5000/uploads/${user.farmPhoto}" width="200">
    `;
  }

  if(user.brnDoc) {
    html += `
      <p>BRN Document:</p>
      <a href="http://localhost:5000/uploads/${user.brnDoc}" target="_blank">
        View Document
      </a>
    `;
  }

  if(user.licenseDoc) {
    html += `
      <p>License Document:</p>
      <img src="http://localhost:5000/uploads/${user.licenseDoc}" width="200">
    `;
  }

  return html;
}



// ------------------------
// Approve User
// ------------------------

async function approveUser(id) {

  await fetch(`${API}/admin/users/${id}/approve`, {
    method: "PUT",
    headers: { Authorization: `Bearer ${token}` }
  });

  loadPendingUsers();
}



// ------------------------
// Reject User
// ------------------------

async function rejectUser(id) {

  await fetch(`${API}/admin/users/${id}/reject`, {
    method: "PUT",
    headers: { Authorization: `Bearer ${token}` }
  });

  loadPendingUsers();
}
