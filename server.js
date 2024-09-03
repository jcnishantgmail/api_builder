const express = require("express");
var cors = require("cors");
let http = require("http");
var bcrypt = require('bcrypt');
const app = express();
app.use(cors());
app.use(express.json());

app.use(express.urlencoded({ extended: true }));
//server static files
app.use(express.static("public"));

//Adding Middleware for authenticate request
app.use("/", require("./app/middleware/auth"));
app.use('/', require("./app/middleware/responseTimeMiddleware"))

const db = require("./app/models");

let routes = require("./app/routes");



db.mongoose.set("strictQuery", false);
db.mongoose
  .connect(db.url, {})
  .then(() => {
    console.log("Connected to the database!");
  })
  .catch((err) => {
    console.log("Cannot connect to the database!", err);
    process.exit();
  });

// simple route
app.get("/", (req, res) => {
  res.json({ message: "Welcome to  SafeSpots application." });
});

app.use("/", routes);
let rolesData = [
  { name: "Admin", loginPortal: "admin", permissions: [], },
  { name: "User", loginPortal: "front", permissions: [], }
]

let usersData = [{ fullName: "Builder Admin", password: "Jc@12345", email: "builder_admin@yopmail.com", role: "", status: "active", isVerified: "Y" }]
const seedDb = async () => {
  if (await db.roles.countDocuments() == 0) {
    await db.roles.insertMany(rolesData)
  }


  if (await db.users.countDocuments() == 0) {
    let adminRole=await db.roles.findOne({name:"Admin"})
    if(adminRole){
      for await (let itm of usersData) {
        itm.password = await bcrypt.hashSync(
          itm.password,
          bcrypt.genSaltSync(10)
        )
        itm['role']=adminRole._id
  
        await db.users.create(itm)
      }
    }
    
  }
}
seedDb()
// set port, listen for requests
const PORT = process.env.PORT || 6083;

let startServer = http.createServer(app);
startServer.listen(PORT, function () {
  console.log(`Server is running on port ${PORT}.`);
});
module.exports = app;
