const express = require("express");
const bodyParser = require("body-parser");
const cookieSession = require('cookie-session')
const bcrypt = require('bcrypt');
const PORT = 8080;

const app = express();

app.use(bodyParser.urlencoded({extended: true}));
app.set("view engine", "ejs");
app.use(cookieSession({
  name: 'session',
  keys: ["123"],
  maxAge: 24 * 60 * 60 * 1000
}));

const urlDatabase = {
  "b2xVn2": {
    url: "http://www.lighthouselabs.ca",
    id: "userRandomID",
    visits: 0,
    uniqueVisits: ["userRandomID", "user2RandomID"],
    timeStamp: ["userRandomID on July 1","user2RandomID on July 1"]
  },
  "9sm5xK": {
    url: "http://www.google.com",
    id: "user2RandomID",
    visits: 0,
    uniqueVisits: ["userRandomID", "user2RandomID"],
    timeStamp: ["user4RandomID on July 1","user5RandomID on July 1"]
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

app.get("/urls", (req, res) => {
  const filteredUrlDatabase = urlsForUser(req.session.user_id);
  let templateVars = { urls: filteredUrlDatabase, user_id: req.session.user_id, user: users[req.session.user_id]};
  res.render("urls_index", templateVars);
});

app.post("/urls", (req, res) => {
  if (!req.session.user_id) {
    res.status(401).send('<html><body><center><br/><br/> YOU ARE NOT LOGGED IN <center></body></html>\n')
  } else {
    let randomName = generateRandomString();
    urlDatabase[randomName] = {
      url: req.body.longURL,
      id: req.session.user_id,
      visits: 0,
      uniqueVisits: [],
      timeStamp: []
    };
    res.redirect(`/urls/${randomName}`);
    console.log(urlDatabase);
  }
});

app.get("/register", (req, res) => {
  if (!req.session.user_id) {
    res.render("urls_register");
  } else {
    res.redirect("/urls");
  }
});

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

app.get("/login", (req, res) => {
  if (!req.session.user_id) {
    res.render("urls_login");
  } else {
    res.redirect("/urls");
  }
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
    res.status(400).send('<html><body><center><br/><br/> PROVIDED EMAIL IS NOT REGISTERED<center></body></html>\n');
  } else {
    if (bcrypt.compareSync(req.body["password"], users[user]["password"])) {
        req.session.user_id = user;
        res.redirect(`/urls`);
    } else {
      res.status(400).send('<html><body><center><br/><br/> INCORRECT PASSWORD<center></body></html>\n');
    }
  }
});

app.post("/logout", (req, res) => {
  req.session = null;
  res.redirect(`/urls`);
});

app.post("/urls/:id/delete", (req, res) => {
  if (!req.session.user_id) {
    res.status(401).send('<html><body><center><br/><br/> PLEASE LOG IN TO DELETE THE LINK<center></body></html>\n')
  } else if (urlDatabase[req.params.id]["id"] === req.session.user_id) {
    delete urlDatabase[req.params.id];
    res.redirect(`/urls`);
  } else {
    res.status(403).send('<html><body><center><br/><br/> THE LINK YOU ARE TRYING TO DELETE IS NOT YOURS<center></body></html>\n');
  }
});

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
    res.status(400).send('<html><body><center><br/><br/> THIS URL DOES NOT EXIST <center></body></html>\n');
  } else {
    if (req.session.user_id && !urlDatabase[req.params["shortURL"]]["uniqueVisits"].includes(req.session.user_id)) {
      urlDatabase[req.params["shortURL"]]["uniqueVisits"].push(req.session.user_id);
    }
    if (req.session.user_id) {
      let dt = new Date();
      let utcDate = dt.toUTCString()
      urlDatabase[req.params["shortURL"]]["timeStamp"].push(req.session.user_id+" on "+utcDate);
    }
    urlDatabase[req.params["shortURL"]]["visits"] ++;
    console.log(urlDatabase);
    res.redirect(urlDatabase[req.params["shortURL"]]["url"]);
  }
});

app.get("/urls/:id", (req, res) => {
  if(!req.session.user_id) {
    res.status(401).send('<html><body><center><br/><br/> LOGIN TO VIEW <center></body></html>\n');
  } else {
    if (!urlDatabase[req.params.id]) {
      res.status(400).send('<html><body><center><br/><br/> THE LINK DOES NOT EXIST<center></body></html>\n');
    } else {
      if(urlDatabase[req.params.id]["id"] === req.session.user_id) {
        let longUrl = urlDatabase[req.params.id]["url"];
        let visits = urlDatabase[req.params.id]["visits"];
        let uniqueVisits = urlDatabase[req.params.id]["uniqueVisits"];
        let timeStamp = urlDatabase[req.params.id]["timeStamp"];
        let templateVars = { uniqueVisits: uniqueVisits, timeStamp: timeStamp, visits: visits, shortURL: req.params.id, longURL: longUrl, user_id: req.session.user_id, user: users[req.session.user_id]};
        res.render("urls_show", templateVars);
      } else {
        res.status(403).send('<html><body><center><br/><br/> THE LINK YOU ARE TRYING TO ACCESS IS NOT YOURS<center></body></html>\n');
      }
    }
}
});

app.post("/urls/:id", (req, res) => {
  if(!req.session.user_id) {
    res.status(401).send('<html><body><center><br/><br/> LOGIN TO VIEW <center></body></html>\n');
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


