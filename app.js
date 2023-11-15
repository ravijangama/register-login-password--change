const express = require("express");
const sqlite3 = require("sqlite3");
const { open } = require("sqlite");
const path = require("path");
const bcrypt = require("bcrypt");
const dbPath = path.join(__dirname, "userData.db");
let DB = null;
const app = express();
app.use(express.json());
const initializeDBAndServer = async () => {
  try {
    DB = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => console.log("Server Is Running @3000"));
  } catch (e) {
    console.log(`DB Error: ${e.message}`);
    process.exit(1);
  }
};
initializeDBAndServer();
//Registering User API 1
app.post("/register", async (request, response) => {
  const { username, name, password, gender, location } = request.body;
  const hashedPWD = await bcrypt.hash(password, 10);
  const userQuery = `
      SELECT 
           *
       FROM 
          user 
       WHERE 
          username LIKE "${username}";`;
  const DBUser = await DB.get(userQuery);
  if (DBUser === undefined) {
    if (password.length < 5) {
      response.status(400);
      response.send("Password is too short");
    } else {
      const createUserQuery = `
            INSERT INTO 
                    user(username,name,password,gender,location)
            VALUES(
                "${username}",
                "${name}",
                "${hashedPWD}",
                "${gender}",
                "${location}"
            );`;
      await DB.run(createUserQuery);
      response.send("User created successfully");
    }
  } else {
    response.status(400);
    response.send("User already exists");
  }
});
//Login API 2
app.post("/login", async (request, response) => {
  const { username, password } = request.body;
  const userQuery = `
      SELECT 
           *
       FROM 
          user 
       WHERE 
          username LIKE "${username}";`;
  const DBUser = await DB.get(userQuery);
  if (DBUser === undefined) {
    response.status(400);
    response.send("Invalid user");
  } else {
    const isPwdMatched = await bcrypt.compare(password, DBUser.password);
    if (isPwdMatched === true) {
      response.send("Login success!");
    } else {
      response.status(400);
      response.send("Invalid password");
    }
  }
});
//Change-PassWd API 3
app.put("/change-password", async (request, response) => {
  const { username, oldPassword, newPassword } = request.body;
  const userQuery = `
      SELECT 
           *
       FROM 
          user 
       WHERE 
          username LIKE "${username}";`;
  const DBUser = await DB.get(userQuery);
  const hashedPwd = await bcrypt.hash(newPassword, 10);
  const isPwdMatched = await bcrypt.compare(oldPassword, DBUser.password);
  if (DBUser === undefined) {
    response.status(400);
    response.send("Invalid user");
  } else {
    if (isPwdMatched) {
      if (newPassword.length >= 5) {
        const updateQuery = `
          UPDATE 
              user
          SET 
             password="${hashedPwd}";`;
        await DB.run(updateQuery);
        response.send("Password updated");
      } else {
        response.status(400);
        response.send("Password is too short");
      }
    } else {
      response.status(400);
      response.send("Invalid current password");
    }
  }
});
module.exports = app;
