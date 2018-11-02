const express = require("express");
const bodyParser = require("body-parser");
const cookieSession = require('cookie-session')
const bcrypt = require('bcrypt');
const PORT = 8080;


//add secure passowrds and cookies to my dependecies

const app = express();

app.use(bodyParser.urlencoded({extended: true}));
app.set("view engine", "ejs");
app.use(cookieSession({
  name: 'session',
  keys: ["123"],
  maxAge: 24 * 60 * 60 * 1000
}))

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
  if(!req.session.user_id) {
    res.redirect(`/login`)
  } else {
    res.redirect(`/urls`);
  }
});

app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

app.get("/urls", (req, res) => {
  const filteredUrlDatabase = urlsForUser(req.session.user_id);
  let templateVars = { urls: filteredUrlDatabase, user_id: req.session.user_id, user: users[req.session.user_id]};
  res.render("urls_index", templateVars);
});

app.post("/urls", (req, res) => {
  if (!req.session.user_id) {
    res.send("You are not logged in")
  } else {
    let randomName = generateRandomString();
    urlDatabase[randomName] = {
      url: req.body.longURL,
      id: req.session.user_id
    };
    res.redirect(`/urls/${randomName}`);
  }
});

//this was checked
app.get("/register", (req, res) => {
  if (!req.session.user_id) {
    res.render("urls_register");
  } else {
    res.redirect("/urls");
  }
});

//this was checked
app.post("/register", (req, res) => {
  let newEmail = true;
  for (let userID in users) {
    if ( users[userID]["email"] === req.body["email"]) {
      newEmail = false;
    }
  }
  if (!req.body["email"]|| !req.body["password"]) {
    res.status(400).send('<html><body><center><br/><br/>PLEASE PROVIDE BOTH: PASSWORD AND EMAIL<center></body></html>\n');
  } else if (!newEmail) {
    res.status(400).send('<html><body><center><br/><br/>YOU ALREADY HAVE AN ACCOUNT WITH US,  PLEASE LOG IN<center></body></html>\n');
  } else {
    userCount++;
    users[`user${userCount}RandomID`] = { id: `user${userCount}RandomID`,
                                          email: req.body["email"],
                                          password: bcrypt.hashSync(req.body["password"], 10)
                                        }
    console.log(users);
    req.session.user_id = `user${userCount}RandomID`;
    res.redirect("/urls");
  }
});

//this was checked
app.get("/login", (req, res) => {
  if (!req.session.user_id) {
    res.render("urls_login");
  } else {
    res.redirect("/urls");
  }
});

//this was checked
app.post("/login", (req, res) => {
  let user;
  let passward;
  for (let userID in users) {
    if ( users[userID]["email"] === req.body["email"]) {
      user = userID;
    }
  }
  if (!user) {
    res.status(403).send('<html><body><center><br/><br/> PROVIDED EMAIL IS NOT REGISTERED<center></body></html>\n');
  } else {
    if (bcrypt.compareSync(req.body["password"], users[user]["password"])) {
        req.session.user_id = user;
        res.redirect(`/urls`);
    } else {
      res.status(403).send('<html><body><center><br/><br/> INCORRECT PASSWORD<center></body></html>\n');
    }
  }
});

//this was checked
app.post("/logout", (req, res) => {
  delete req.session.user_id;
  res.redirect(`/urls`);
});

//this was checked
app.get("/urls/:id/delete", (req, res) => {
  if (!req.session.user_id) {
    res.status(403).send('<html><body><center><br/><br/> PLEASE LOG IN TO DELETE THE LINK<center></body></html>\n')
  } else if (urlDatabase[req.params.id]["id"] === req.session.user_id) {
    delete urlDatabase[req.params.id];
    res.redirect(`/urls`);
  } else {
    res.status(403).send('<html><body><center><br/><br/> THE LINK YOU ARE TRYING TO DELETE IS NOT YOURS<center></body></html>\n');
  }
});

//this was checked
app.post("/urls/:id/delete", (req, res) => {
  delete urlDatabase[req.params.id];
  res.redirect(`/urls`);
});



app.get("/urls/new", (req, res) => {
  if (!req.session.user_id) {
    res.redirect("/login");
  } else {
    let templateVars = { user_id: req.session.user_id, user: users[req.session.user_id]};
    res.render("urls_new", templateVars);
}
});

app.get("/u/:shortURL", (req, res) => {
  if (!urlDatabase[req.params["shortURL"]]) {
    res.send("This URL does not exist");
  } else {
  res.redirect(urlDatabase[req.params["shortURL"]]["url"]);
  }
});

//checked the one below
app.get("/urls/:id", (req, res) => {
  if(!req.session.user_id) {
    res.send('<html><body><center><br/><br/> LOGIN TO VIEW <center></body></html>\n');
  } else {
    if (!urlDatabase[req.params.id]) {
      res.send('<html><body><center><br/><br/> THE LINK DOES NOT EXIST<center></body></html>\n');
    } else {
      if(urlDatabase[req.params.id]["id"] === req.session.user_id) {
        let longUrl = urlDatabase[req.params.id]["url"];
        let templateVars = { shortURL: req.params.id, longURL: longUrl, user_id: req.session.user_id, user: users[req.session.user_id]};
        res.render("urls_show", templateVars);
      } else {
        res.status(403).send('<html><body><center><br/><br/> THE LINK YOU ARE TRYING TO ACCESS IS NOT YOURS<center></body></html>\n');
      }
    }
}
});

//checked the one below
app.post("/urls/:id", (req, res) => {
  if(!req.session.user_id) {
    res.send('<html><body><center><br/><br/> LOGIN TO VIEW <center></body></html>\n');
  } else {
    if (urlDatabase[req.params.id]["id"] === req.session.user_id) {
    urlDatabase[req.params.id]["url"] = req.body["longURL"];
    res.redirect(`/urls`);
    } else {
      res.status(403).send('<html><body><center><br/><br/> THE LINK YOU ARE TRYING TO ACCESS IS NOT YOURS<center></body></html>\n');
    }
  }
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});


