// server.js
require("dotenv").config();
const express = require("express");
const cors = require("cors");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");

const app = express();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// MongoDB URI (from env)

const user = process.env.USER_NAME || '';
const pass = encodeURIComponent((process.env.USER_PASS || '').trim());
const uri = `mongodb+srv://${user}:${pass}@cluster0.5rsc2du.mongodb.net/?appName=Cluster0`;

// Mongo client setup
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    // await client.connect();
    const db = client.db("pc_store_db");
    const productCollection = db.collection("product");

    const fetchProducts = async (filter = {}) =>
      await productCollection.find(filter).sort({ createdAt: -1 }).toArray();

    app.get("/", (req, res) => res.send("PC Store API is running"));

    app.get("/product", async (req, res) => {
      const { email } = req.query;
      const filter = {};
      if (email) filter["submitterEmail"] = email;
      const products = await fetchProducts(filter);
      res.send(products);
    });

    app.get("/Product", async (req, res) => {
      return app._router.handle(req, res, () => {}, "get", "/product");
    });

    app.get("/product/:id", async (req, res) => {
      const { id } = req.params;
      const _id = new ObjectId(id);
      const result = await productCollection.findOne({ _id });
      if (!result)
        return res
          .status(404)
          .send({ success: false, error: "Product not found" });
      res.send({ success: true, result });
    });

    app.post("/product", async (req, res) => {
      try {
        const body = req.body || {};

        const title = (body.title || "").toString().trim();
        const shortDesc = (body.shortDesc || "").toString().trim();
        const fullDesc = (body.fullDesc || "").toString().trim();
        const price = Number(body.price);
        const image = (body.image || "").toString().trim() || null;
        const submitterName =
          (body.submitterName || "").toString().trim() || null;
        const submitterEmail =
          (body.submitterEmail || "").toString().trim() || null;
        const doc = {
          title,
          shortDesc,
          fullDesc,
          price,
          image: image || null,
          submitterName,
          submitterEmail,
          createdAt: body.createdAt ? new Date(body.createdAt) : new Date(),
        };

        const result = await productCollection.insertOne(doc);
        res
          .status(201)
          .send({
            success: true,
            insertedId: result.insertedId,
            message: "Product created",
          });
      } catch (err) {
        console.error("POST /product error:", err);
        res.status(500).send({ success: false, error: err.message });
      }
    });

    app.post("/Product", async (req, res) => {
      return app._router.handle(req, res, () => {}, "post", "/product");
    });

    app.delete("/product/:id", async (req, res) => {
      const { id } = req.params;
      const _id = new ObjectId(id);
      const result = await productCollection.deleteOne({ _id });
      if (result.deletedCount === 1)
        return res.send({ success: true, message: "Deleted successfully" });
      return res
        .status(404)
        .send({ success: false, message: "Product not found" });
    });

    app.get("/search", async (req, res) => {
      const search_text = req.query.search || "";

      const cursor = await productCollection
        .find({ title: { $regex: search_text, $options: "i" } })
        .limit(50)
        .toArray();
      res.send(cursor);
    });

    //     const limit = Math.min(Number(req.query.limit) || 6, 100);
    //     const result = await productCollection.find().sort({ createdAt: -1 }).limit(limit).toArray();
    //     res.send(result);

    // });

    console.log("Connected to MongoDB and routes are configured.");
  } finally{
    // await client.close
  }
}

run().catch(console.dir);

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
