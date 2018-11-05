module.exports = {
  recordVisits: function (userID, shortURL, database) {
    database[shortURL].visits ++;
    if (userID && !database[shortURL].uniqueVisits.includes(userID)) {
      database[shortURL].uniqueVisits.push(userID);
    }
    if (userID) {
      let dt = new Date();
      let utcDate = dt.toUTCString();
      database[shortURL].timeStamp.push(userID + " on " + utcDate);
    }
  },
  findUser: function (email, database) {
    let user = false;
    for (let userID in database) {
      if (database[userID].email === email) {
        user = database[userID];
      }
    }
    return user;
  },
  userRegistration: function (userID, email, password, database) {
    database[userID] = {
      id: userID,
      email: email,
      password: password
    }
  },
  createNewURL: function (shortURL, longURL, userID, database) {
    database[shortURL] = {
      url: longURL,
      id: userID,
      visits: 0,
      uniqueVisits: [],
      timeStamp: []
    }
  },
  createNewURL: function (shortURL, longURL, userID, database) {
    database[shortURL] = {
      url: longURL,
      id: userID,
      visits: 0,
      uniqueVisits: [],
      timeStamp: []
    }
  },
  urlsForUser: function (id, database) {
    const filteredDatabase = {};
    for (let shortURL in database) {
      if (id === database[shortURL].id) {
        filteredDatabase[shortURL] = database[shortURL];
      }
    }
    return filteredDatabase;
  },
  generateRandomString: function () {
    const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    let randomString = "";
    for (let i = 0; i < 6; i++) {
      randomString += alphabet[Math.floor(Math.random()*62)];
    }
    return randomString;
  }
};

