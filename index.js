const bcrypt = require("bcrypt");

const ADMIN = {
  username: "admin",
  passwordHash: "$2b$10$sn2jXym8DWHjRKIKmTKpuOx./6lzJ9dglkRlq2Gf6/iWifMdYO.Su"
};


const session = require("express-session");


const mongoose = require("mongoose");

mongoose.connect(
  "mongodb+srv://tanmayg3011:tanmayg3011@cafebackyard.n07vpdz.mongodb.net/cafebackyard?retryWrites=true&w=majority",
  {
    serverSelectionTimeoutMS: 5000
  }
)
.then(() => {
  console.log("MongoDB connected");
})
.catch(err => {
  console.error("MongoDB connection FAILED:");
  console.error(err.message);
});

const orderSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  },
  items: [
    {
      name: String,
      price: Number,
      qty: Number
    }
  ],
  address: String,
  totalAmount: Number,
  status: {
    type: String,
    default: "pending"
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});


const menuSchema = new mongoose.Schema({
  name: String,
  price: Number,
  inStock: {
    type: Boolean,
    default: true
  },
  image: {
    type: String,
    default: ""
  }
});

const offerSchema = new mongoose.Schema({
  title: String,
  description: String,
  price: Number,
  image: {
    type: String,
    default: ""
  }
});

const userSchema = new mongoose.Schema({
  username: { type: String, unique: true },
  password: String
});


const User = mongoose.model("User", userSchema);

const Offer = mongoose.model("Offer", offerSchema);

const MenuItem = mongoose.model("MenuItem", menuSchema);

const Order = mongoose.model("Order", orderSchema);


const express = require("express");
const app = express();

// middleware to read JSON body
app.use(express.json());

app.use(session({
  secret: "cafebackyard_secret_key",
  resave: false,
  saveUninitialized: false
}));


const path = require("path");

// ---------------- CANCEL ORDER (USER) ----------------

app.patch("/orders/:id/cancel", requireUser, async (req, res) => {
  console.log("Cancel route hit");

  const order = await Order.findById(req.params.id);

  if (!order) return res.status(404).json({ error: "Order not found" });

  if (order.status !== "pending") {
    return res.status(400).json({ error: "Order cannot be cancelled now" });
  }

  order.status = "cancelled";
  await order.save();

  res.json({ message: "Order cancelled" });
});

app.patch("/testcancel", (req, res) => {
  res.json({ message: "Test route works" });
});

function requireAdmin(req, res, next) {
  if (req.session.isAdmin) {
    next();
  } else {
    res.status(403).json({ error: "Admin access required" });
  }
}


// ---------------- ORDERS DATA ----------------


// // home
// app.get("/", (req, res) => {
//   res.send("Cafe Backyard backend is live!");
// });

app.get("/menu", async (req, res) => {
  const items = await MenuItem.find();
  res.json(items);
});


// ---------------- CREATE ORDER (USER) ----------------
app.post("/orders", requireUser, async (req, res) => {
  try {
    const { items, address } = req.body;

    if (!items || items.length === 0) {
      return res.status(400).json({ error: "No items in order" });
    }

    if (!address || address.trim() === "") {
      return res.status(400).json({ error: "Delivery address required" });
    }

    let totalAmount = 0;
    items.forEach(item => {
      totalAmount += item.price * item.qty;
    });

    const newOrder = new Order({
      userId: req.session.userId,   // 👈 link order to user
      items,
      address,                      // 👈 save address
      totalAmount,
      status: "pending"
    });

    await newOrder.save();

    res.status(201).json({
      message: "Order placed successfully",
      order: newOrder
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});


// ---------------- GET ALL ORDERS (admin) ----------------
app.get("/orders", requireAdmin, async (req, res) => {
  const orders = await Order.find().sort({ createdAt: -1 });
  res.json(orders);
});

// ---------------- UPDATE ORDER STATUS (ADMIN) ----------------
app.patch("/orders/:id/status", requireAdmin, async (req, res) => {
  const { status } = req.body;

  const validStatuses = [
    "pending",
    "accepted",
    "out_for_delivery",
    "delivered",
    "declined",
    "cancelled"
  ];

  if (!validStatuses.includes(status)) {
    return res.status(400).json({ error: "Invalid status" });
  }

  const order = await Order.findById(req.params.id);
  if (!order) return res.status(404).json({ error: "Order not found" });

  // 🔴 BLOCK admin if user cancelled
  if (order.status === "cancelled") {
    return res.status(400).json({ error: "Order already cancelled by user" });
  }

  order.status = status;
  await order.save();

  res.json({ message: "Order status updated", order });
});




// ---------------- Admin Login (ADMIN) ----------------
app.post("/admin/login", async (req, res) => {
  const { username, password } = req.body;

  if (username !== ADMIN.username) {
    return res.status(401).json({ error: "Invalid credentials" });
  }

  const match = await bcrypt.compare(password, ADMIN.passwordHash);

  if (!match) {
    return res.status(401).json({ error: "Invalid credentials" });
  }

  req.session.isAdmin = true;
  res.json({ message: "Login successful" });
});

// ---------------- Admin logout (ADMIN) ----------------
app.post("/admin/logout", (req, res) => {
  req.session.destroy(() => {
    res.json({ message: "Logged out" });
  });
});

// ---------------- MENU CHANGE (ADMIN) ----------------
app.post("/admin/menu", requireAdmin, async (req, res) => {
  const { name, price, image } = req.body;

  const item = new MenuItem({
    name,
    price,
    image: image || "",
    inStock: true
  });

  await item.save();
  res.json(item);
});


// ---------------- UPDATE DISH (ADMIN) ----------------
app.patch("/admin/menu/:id", requireAdmin, async (req, res) => {
  const { price, inStock } = req.body;

  const item = await MenuItem.findById(req.params.id);
  if (!item) return res.status(404).json({ error: "Item not found" });

  if (price !== undefined) item.price = price;
  if (inStock !== undefined) item.inStock = inStock;

  await item.save();
  res.json(item);
});

// ---------------- DELETE DISH (ADMIN) ----------------
app.delete("/admin/menu/:id", requireAdmin, async (req, res) => {
  await MenuItem.findByIdAndDelete(req.params.id);
  res.json({ message: "Item deleted" });
});

// ---------------- REVENUE (ADMIN) ----------------
app.get("/admin/revenue", requireAdmin, async (req, res) => {
  const orders = await Order.find({ status: "delivered" });

  let totalRevenue = 0;
  let todayRevenue = 0;
  let monthRevenue = 0;

  const now = new Date();

  orders.forEach(order => {
    totalRevenue += order.totalAmount;

    const orderDate = new Date(order.createdAt);

    if (orderDate.toDateString() === now.toDateString()) {
      todayRevenue += order.totalAmount;
    }

    if (
      orderDate.getMonth() === now.getMonth() &&
      orderDate.getFullYear() === now.getFullYear()
    ) {
      monthRevenue += order.totalAmount;
    }
  });

  res.json({
    totalRevenue,
    todayRevenue,
    monthRevenue,
    totalOrders: orders.length
  });
});

// ---------------- GET OFFER ----------------
app.get("/offers", async (req, res) => {
  const offers = await Offer.find();
  res.json(offers);
});

// ---------------- ADD OFFER (ADMIN) ----------------
app.post("/admin/offers", requireAdmin, async (req, res) => {
  const { title, description, price, image } = req.body;

  const offer = new Offer({
    title,
    description,
    price,
    image: image || ""
  });

  await offer.save();
  res.json(offer);
});

// ---------------- DELETE OFFER (ADMIN) ----------------
app.delete("/admin/offers/:id", requireAdmin, async (req, res) => {
  await Offer.findByIdAndDelete(req.params.id);
  res.json({ message: "Offer deleted" });
});

// ---------------- REGISTER ----------------
app.post("/register", async (req, res) => {
  const { username, password } = req.body;

  // check if user already exists
  const existingUser = await User.findOne({ username });
  if (existingUser) {
    return res.status(400).json({ error: "Username already exists" });
  }

  const hash = await bcrypt.hash(password, 10);

  const user = new User({
    username,
    password: hash
  });

  await user.save();

  res.json({ message: "Registered successfully" });
});


// ---------------- login ----------------
app.post("/login", async (req, res) => {
  const { username, password } = req.body;

  const user = await User.findOne({ username });
  if (!user) return res.status(401).json({ error: "Invalid credentials" });

  const match = await bcrypt.compare(password, user.password);
  if (!match) return res.status(401).json({ error: "Invalid credentials" });

  req.session.userId = user._id;
  res.json({ message: "Login successful" });
});

// ---------------- LOGOUT ----------------
app.post("/logout", (req, res) => {
  req.session.destroy(() => {
    res.json({ message: "Logged out" });
  });
});

// ---------------- protect order ----------------
function requireUser(req, res, next) {
  if (req.session.userId) next();
  else res.status(401).json({ error: "Login required" });
}

// ---------------- TRACK ----------------
app.get("/myorders", requireUser, async (req, res) => {
  const orders = await Order.find({ userId: req.session.userId }).sort({ createdAt: -1 });
  res.json(orders);
});

app.use(express.static(path.join(__dirname, "public")));

// start server
const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
