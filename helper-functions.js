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