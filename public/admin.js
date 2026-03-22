fetch("/orders")
  .then(res => {
    if (res.status === 403) {
      window.location.href = "/admin-login.html";
      return;
    }
    return res.json();
  })
  .then(data => {
    if (!data) return;

    const ordersDiv = document.getElementById("orders");
    ordersDiv.innerHTML = "";

    data.forEach(order => {
      const card = document.createElement("div");
      card.className = "card";

      const itemsList = order.items
        .map(i => `${i.name} x ${i.qty}`)
        .join("<br>");

      card.innerHTML = `
        <h3>Order ID: ${order._id}</h3>
        <p>${itemsList}</p>
        <p>Total: ₹${order.totalAmount}</p>
        <p>Status: <b>${order.status}</b></p>

        <button onclick="updateStatus('${order._id}', 'accepted')">Accept</button>
        <button onclick="updateStatus('${order._id}', 'out_for_delivery')">🚴 Out for delivery</button>
        <button onclick="updateStatus('${order._id}', 'declined')">Decline</button>
        <button onclick="updateStatus('${order._id}', 'delivered')">Delivered</button>
      `;

      ordersDiv.appendChild(card);
    });
  });


orders.forEach(order => {
  const card = document.createElement("div");
  card.className = "order-card";

  let buttonsHTML = "";

  // ❗ Only show buttons if NOT cancelled
  if (order.status !== "cancelled") {
    buttonsHTML = `
      <button onclick="updateStatus('${order._id}', 'accepted')">🍳 Accept</button>
      <button onclick="updateStatus('${order._id}', 'out_for_delivery')">🚴 Out for delivery</button>
      <button onclick="updateStatus('${order._id}', 'delivered')">✅ Delivered</button>
      <button onclick="updateStatus('${order._id}', 'declined')">❌ Decline</button>
    `;
  }

  card.innerHTML = `
    <h3>Order ID: ${order._id}</h3>
    <p><b>Status:</b> ${order.status}</p>
    <p><b>Address:</b> ${order.address || "Not provided"}</p>
    ${buttonsHTML}
  `;

  div.appendChild(card);
});


function updateStatus(id, status) {
  fetch(`/orders/${id}/status`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status })
  })
  .then(res => res.json())
  .then(() => loadOrders());
}


function logout() {
  fetch("/admin/logout", {
    method: "POST"
  })
  .then(() => {
    window.location.href = "/admin-login.html";
  });
}
