// load cart from localStorage
let cart = JSON.parse(localStorage.getItem("cart")) || [];

// save cart
function saveCart() {
  localStorage.setItem("cart", JSON.stringify(cart));
}

// fetch menu
let allMenuItems = [];

// fetch menu
fetch("/menu")
  .then(res => res.json())
  .then(data => {
    allMenuItems = data;
    renderMenu(allMenuItems);
  });

function renderMenu(items) {
  const menuDiv = document.getElementById("menu");
  menuDiv.innerHTML = "";

  items.forEach(item => {
    const card = document.createElement("div");
    card.className = "card";

    let imageHTML = "";
    if (item.image && item.image.trim() !== "") {
      imageHTML = `<img src="${item.image}" class="food-img">`;
    }

    card.innerHTML = `
      ${imageHTML}
      <h3>${item.name}</h3>
      <p>₹${item.price}</p>
      <p>${item.inStock ? "Available" : "Out of Stock"}</p>
      <button ${!item.inStock ? "disabled" : ""}>Add to Cart</button>
    `;

    card.querySelector("button").onclick = () => addToCart(item);
    menuDiv.appendChild(card);
  });
}


function addToCart(item) {
  const existing = cart.find(i => i.name === item.name);

  if (existing) {
    existing.qty += 1;
  } else {
    cart.push({
      name: item.name,
      price: item.price,
      qty: 1
    });
  }

  saveCart();
  renderCart();
}

function renderCart() {
  const cartDiv = document.getElementById("cart");
  cartDiv.innerHTML = "";

  let total = 0;

  cart.forEach((item, index) => {
    total += item.price * item.qty;

    const row = document.createElement("div");
    row.className = "cart-item";

    row.innerHTML = `
  <div class="cart-left">
    <strong>${item.name}</strong>
    <div class="qty-controls">
      <button onclick="decreaseQty(${index})">−</button>
      <span>${item.qty}</span>
      <button onclick="increaseQty(${index})">+</button>
    </div>
  </div>

  <div class="cart-right">
    <span class="price">₹${item.price * item.qty}</span>
  </div>
`;


    cartDiv.appendChild(row);
  });

  document.getElementById("total").innerText = total;
}


renderCart();

function increaseQty(index) {
  cart[index].qty += 1;
  saveCart();
  renderCart();
}
const searchInput = document.getElementById("searchInput");

searchInput.addEventListener("input", () => {
  const query = searchInput.value.toLowerCase();

  const filteredItems = allMenuItems.filter(item =>
    item.name.toLowerCase().includes(query)
  );

  renderMenu(filteredItems);
});


function decreaseQty(index) {
  if (cart[index].qty > 1) {
    cart[index].qty -= 1;
  } else {
    cart.splice(index, 1); // remove item if qty becomes 0
  }
  saveCart();
  renderCart();
}

function removeItem(index) {
  cart.splice(index, 1);
  saveCart();
  renderCart();
}


function placeOrder() {
  const address = document.getElementById("address").value;

  if (!address || address.trim() === "") {
    alert("Please enter delivery address");
    return;
  }

  if (cart.length === 0) {
    alert("Cart is empty");
    return;
  }

  fetch("/orders", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      items: cart,
      address: address
    })
  })
  .then(res => {
    if (!res.ok) {
      return res.json().then(err => { throw err; });
    }
    return res.json();
  })
  .then(data => {
    alert("Order placed!");
    cart = [];
    saveCart();
    window.location.href = "/track.html";
  })
  .catch(err => {
    alert(err.error || "You must login first");
    window.location.href = "/login.html";
  });
}

function logout() {
  fetch("/logout", { method: "POST" })
    .then(() => {
      window.location.href = "/login.html";
    });
}
fetch("/myorders")
  .then(res => {
    if (res.ok) {
      // user is logged in
      document.getElementById("loginLink").style.display = "none";
      document.getElementById("logoutLink").style.display = "inline";
    }
  })
  .catch(() => {});

document.getElementById("orderBtn").addEventListener("click", placeOrder);
