const express = require("express");
const cors = require("cors");
require("dotenv").config();



const authRoutes = require("./routes/route");
const app = express();
const port = process.env.PORT;

// app.use(express.json({ limit: '50mb' }));
// app.use(express.urlencoded({ extended: true, limit: '50mb' }));


app.use(cors());
app.use(express.json());


app.use("/api", authRoutes);


app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
