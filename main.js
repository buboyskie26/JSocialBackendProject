const { Client } = require("pg");

const express = require("express");

const app = express();

app.use(express.json());

const con = new Client({
  host: "localhost",
  user: "postgres",
  port: 5432,
  password: "Password1234567",
  database: "postgres",
});

con.connect().then(() => console.log("connected"));

app.post("/postData", (req, res) => {
  //   console.log(res);q
  //
  const { name, id } = req.body;

  const insert_query = "INSERT INTO demo_table (name, id) VALUES ($1,$2)";

  con.query(insert_query, [name, id], (err, result) => {
    //
    if (err) {
      console.log(err);
      res.send(err);
    } else {
      console.log(result);
      res.send("POSTED DATA");
    }
    //
  });
  //
});

app.get("/fetchData", (req, res) => {
  const fetch_query = "SELECT * FROM demo_table";

  con.query(fetch_query, (err, result) => {
    if (err) {
      res.send(err);
    } else {
      res.send(result.rows);
    }
  });
});

app.listen(3000, () => {
  console.log("Server is running on port 3000");
});
