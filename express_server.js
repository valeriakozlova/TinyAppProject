const express = require("express");
const bodyParser = require("body-parser");
const cookieSession = require("cookie-session")
const bcrypt = require("bcrypt");
//const helperFunctions = require("./helper-functions");
const PORT = 8080;

const app = express();

app.use(bodyParser.urlencoded({extended: true}));
app.set("view engine", "ejs");
app.use(cookieSession({
  name: "session",
  keys: ["123"],
  maxAge: 24 * 60 * 60 * 1000
}));

const urlDatabase = {
  "b2xVn2": {
    url: "http://www.lighthouselabs.ca",
    id: "userRandomID",
    visits: 0,
    uniqueVisits: ["userRandomID", "user2RandomID"],
    timeStamp: ["userRandomID on Fri, 02 Nov 2018 20:35:17 GMT","user2RandomID on Fri, 02 Nov 2018 20:35:17 GMT"]
  },
  "9sm5xK": {
    url: "http://www.google.com",
    id: "user2RandomID",
    visits: 0,
    uniqueVisits: ["userRandomID", "user2RandomID"],
    timeStamp: ["user4RandomID on Fri, 02 Nov 2018 20:35:17 GMT","user5RandomID on Fri, 02 Nov 2018 20:35:17 GMT"]
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

function generateRandomString() {
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let randomString = "";
  for (let i = 0; i < 6; i++) {
    randomString += alphabet[Math.floor(Math.random()*62)];
  }
  return randomString;
}

function urlsForUser(id, database) {
  const filteredDatabase = {};
  for (let shortURL in database) {
    if (id === database[shortURL].id) {
      filteredDatabase[shortURL] = database[shortURL];
    }
  }
  return filteredDatabase;
}

function createNewURL (shortURL, longURL, userID, database) {
  database[shortURL] = {
    url: longURL,
    id: userID,
    visits: 0,
    uniqueVisits: [],
    timeStamp: []
  };
}

function userRegistration (userID, email, password, database) {
  database[userID] = {
    id: userID,
    email: email,
    password: password
  };
}

//Find user based on the email provided
function findUser (email, database) {
  let user = false;
  for (let userID in database) {
    if (database[userID].email === email) {
      user = database[userID];
    }
  }
  return user;
}

function createTimestamp () {
  let dt = new Date();
  let utcDate = dt.toUTCString();
  return utcDate;
}

//visit tracking
function recordVisits (userID, shortURL, database) {
  database[shortURL].visits ++;
  if (userID && !database[shortURL].uniqueVisits.includes(userID)) {
    database[shortURL].uniqueVisits.push(userID);
  }
  if (userID) {
    database[shortURL].timeStamp.push(userID + " on " + createTimestamp());
  }
}

app.get("/", (req, res) => {
  if(!req.session.user_id) {
    res.redirect("/login");
  } else {
    res.redirect("/urls");
  }
});

//delete the cookie, since you are passing user info
app.get("/urls", (req, res) => {
  const filteredUrlDatabase = urlsForUser(req.session.user_id, urlDatabase);
  let templateVars = { urls: filteredUrlDatabase, user_id: req.session.user_id, user: users[req.session.user_id]};
  res.render("urls_index", templateVars);
});

//Generates a new URL
app.post("/urls", (req, res) => {
  if (!req.session.user_id) {
    res.status(401).send("<html><body><center><br/><br/> YOU ARE NOT LOGGED IN <center></body></html>\n");
  } else {
    let randomName = generateRandomString();
    createNewURL(randomName, req.body.longURL, req.session.user_id, urlDatabase);
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
  if (!req.body.email|| !req.body.password) {
    res.status(400).send("<html><body><center><br/><br/>PLEASE PROVIDE BOTH: PASSWORD AND EMAIL<center></body></html>\n");
  } else if (findUser(req.body.email, users)) {
    res.status(400).send("<html><body><center><br/><br/>YOU ALREADY HAVE AN ACCOUNT WITH US,  PLEASE LOG IN<center></body></html>\n");
  } else {
    const userID = generateRandomString();
    userRegistration(userID, req.body.email, bcrypt.hashSync(req.body.password, 10), users)
    console.log(users);
    req.session.user_id = userID;
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
  if (!findUser(req.body.email, users)) {
    res.status(400).send("<html><body><center><br/><br/> PROVIDED EMAIL IS NOT REGISTERED<center></body></html>\n");
  } else {
    let user = findUser(req.body.email, users);
    if (bcrypt.compareSync(req.body.password, user.password)) {
      req.session.user_id = user.id;
      res.redirect("/urls");
    } else {
      res.status(400).send("<html><body><center><br/><br/> INCORRECT PASSWORD<center></body></html>\n");
    }
  }
});

app.post("/logout", (req, res) => {
  req.session = null;
  res.redirect("/urls");
});

app.post("/urls/:id/delete", (req, res) => {
  if (!req.session.user_id) {
    res.status(401).send('<html><body><center><br/><br/> PLEASE LOG IN TO DELETE THE LINK<center></body></html>\n')
  } else if (urlDatabase[req.params.id].id === req.session.user_id) {
    delete urlDatabase[req.params.id];
    res.redirect("/urls");
  } else {
    res.status(403).send("<html><body><center><br/><br/> THE LINK YOU ARE TRYING TO DELETE IS NOT YOURS<center></body></html>\n");
  }
});

app.post("/urls/:id/delete", (req, res) => {
  delete urlDatabase[req.params.id];
  res.redirect("/urls");
});

//Takes to a page where you can generate a new URL
app.get("/urls/new", (req, res) => {
  if (!req.session.user_id) {
    res.redirect("/login");
  } else {
    let templateVars = { user_id: req.session.user_id, user: users[req.session.user_id]};
    res.render("urls_new", templateVars);
  }
});

//Redirects you to the long (actual) URL
app.get("/u/:shortURL", (req, res) => {
  if (!urlDatabase[req.params.shortURL]) {
    res.status(400).send("<html><body><center><br/><br/> THIS URL DOES NOT EXIST <center></body></html>\n");
  } else {
    recordVisits(req.session.user_id, req.params.shortURL, urlDatabase)
    console.log(urlDatabase);
    res.redirect(urlDatabase[req.params.shortURL].url);
  }
});

//You can view individual url stats or update it
app.get("/urls/:id", (req, res) => {
  if(!req.session.user_id) {
    res.status(401).send("<html><body><center><br/><br/> LOGIN TO VIEW <center></body></html>\n");
  } else {
    if (!urlDatabase[req.params.id]) {
      res.status(400).send("<html><body><center><br/><br/> THE LINK DOES NOT EXIST<center></body></html>\n");
    } else {
      if(urlDatabase[req.params.id].id === req.session.user_id) {
        let longUrl = urlDatabase[req.params.id].url;
        let visits = urlDatabase[req.params.id].visits;
        let uniqueVisits = urlDatabase[req.params.id].uniqueVisits;
        let timeStamp = urlDatabase[req.params.id].timeStamp;
        let templateVars = { uniqueVisits: uniqueVisits, timeStamp: timeStamp, visits: visits, shortURL: req.params.id, longURL: longUrl, user_id: req.session.user_id, user: users[req.session.user_id]};
        res.render("urls_show", templateVars);
      } else {
        res.status(403).send("<html><body><center><br/><br/> THE LINK YOU ARE TRYING TO ACCESS IS NOT YOURS<center></body></html>\n");
      }
    }
}
});

app.post("/urls/:id", (req, res) => {
  if(!req.session.user_id) {
    res.status(401).send("<html><body><center><br/><br/> LOGIN TO VIEW <center></body></html>\n");
  } else {
    if (urlDatabase[req.params.id].id === req.session.user_id) {
      urlDatabase[req.params.id].url = req.body.longURL;
      res.redirect(`/urls`);
    } else {
      res.status(403).send("<html><body><center><br/><br/> THE LINK YOU ARE TRYING TO ACCESS IS NOT YOURS<center></body></html>\n");
    }
  }
});

app.listen(PORT, () => {
  console.log(`TinyApp listening on port ${PORT}!`);
});


