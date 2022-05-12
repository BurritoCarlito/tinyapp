const express = require('express');
const bodyParser = require('body-parser');
const cookieSession = require('cookie-session');
const { render } = require("ejs");
const bcrypt = require('bcryptjs');
const app = express();
const PORT = 8080;
const {
  generateRandomString,
  getUsersByEmail,
  urlsForUser
} = require("./helpers");

const users = {};

app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({extended: true}));
app.use(cookieSession({
  name: "session",
  keys: ["key1", "key2", "key3"],
  maxAge: 24 * 60 * 60 * 1000
}));

const urlDatabase = {
  "b2xVn2": {
    longURL: "http://www.lighthouselabs.ca",
    userID: "bob",
    password: "123apple"
  },
  "9sm5xK": {
    longURL: "http://www.google.com",
    userID: "bill",
    password: "123banana"
  }
};

app.get("/hello", (req, res) => {
  
  res.send("<html><body>Hello <b>World</b></body></html>\n");
});

// server sends a response
app.get("/", (req, res) => {

  res.send("Hello!");
});

//gets a route for urls index page
app.get("/urls", (req, res) => {
  const urls = urlsForUser(req.session.user_id, urlDatabase);

    const templateVars = {
      urls: urls,
      user: users[req.session.user_id],
      userID: req.session.user_id,
    };

    res.render("urls_index", templateVars);
});

// GET route for the creating a new shortURL page
app.get("/urls/new", (req, res) => {
  const userID = req.session.user_id;

  if (userID) {

    const templateVars = {
      urls: urlDatabase,
      userID: req.session.user_id,
      user: users[req.session.user_id]

    };
    res.render("urls_new", templateVars);
  } else {
    res.redirect("/login");
  }
});

// renders individual URL details
app.get("/urls/:shortURL", (req, res) => {
  const { shortURL } = req.params;
  const { userID } = req.session.user_id;

  const templateVars = {
    shortURL: shortURL,
    longURL: urlDatabase[shortURL].longURL,
    user: users[req.session.user_id],
    userID: req.session.user_id

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
    if (urlDatabase[req.params.shortURL].userID === req.session.user_id) {
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
    user_id: req.session.user_id,
    user: users[req.session.user_id]
  };

  res.render("register", templateVars);
});


// GET endpoint - request to /login
app.get("/login", (req, res) => {

  const templateVars = {
    user_id: req.session.user_id,
    user: users[req.session.user_id]
  };

  res.render("login", templateVars);
});

/*-- POST REQUESTS --*/

app.post("/urls", (req, res) => {
  const shortURL = generateRandomString();
  longURL = req.body.longURL;
  const userID = req.session.user_id;
  urlDatabase[shortURL] = {};
  urlDatabase[shortURL].longURL = longURL;
  urlDatabase[shortURL].userID = userID

  res.redirect(`/urls/${shortURL}`);
});


//Edit the longURL when submitting an new URL
app.post("/urls/:shortURL", (req, res) => {
  const { shortURL } = req.params;
  const { userID } = req.session.user_id;
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
  const shortURL = req.params.shortURL;

  if (urlDatabase[shortURL].userID === req.session.user_id) {
    if(!urlDatabase[shortURL]) {
      res.status(403).send("URL does not exist, please try again");
    } else {
      delete urlDatabase[shortURL];
      res.status(301).redirect("/urls");
    }
  } else {
    res.status(400).send("Unable to delete URL that does not belong to you.")
  }
});

//Registering a new User
app.post("/register", (req, res) => {
  const email = req.body.email;
  const user = getUsersByEmail(email, users);

  if (user) {
    res.status(400).send("Email has already been taken, please use a different email.");

  } else {
      const email = req.body.email;
      const password = req.body.password;
      const hashedPassword = bcrypt.hashSync(password, 10);
      const ID = generateRandomString();
      users[ID] = {
        id: ID,
        email: email,
        hashedPassword: hashedPassword
      }

    const newUser = users[ID];
    console.log(newUser.id);
    req.session.user_id = newUser.id;
    res.redirect("/urls");
  }
});

//Login
app.post("/login", (req, res) => {
  const email = req.body.email;
  const user = getUsersByEmail(email, users);
  const password = req.body.password;

  if (!user) {
    return res.status(403).send("Email does not exist, please try again");
  }
  console.log(password, user);
    if (bcrypt.compareSync(password, user.hashedPassword)) {
      req.session.user_id = user.id;
      res.redirect("/urls");
      return;
    } else {
      return res.status(403).send("Incorrect Password, please try again.")
    }
});

//Logout
app.post("/logout", (req, res) => {

  req.session = null;
  res.redirect("/login");
});


app.listen(PORT, () => {

  console.log(`Example app listening on port ${PORT}!`);
});
