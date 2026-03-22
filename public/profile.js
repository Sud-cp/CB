fetch("/myorders")
  .then(res => {
    if (!res.ok) {
      window.location.href = "/login.html";
      return;
    }
    return res.json();
  })
  .then(orders => {
    const div = document.getElementById("orders");
    div.innerHTML = "";

    if (orders.length === 0) {
      div.innerHTML = "<p>No orders yet.</p>";
      return;
    }

    orders.forEach(order => {
      let statusText = "⏳ Pending";

if (order.status === "accepted")
  statusText = "🍳 Food is being prepared";
else if (order.status === "out_for_delivery")
  statusText = "🚴 Out for delivery";
else if (order.status === "delivered")
  statusText = "✅ Delivered";
else if (order.status === "declined")
  statusText = "❌ Order Declined";
else if (order.status === "cancelled")
  statusText = "🚫 Order Cancelled";



      const card = document.createElement("div");
      card.className = "order-card";

      let cancelBtn = "";

if (order.status === "pending") {
  cancelBtn = `<button onclick="cancelOrder('${order._id}')">❌ Cancel Order</button>`;
}

card.innerHTML = `
  <h3>Order ID: ${order._id}</h3>
  <p><b>Status:</b> ${statusText}</p>
  <p><b>Address:</b> ${order.address}</p>
  <p><b>Total:</b> ₹${order.totalAmount}</p>
  <p><b>Items:</b></p>
  <ul>
    ${order.items.map(i => `<li>${i.name} x ${i.qty}</li>`).join("")}
  </ul>
  ${cancelBtn}
`;


      div.appendChild(card);
    });
  });

function logout() {
  fetch("/logout", { method: "POST" })
    .then(() => window.location.href = "/login.html");
}

// function cancelOrder(id) {
//   if (!confirm("Are you sure you want to cancel this order?")) return;

//   fetch(`/orders/${id}`, {
//     method: "DELETE"
//   })
//   .then(res => res.json())
//   .then(data => {
//     if (data.error) {
//       alert(data.error);
//     } else {
//       alert("Order cancelled");
//       location.reload();
//     }
//   });
// }
function cancelOrder(id) {
    console.log("Cancel clicked for:", id);
  if (!confirm("Are you sure you want to cancel this order?")) return;

  fetch(`/orders/${id}/cancel`, {
    method: "PATCH"
  })
  .then(res => res.json())
  .then(data => {
    console.log(data); // DEBUG
    alert(data.message || data.error);
    location.reload();
  })
  .catch(err => console.error(err));
}

