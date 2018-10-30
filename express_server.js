var express = require("express");
var app = express();
var PORT = 8080;
const bodyParser = require("body-parser");
app.use(bodyParser.urlencoded({extended: true}));

app.set("view engine", "ejs");

var urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};


function generateRandomString() {
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".toLowerCase();
  let randomString = "";

  for (let i = 0; i < 6; i++) {
    randomString += alphabet[Math.floor(Math.random()*26)];
  }
  return randomString;
}

app.get("/", (req, res) => {
  res.send("Hello!");
});

app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

app.get("/hello", (req, res) => {
  res.send("<html><body>Hello <b>ßWorld</b></body></html>\n");
});

app.get("/urls", (req, res) => {
  let templateVars = { urls: urlDatabase };
  res.render("urls_index", templateVars);
});

app.post("/urls/", (req, res) => {
  var randomName = generateRandomString();
  urlDatabase[randomName] = req.body["longURL"];
  console.log(urlDatabase);
  res.redirect(`urls/${randomName}`);
});


app.get("/urls/new", (req, res) => {
  let longUrl = urlDatabase[req.params.id];
  let templateVars = { shortURL: req.params.id, longURL: longUrl};
  res.render("urls_new", templateVars);
});

app.get("/urls/:id", (req, res) => {
  let longUrl = urlDatabase[req.params.id];
  let templateVars = { shortURL: req.params.id, longURL: longUrl};
  res.render("urls_show", templateVars);
});





app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});


