import express from "express";
import path from "path";
import mongoose from "mongoose";
import cookieParser from "cookie-parser";
import jwt from "jsonwebtoken";
import * as dotenv from 'dotenv';
dotenv.config();

const app = express();
mongoose
  .connect(
    process.env.MongoURI
  )
  .then((c) => console.log("database connected"))
  .catch((e) => console.log("error"));

const userSchema = new mongoose.Schema({
  name: String,
  email: String,
  password: String,
});

const Users = mongoose.model("users", userSchema);

// using middlewares
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(path.resolve(), "public")));
app.use(cookieParser());

app.set("view engine", "ejs");

const isAuthenticated = async (req, res, next) => {
  const { Id } = req.cookies;
  if (Id) {
    const ids = jwt.verify(Id, process.env.Secretkey);
    req.user = await Users.findById(ids._id);
    next();
  } else {
    res.render("register");
  }
};

// get apis
app.get("/", isAuthenticated, (req, res) => {
  res.render("logout");
});

app.get("/logout", (req, res) => {
  res.cookie("Id", null, {
    httpOnly: true,
    expires: new Date(Date.now()),
  });
  res.redirect("/login");
});

app.get("/register", (req, res) => {
  res.render("register");
});

app.get("/login", (req, res) => {
  res.render("login");
});

// post apis
app.post("/register", async (req, res) => {
  const { name, email, password } = req.body;
  let user = await Users.findOne({ email });
  if (user) {
    return res.redirect("/logout");
  } else {
    user = await Users.create({
      name,
      email,
      password,
    });

    const token = jwt.sign(
      {
        _id: user._id,
      },
      process.env.Secretkey
    );

    res.cookie("Id", token, {
      httpOnly: true,
      expires: new Date(Date.now() + 60 * 1000),
    });
    res.redirect("/login");
  }
});

app.post("/login", async (req, res) => {
    const {email , password} = req.body;
    let user = await Users.findOne({ email });
    if(user)
    {
        if(user.password === password)
        {
            const token = jwt.sign(
                {
                  _id: user._id,
                },
                process.env.Secretkey
              );
          
              res.cookie("Id", token, {
                httpOnly: true,
                expires: new Date(Date.now() + 60 * 1000),
              });
              res.render("logout")
        }
        else
        {
            res.render("login",{message:"password incorrect",email})
        }
    }
    else
    {
        res.redirect("/register")
    }
});

app.listen(5000, () => {
  console.log("server is working");
});
