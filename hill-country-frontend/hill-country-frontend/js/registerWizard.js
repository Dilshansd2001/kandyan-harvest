const API = "https://kandyan-harvest-backend-new.vercel.app/api";


// STEP NAVIGATION
function nextStep(step){

["step1","step2","step3","step4"].forEach(s=>{
document.getElementById(s).style.display="none";
});

// Skip upload step if role is not driver
if(step===3){
  const role=document.getElementById("role").value;
  if(role!=="driver"){
    step=4;
  }
}

document.getElementById("step"+step).style.display="block";

if(step===2) loadRoleFields();
if(step===3) loadFileFields();
}

function prevStep(step){
  const role=document.getElementById("role").value;
  if(step===3 && role!=="driver"){
    step=2;
  }
  nextStep(step);
}



// ================= ROLE FIELDS =================

function loadRoleFields(){

const role=document.getElementById("role").value;
const c=document.getElementById("roleFields");
const inputClass = "wizard-input";
const selectClass = "wizard-select";

c.innerHTML="";


// -------- FARMER --------
if(role==="farmer"){
c.innerHTML=`

<input id="nic" class="${inputClass}" placeholder="NIC Number">
<input id="farmName" class="${inputClass}" placeholder="Farm Name">
<select id="district" class="${selectClass}">
  <option value="">Select District</option>
  <option>Ampara</option>
  <option>Anuradhapura</option>
  <option>Badulla</option>
  <option>Batticaloa</option>
  <option>Colombo</option>
  <option>Galle</option>
  <option>Gampaha</option>
  <option>Hambantota</option>
  <option>Jaffna</option>
  <option>Kalutara</option>
  <option>Kandy</option>
  <option>Kegalle</option>
  <option>Kilinochchi</option>
  <option>Kurunegala</option>
  <option>Mannar</option>
  <option>Matale</option>
  <option>Matara</option>
  <option>Monaragala</option>
  <option>Mullaitivu</option>
  <option>Nuwara Eliya</option>
  <option>Polonnaruwa</option>
  <option>Puttalam</option>
  <option>Ratnapura</option>
  <option>Trincomalee</option>
  <option>Vavuniya</option>
</select>

`;
}


// -------- SUPERMARKET --------
if(role==="supermarket"){
c.innerHTML=`

<input id="businessName" class="${inputClass}" placeholder="Business Name">
<select id="businessType" class="${selectClass}">
  <option value="">Select Business Type</option>
  <option>Supermarket</option>
  <option>Hotel</option>
  <option>Restaurant</option>
</select>
<input id="brn" class="${inputClass}" placeholder="Business Registration Number">
<input id="address" class="${inputClass}" placeholder="Full Address">

`;
}


// -------- DRIVER --------
if(role==="driver"){
c.innerHTML=`

<input id="nic" class="${inputClass}" placeholder="NIC Number">
<input id="licenseNumber" class="${inputClass}" placeholder="License Number">
<input id="vehicleType" class="${inputClass}" placeholder="Vehicle Type">
<input id="vehicleNumber" class="${inputClass}" placeholder="Vehicle Number">
<input id="loadCapacityKg" class="${inputClass}" type="number" placeholder="Load Capacity (KG)">
<input id="serviceDistrict" class="${inputClass}" placeholder="Service District">
<input id="address" class="${inputClass}" placeholder="Address">

`;
}

}



// ================= FILE FIELDS =================

function loadFileFields(){

  const role=document.getElementById("role").value;
  const c=document.getElementById("fileFields");
  const inputClass = "wizard-file";

  c.innerHTML="";

  // ONLY DRIVER upload
  if(role==="driver"){
    c.innerHTML=`

      <label>License Front Photo</label>
      <input type="file" id="licenseFront" class="${inputClass}">

      <label>License Rear Photo</label>
      <input type="file" id="licenseRear" class="${inputClass}">

    `;
  }
}



// ================= REGISTER =================

async function register(){
  console.log("Register clicked");

  const role=document.getElementById("role").value;
  console.log(role);
  console.log(document.getElementById("email").value);

  const formData=new FormData();

  formData.append("role",role);
  formData.append("fullName",document.getElementById("fullName").value);
  formData.append("email",document.getElementById("email").value);
  formData.append("password",document.getElementById("password").value);
  const contactNumber = document.getElementById("phone").value;
  formData.append("phone", contactNumber);

  // FARMER
  if(role==="farmer"){
    formData.append("nic",document.getElementById("nic")?.value);
    formData.append("farmName",document.getElementById("farmName")?.value);
    formData.append("district",document.getElementById("district")?.value);
    formData.append("contactNumber", contactNumber);

    const file=document.getElementById("farmPhoto")?.files[0];
    if(file) formData.append("farmPhoto",file);
  }

  // SUPERMARKET
  if(role==="supermarket"){
    formData.append("businessName",document.getElementById("businessName")?.value);
    formData.append("businessType",document.getElementById("businessType")?.value);
    formData.append("brn",document.getElementById("brn")?.value);
    formData.append("address",document.getElementById("address")?.value);

    const file=document.getElementById("brnDoc")?.files[0];
    if(file) formData.append("brnDoc",file);
  }

  // DRIVER
  if(role==="driver"){

    formData.append("nic",document.getElementById("nic")?.value);
    formData.append("licenseNumber",document.getElementById("licenseNumber")?.value);
    formData.append("vehicleType",document.getElementById("vehicleType")?.value);
    formData.append("vehicleNumber",document.getElementById("vehicleNumber")?.value);
    formData.append("loadCapacityKg",document.getElementById("loadCapacityKg")?.value);
    formData.append("serviceDistrict",document.getElementById("serviceDistrict")?.value);
    formData.append("address",document.getElementById("address")?.value);

    const front=document.getElementById("licenseFront")?.files[0];
    const rear=document.getElementById("licenseRear")?.files[0];

    if(front) formData.append("licenseFront",front);
    if(rear) formData.append("licenseRear",rear);
  }

  const msg=document.getElementById("msg");
  msg.innerText="";
  msg.style.display="block";

  try{
    const res = await fetch(`${API}/auth/register`, {
      method: "POST",
      body: formData
    });

    const data = await res.json();

    if(!res.ok){
      msg.innerText = data.message || "Registration failed";
      return;
    }

    msg.innerText = "Registration submitted. Waiting for admin approval.";
    const loginBtn = document.getElementById("loginBtn");
    if (loginBtn) loginBtn.style.display = "block";
  }catch(err){
    msg.innerText = "Registration failed";
  }
}
