const express = require("express");
const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");
const { render } = require("ejs");
const bcrypt = require("bcryptjs");
const app = express();
const PORT = 8080;

app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({extended: true}));
app.use(cookieParser());

const urlDatabase = {
  "b2xVn2": {
    longURL: "http://www.lighthouselabs.ca",
    userID: "bob",
    password: "purple-monkey-dinosaur"
  },
  "9sm5xK": {
    longURL: "http://www.google.com",
    userID: "bill",
    password: "blue-dinosaur-monkey"
  }
};

const users = {};

// helper function
function generateRandomString() {
  let results = "";
  for (let i = 0; i < 6; i++) {
    const randomCharCode = Math.floor(Math.random() * 26 + 97);
    const randomChar = String.fromCharCode(randomCharCode);
    results += randomChar;
  }
  return results;
}

// helper function
function createNewUser(req) {
  const email = req.body.email;
  const password = req.body.password;
  const hashedPassword = bcrypt.hashSync(password, 10);
  const ID = generateRandomString();
  users[ID] = {
    id: ID,
    email: email,
    hasedPassword: hashedPassword
  };
  console.log("helper", users[ID]);
  return users[ID];
}


// helper function
function checkEmailExists(newEmail) {
  for (let user in users) {
    if (users[user]["email"] === newEmail) {
      return users[user];
    }
  }
  return false;
}

// function findUser (newEmail, users)  {
//   for (let user in users) {
//     if (users[user].email === newEmail) {
//       return users[user];
//     }
//   }
//   return false;
// }

function checkPassword(users, newPassword) {
  return bcrypt.compareSync(newPassword, users.hashedPassword);
}


// helper function
function urlsForUser(userID, urlDatabase) {
  const usersURL = {};
  for (let url in urlDatabase) {
    if (urlDatabase[url].userID === userID) {
      usersURL[url] = urlDatabase[url];
    }
  }
  return usersURL;
}



/*-- GET REQUESTS --*/

app.get("/hello", (req, res) => {
  res.send("<html><body>Hello <b>World</b></body></html>\n");
});

// server sends a response
app.get("/", (req, res) => {
  res.send("Hello!");
});

//gets a route for urls index page
app.get("/urls", (req, res) => {
  const userID = req.cookies["user_id"];
  const user = users[userID];
  if (!user) {
    res.status(400).send("Please login to gain access.")
  } else {
    const templateVars = {
      urls: urlsForUser(userID, urlDatabase),
      userID: req.cookies["user_id"],
      user: users[req.cookies["user_id"]],
    };
    res.render("urls_index", templateVars);
  }
});

// GET route for the creating a new shortURL page
app.get("/urls/new", (req, res) => {
  const userID = req.cookies["user_id"];
  if (userID) {
    const templateVars = {
      urls: urlDatabase,
      userID: req.cookies["user_id"],
      user: users[req.cookies["user_id"]]
    };
    res.render("urls_new", templateVars);
  } else {
    res.redirect("/login");
  }
});

// renders individual URL details
app.get("/urls/:shortURL", (req, res) => {
  const { shortURL } = req.params;
  const { userID } = req.cookies["user_id"];

  const templateVars = {
    shortURL: shortURL,
    longURL: urlDatabase[shortURL].longURL,
    user: users[req.cookies["user_id"]],
    userID: req.cookies["user_id"],
  };
    res.render("urls_show", templateVars);
});

//server sends a JSON response
app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

// GET endpoint - redirects to longURLS
app.get("/u/:shortURL", (req, res) => {
  if (!urlDatabase[req.params.shortURL]) {
    res.status(400).send("shortURL does not exist.")
  } else {
    if (urlDatabase[req.params.shortURL].userID === req.cookies["user_id"]) {
    const longURL = urlDatabase[req.params.shortURL].longURL;
    res.redirect(longURL);
  } else {
    res.status(400).send("Access Denied, only able to view URL that you have created");
    }
  }
});

//GET endpoint - request to /register
app.get("/register", (req, res) => {

  const templateVars = {
    user_id: req.cookies["user_id"],
    user: users[req.cookies["user_id"]]
  };

  res.render("register", templateVars);
});


// GET endpoint - request to /login
app.get("/login", (req, res) => {

  const templateVars = {
    user_id: req.cookies["user_id"],
    user: users[req.cookies["user_id"]]
  };

  res.render("login", templateVars);
});



/*-- POST REQUESTS --*/

app.post("/urls", (req, res) => {
  const shortURL = generateRandomString();
  longURL = req.body.longURL;
  const userID = req.cookies["user_id"];
  urlDatabase[shortURL] = {};
  urlDatabase[shortURL].longURL = longURL;
  urlDatabase[shortURL].userID = userID;
  res.redirect(`/urls/${shortURL}`);
});


//Edit the longURL when submitting an new URL
app.post("/urls/:shortURL", (req, res) => {
  const { shortURL } = req.params;
  const { userID } = req.cookies["user_id"];
  const { longURL } = req.params.shortURL;

  if (urlDatabase[req.params.shortURL].userID === userID) {
    if (!urlDatabase[shortURL]) {
      res.status(400).send("The URL does not exist, please try again.");
    } else {
      urlDatabase[shortURL].longURL = longURL;
      res.redirect("/urls");
    }
  } else {
    res.status(400).send("Unable to edit URL, please log in.")
  }
});

//Edit the longURL when submitting an new URL
app.post("/u/:shortURL", (req, res) => {
  const { shortURL } = req.params;

  const urlObj = urlDatabase[shortURL];
  if (!urlObj) {
    const templateVars = {
      status: 204,
      message: "Invalid URL"
    };
    return res.status(404).render("urls_error", templateVars);
  };

  urlDatabase[shortURL].longURL = req.body.longURL;
  res.redirect("/urls");
});

// Delete
app.post("/urls/:shortURL/delete", (req, res) => {
  const { shortURL } = req.params.shortURL;
  const { userID } = req.cookies["user_id"];

  if (userID !== urlDatabase[shortURL].userID) {
      res.status(403).send("You are not logged in. Please log in to edit.");
    } else {
      delete urlDatabase[shortURL];
      res.status(301).redirect("/urls");
  }
});

//Registering a new User
app.post("/register", (req, res) => {
  const { user } = checkEmailExists(req.body.email);
  if (user) {
    res.status(400).send("Email has already been taken, please use a different email.");

  } else {
    const newUser = createNewUser(req);
    res.cookie("user_id", newUser.id);
    res.redirect("/urls");
  }
});

//Login
app.post("/login", (req, res) => {
  const user = checkEmailExists(req.body.email, users);
  const correctPassword = checkPassword(user, req.body.password);
  if (user) {
    if (correctPassword) {
      res.cookie("user_id", user.id);
      res.redirect("/urls");
    } else {
      res.status(403).send("Password is Incorrect, please try again");
    }
  } else {
    res.status(403).send("Email cannot be found, please try again");
  }
});

//Logout
app.post("/logout", (req, res) => {
  res.clearCookie("user_id");
  res.redirect("/login");
});


app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});
