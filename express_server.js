const express = require("express");
const bodyParser = require("body-parser");
const cookieParser = require('cookie-parser')
const PORT = 8080;
const bcrypt = require('bcrypt');


const app = express();

app.use(bodyParser.urlencoded({extended: true}));
app.set("view engine", "ejs");
app.use(cookieParser());

const urlDatabase = {
  "b2xVn2": {
    "url": "http://www.lighthouselabs.ca",
    "id": "userRandomID"
  },
  "9sm5xK": {
    "url": "http://www.google.com",
    "id": "user2RandomID"
  }
};

const users = {
  "userRandomID": {
    id: "userRandomID",
    email: "user@example.com",
    password: "purple-monkey-dinosaur"
  },
 "user2RandomID": {
    id: "user2RandomID",
    email: "user2@example.com",
    password: "dishwasher-funk"
  }
};

let userCount = 2;

function generateRandomString() {
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let randomString = "";
  for (let i = 0; i < 6; i++) {
    randomString += alphabet[Math.floor(Math.random()*62)];
  }
  return randomString;
}

function urlsForUser(id) {
  const filteredDatabase = {};
  for (let shortURL in urlDatabase) {
    if (id === urlDatabase[shortURL]["id"]) {
      filteredDatabase[shortURL] = urlDatabase[shortURL];
    }
  }
  return filteredDatabase;
}


app.get("/", (req, res) => {
  res.send("<html><body><center>Welcome<center/></body></html>\n");
});

app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

app.get("/urls", (req, res) => {
  const filteredUrlDatabase = urlsForUser(req.cookies["user_id"]);
  let templateVars = { urls: filteredUrlDatabase, user_id: req.cookies["user_id"], user: users[req.cookies["user_id"]]};
  res.render("urls_index", templateVars);
});

app.post("/urls", (req, res) => {
  let randomName = generateRandomString();
  urlDatabase[randomName] = {
    url: req.body.longURL,
    id: req.cookies["user_id"]
  };
  res.redirect(`/urls`);
});

app.get("/register", (req, res) => {
  res.render("urls_register");
});

app.post("/register", (req, res) => {
  let newEmail = true;
  for (let userID in users) {
    if ( users[userID]["email"] === req.body["email"]) {
      newEmail = false;
    }
  }
  if (!newEmail || !req.body["email"] || !req.body["password"]) {
    res.status(400).send('All fields must be filled in! \n Can\'t reuse your email');
  } else {
    userCount++;
    users[`user${userCount}RandomID`] = { id: `user${userCount}RandomID`,
                                          email: req.body["email"],
                                          password: bcrypt.hashSync(req.body["password"], 10)
                                        }
    console.log(users);
    res.cookie ("user_id",`user${userCount}RandomID`);
    res.redirect("/urls");
  }
});

app.get("/login", (req, res) => {
  res.render("urls_login");
});

app.post("/login", (req, res) => {
  let user;
  let passward;
  for (let userID in users) {
    if ( users[userID]["email"] === req.body["email"]) {
      user = userID;
    }
  }
  if (!user) {
    res.status(403).send('Cannot find the email');
  } else {
    if (bcrypt.compareSync(req.body["password"], users[user]["password"])) {
        res.cookie ("user_id", user);
        res.redirect(`/`);
    } else {
      res.status(403).send('Incorrect password');
    }
  }
});

app.post("/logout", (req, res) => {
  res.clearCookie ("user_id");
  console.log(users)
  res.redirect(`/urls`);
});

app.post("/urls/:id/delete", (req, res) => {
  if(urlDatabase[req.params.id]["id"] === req.cookies["user_id"]) {
    delete urlDatabase[req.params.id];
    res.redirect(`/urls`);
  } else {
    res.status(403).send('Not your url');
  }
});

app.post("/urls/:id/update", (req, res) => {
  urlDatabase[req.params.id]["url"] = req.body["longURL"];
  res.redirect(`/urls`);
});

app.get("/urls/new", (req, res) => {
  if (!req.cookies["user_id"]) {
    res.redirect("/login");
  } else {
    let templateVars = { user_id: req.cookies["user_id"], user: users[req.cookies["user_id"]]};
    res.render("urls_new", templateVars);
}
});

app.get("/u/:shortURL", (req, res) => {
  res.redirect(urlDatabase[req.params.shortURL])
});

app.get("/urls/:id", (req, res) => {
  if(urlDatabase[req.params.id]["id"] === req.cookies["user_id"]) {
    let longUrl = urlDatabase[req.params.id]["url"];
    let templateVars = { shortURL: req.params.id, longURL: longUrl, user_id: req.cookies["user_id"], user: users[req.cookies["user_id"]]};
    res.render("urls_show", templateVars);
  } else {
    res.status(403).send('Cannot edit, not your url');
  }
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});


