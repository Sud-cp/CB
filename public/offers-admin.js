fetch("/orders")
  .then(res => {
    if (res.status === 403) {
      window.location.href = "/admin-login.html";
      return;
    }
    loadOffers();
  });

function loadOffers() {
  fetch("/offers")
    .then(res => res.json())
    .then(data => {
      const div = document.getElementById("offersList");
      div.innerHTML = "";

      data.forEach(offer => {
        const card = document.createElement("div");
        card.className = "card";

        let img = "";
        if (offer.image && offer.image.trim() !== "") {
          img = `<img src="${offer.image}" class="food-img">`;
        }

        card.innerHTML = `
          ${img}
          <h3>${offer.title}</h3>
          <p>${offer.description}</p>
          <strong>₹${offer.price}</strong>
          <button onclick="deleteOffer('${offer._id}')">Delete</button>
        `;

        div.appendChild(card);
      });
    });
}

function addOffer() {
  const title = document.getElementById("title").value;
  const description = document.getElementById("description").value;
  const price = Number(document.getElementById("price").value);
  const image = document.getElementById("image").value;

  fetch("/admin/offers", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ title, description, price, image })
  })
  .then(() => loadOffers());
}

function deleteOffer(id) {
  fetch(`/admin/offers/${id}`, {
    method: "DELETE"
  })
  .then(() => loadOffers());
}

function logout() {
  fetch("/admin/logout", { method: "POST" })
    .then(() => window.location.href = "/admin-login.html");
}
