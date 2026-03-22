fetch("/orders")
  .then(res => {
    if (res.status === 403) {
      window.location.href = "/admin-login.html";
      return;
    }
    return res.json();
  })
  .then(() => {
    loadMenu();
  });

function loadMenu() {
  fetch("/menu")
    .then(res => res.json())
    .then(data => {
      const div = document.getElementById("menuList");
      div.innerHTML = "";

      data.forEach(item => {
        const row = document.createElement("div");

        row.innerHTML = `
          ${item.name} - ₹${item.price} - ${item.inStock ? "In Stock" : "Out of Stock"}
          <button onclick="toggleStock('${item._id}', ${item.inStock})">Toggle Stock</button>
          <button onclick="deleteItem('${item._id}')">Delete</button>
        `;

        div.appendChild(row);
      });
    });
}


function addItem() {
  const name = document.getElementById("name").value;
  const price = Number(document.getElementById("price").value);
  const image = document.getElementById("image").value;

  fetch("/admin/menu", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, price, image })
  })
  .then(() => loadMenu());
}

function toggleStock(id, currentStock) {
  fetch(`/admin/menu/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ inStock: !currentStock })
  })
  .then(() => loadMenu());
}

function deleteItem(id) {
  fetch(`/admin/menu/${id}`, {
    method: "DELETE"
  })
  .then(() => loadMenu());
}

loadMenu();

function logout() {
  fetch("/admin/logout", { method: "POST" })
    .then(() => {
      window.location.href = "/admin-login.html";
    });
}
