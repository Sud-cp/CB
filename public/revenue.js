fetch("/admin/revenue")
  .then(res => {
    if (res.status === 403) {
      window.location.href = "/admin-login.html";
      return;
    }
    return res.json();
  })
  .then(data => {
    if (!data) return;

    const div = document.getElementById("stats");

    div.innerHTML = `
      <h3>Total Revenue: ₹${data.totalRevenue}</h3>
      <h3>Today's Revenue: ₹${data.todayRevenue}</h3>
      <h3>This Month: ₹${data.monthRevenue}</h3>
      <h3>Total Orders: ${data.totalOrders}</h3>
    `;
  });

  function logout() {
  fetch("/admin/logout", { method: "POST" })
    .then(() => {
      window.location.href = "/admin-login.html";
    });
}
