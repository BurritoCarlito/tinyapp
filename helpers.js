const users = {};

function generateRandomString() {
  let results = "";
  for (let i = 0; i < 6; i++) {
    const randomCharCode = Math.floor(Math.random() * 26 + 97);
    const randomChar = String.fromCharCode(randomCharCode);
    results += randomChar;
  }
  return results;
}

function getUsersByEmail(email, users) {
  for (let user in users) {
    if (users[user]["email"] === email) {
      return users[user];
    }
  }
  return false;
}

function urlsForUser(userID, urlDatabase) {
  const usersURL = {};
  for (let url in urlDatabase) {
    if (urlDatabase[url].userID === userID) {
      usersURL[url] = urlDatabase[url];
    }
  }
  return usersURL;
}


module.exports = {
  generateRandomString,
  getUsersByEmail,
  urlsForUser
};