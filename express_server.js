const express = require("express");
const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");
const { render } = require("ejs");
const app = express();
const PORT = 8080;

function generateRandomString() {
  let results = "";
  for (let i = 0; i < 6; i++) {
    const randomCharCode = Math.floor(Math.random() * 26 + 97);
    const randomChar = String.fromCharCode(randomCharCode);
    results += randomChar;
  }
  return results;
};


app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({extended: true}));
app.use(cookieParser());

const urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
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
  const templateVars = { 
    urls: urlDatabase,
    username: req.cookies.username
  };
  res.render("urls_index", templateVars);
});

app.get("/urls/new", (req, res) => {
  const templateVars = {
    username: req.cookies.username
  };
  res.render("urls_new", templateVars);
});

// renders individual URL details
app.get("/urls/:shortURL", (req, res) => {
  const { shortURL } = req.params;

  const urlObj = urlDatabase[shortURL];
  if (!urlObj) {
    const templateVars = {
      status: 404,
      message: "Invalid URL"
    };
    return res.status(404).render("urls_error", templateVars);
  };

  const templateVars = { 
    shortURL: shortURL,
    longURL: urlDatabase[shortURL], 
    username: req.cookies.username
  };
  res.render("urls_show", templateVars);
});

//server sends a JSON response
app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

// routes you to the longURL site
app.get("/u/:shortURL", (req, res) => {
  const { shortURL } = req.params;

  const urlObj = urlDatabase[shortURL];
  if (!urlObj) {
    const templateVars = {
      status: 404,
      message: "Invalid URL"
    };
    return res.status(404).render("urls_error", templateVars);
  };

  res.status(302).redirect(urlObj);
});

app.post("/urls", (req, res) => {
  console.log(req.body); 
  const shortURL = generateRandomString();
  urlDatabase[shortURL] = req.body.longURL;
  console.log(urlDatabase);
  res.redirect(`/urls/${shortURL}`);
});

//Edit the longURL when submitting an new URL
app.post("/urls/:shortURL", (req, res) => {
  const { shortURL } = req.params;

  // const urlObj = urlDatabase[shortURL];
  // if (!urlObj) {
  //   const templateVars = {
  //     status: 204,
  //     message: "Invalid URL"
  //   };
  //   return res.status(404).render("urls_error", templateVars);
  // };

  urlDatabase[shortURL] = req.body.longURL;
  res.redirect("/urls");
});

// Delete 
app.post("/urls/:shortURL/delete", (req, res) => {
  const { shortURL } = req.params;

  const urlObj = urlDatabase[shortURL];
  if (!urlObj) {
    const templateVars = {
      status: 204,
      message: "Invalid URL"
    };
    return res.status(404).render("urls_error", templateVars);
  };

  delete urlDatabase[shortURL];
  res.status(301).redirect("/urls");
});

//Login
app.post("/login", (req, res) => {
  res.cookie("username", req.body.username);
  res.redirect("/urls");
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});

