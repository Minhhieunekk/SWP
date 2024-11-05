const { createHash } = require('crypto')
const express = require("express");
const mysql = require('mysql2');
const cors = require('cors');
const nodemailer = require('nodemailer');
const passport = require('passport');
const session = require('express-session');
const cookieParser = require('cookie-parser');
const jwt = require('jsonwebtoken');
const multer=require('multer');
const path=require('path');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const GitHubStrategy = require('passport-github2').Strategy;
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const FacebookStrategy = require('passport-facebook').Strategy;


require('dotenv').config();


const app = express();
app.use('/avatar', express.static('public/avatar'));
const storage=multer.diskStorage({
  destination: (req,file,cb) => {
    cb(null,'public/avatar')
   },
   filename: (req,file,cb) =>{
    cb(null,file.fieldname + "_" + Date.now() + path.extname(file.originalname));
   }
})

const upload= multer ({
  storage: storage
})

app.use(cors({ origin: 'http://localhost:3000', credentials: true }));
app.use(express.json());
app.use(cookieParser());
app.use(session({
  secret: '22112004',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: false,
    maxAge: 1000 * 60 * 60 * 24
  }
}));
app.use(passport.initialize());
app.use(passport.session());

const db = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "",
  database: "swpvip"
})
function generateToken(user) {
  return jwt.sign(
    { username: user.username, consumerid: user.consumerid, password: user.password },
    "22112004",
    { expiresIn: '1d' }
  );
}

//Đăng kí
app.post('/signup', (req, res) => {
  const sql = "INSERT INTO user (username,password,phone,email,address) VALUES (?,?,?,?,?)";
  const values = [
    req.body.username,
    hashPass(req.body.password),
    req.body.phone,
    req.body.email,
    req.body.address
  ]
  db.query(sql, values, (err, data) => {
    if (err) {
      return res.status(500).json("Error")
    }
    return res.json(data);
  })
})

//thêm sản phẩm
app.post('/addproduct', (req, res) => {
  const sql = "INSERT INTO `product`(`name`,`image`, `price`, `amount`, `category`) VALUES (?,?,?,?,?)"
  const values = [
    req.body.name,
    req.body.image,
    req.body.price,
    req.body.amount,
    req.body.category,

  ]
  db.query(sql, values, (err, data) => {
    if (err) {
      return res.status(500).json("error")
    }
    return res.json(data);
  })
})

//đăng nhập
app.post('/login', (req, res) => {
  const sql = "SELECT * FROM user WHERE `username` = ? AND `password` = ?";
  const value = [
    req.body.username,
    hashPass(req.body.password)
  ]
  db.query(sql, value, (err, data) => {
    if (err) {
      return res.status(500).json("Error");
    }
    if (data.length > 0) {
      const user = data[0];
      const token = generateToken(user);
      // Include basic user info in login response
      return res.json({
        success: true,
        token: token,
        user: {
          username: user.username,
          consumerid: user.consumerid,
          password: user.password
        }
      });
    } else {
      return res.json({ success: false, message: "Failed" });
    }
  })
});

// New lazy endpoint for getting user details when needed
app.get('/api/user/details', (req, res) => {
  const token = req.headers['authorization']?.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ message: 'No token provided' });
  }

  try {
    const decoded = jwt.verify(token, "22112004");
    const sql = "SELECT username, consumerid, password FROM user WHERE consumerid = ?";
    
    db.query(sql, [decoded.consumerid], (err, data) => {
      if (err) {
        return res.status(500).json({ message: "Database error" });
      }
      if (data.length > 0) {
        return res.json({
          username: data[0].username,
          consumerid: data[0].consumerid,
          password: data[0].password
        });
      }
      return res.status(404).json({ message: "User not found" });
    });
  } catch (err) {
    return res.status(403).json({ message: 'Invalid token' });
  }
});

//check username sign up 
app.post('/checkuser', (req, res) => {
  const sql = "SELECT * FROM user WHERE username = ?";

  db.query(sql, [req.body.username], (err, data) => {
    if (err) {
      return res.status(500).json({ error: "Database error" });
    }
    if (data.length > 0) {    
      const user = data[0];
      // delete user.password;
      return res.json({ 
        exists: true, 
        message: "Username already exists", 
        user: user 
      });
    } else {
      return res.json({ exists: false, message: "Username is available" });
    }
  });
});
//check email sign up 
app.post('/checkemail', (req, res) => {
  const sql = "SELECT * FROM user WHERE email = ?";

  db.query(sql, [req.body.email], (err, data) => {
    if (err) {
      return res.status(500).json({ error: "Database error" });
    }
    if (data.length > 0) {
      return res.json({ exists: true, message: "Email already exists" });
    } else {
      return res.json({ exists: false, message: "Email is available" });
    }
  });
});
//check phone sign up 
app.post('/checkphone', (req, res) => {
  const sql = "SELECT * FROM user WHERE phone = ?";

  db.query(sql, [req.body.phone], (err, data) => {
    if (err) {
      return res.status(500).json({ error: "Database error" });
    }
    if (data.length > 0) {
      return res.json({ exists: true, message: "Phone already exists" });
    } else {
      return res.json({ exists: false, message: "Phone is available" });
    }
  });
});

//product dashboard
app.get('/dashboard', (req, res) => {
  const sql = "select * from product";
  db.query(sql, (err, data) => {
    if (err) {
      return res.json("Error")
    }
    if (data.length > 0) {
      return res.json(data)
    } else {
      return res.json("No product")
    }
  })
})

// lấy sản phẩm bằng productid
app.get('/productdetail', (req, res) => {
  const { productid } = req.query; 
  const sql = `
    SELECT 
      p.*,
      c.categoryname,
      c.material,
      c.gender
    FROM 
      product p
    JOIN 
      category c ON p.category = c.categoryid
    WHERE 
      p.productid = ?
  `;

  db.query(sql, [productid], (err, data) => {
    if (err) {
      return res.status(500).json({ error: "Internal server error" });
    }
    if (data && data.length > 0) {
      return res.json({product:data});
    } else {
      return res.status(404).json({ error: "Product not found" });
    }
  });
});

// Lấy sản phẩm + pagniation 
app.get("/home", (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 4;
  const offset = (page - 1) * limit;

  // First, get the total count of products
  db.query("SELECT COUNT(*) as total FROM product", (err, countResult) => {
    if (err) {
      return res.status(500).json("Error counting products");
    }

    const totalProducts = countResult[0].total;
    const totalPages = Math.ceil(totalProducts / limit);

    // Then, get the products for the current page
    const sql = "SELECT * FROM product,category where product.category=category.categoryid ORDER BY productid LIMIT ? OFFSET ?";
    db.query(sql, [limit, offset], (err, data) => {
      if (err) {
        return res.status(500).json("Error fetching products");
      }

      return res.json({
        products: data,
        currentPage: page,
        totalPages: totalPages,
        totalProducts: totalProducts
      });
    });
  });
});

// lấy bông tai
app.get("/home/bongtai", (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 4;
  const offset = (page - 1) * limit;

  // First, get the total count of products
  db.query("SELECT COUNT(*) as total FROM product where product.category between 1 and 6 ", (err, countResult) => {
    if (err) {
      return res.status(500).json("Error counting products");
    }

    const totalProducts = countResult[0].total;
    const totalPages = Math.ceil(totalProducts / limit);

    // Then, get the products for the current page
    const sql = "SELECT * FROM product,category where product.category=category.categoryid and product.category between 1 and 6  ORDER BY productid LIMIT ? OFFSET ?";
    db.query(sql, [limit, offset], (err, data) => {
      if (err) {
        return res.status(500).json("Error fetching products");
      }

      return res.json({
        products: data,
        currentPage: page,
        totalPages: totalPages,
        totalProducts: totalProducts
      });
    });
  });
});
//lấy dây chuyền
app.get("/home/daychuyen", (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 4;
  const offset = (page - 1) * limit;

  // First, get the total count of products
  db.query("SELECT COUNT(*) as total FROM product where product.category between 7 and 12 ", (err, countResult) => {
    if (err) {
      return res.status(500).json("Error counting products");
    }

    const totalProducts = countResult[0].total;
    const totalPages = Math.ceil(totalProducts / limit);

    // Then, get the products for the current page
    const sql = "SELECT * FROM product,category where product.category=category.categoryid and product.category between 7 and 12  ORDER BY productid LIMIT ? OFFSET ?";
    db.query(sql, [limit, offset], (err, data) => {
      if (err) {
        return res.status(500).json("Error fetching products");
      }

      return res.json({
        products: data,
        currentPage: page,
        totalPages: totalPages,
        totalProducts: totalProducts
      });
    });
  });
});
//lấy vòng tay
app.get("/home/vongtay", (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 4;
  const offset = (page - 1) * limit;

  // First, get the total count of products
  db.query("SELECT COUNT(*) as total FROM product where product.category between 13 and 18 ", (err, countResult) => {
    if (err) {
      return res.status(500).json("Error counting products");
    }

    const totalProducts = countResult[0].total;
    const totalPages = Math.ceil(totalProducts / limit);

    // Then, get the products for the current page
    const sql = "SELECT * FROM product,category where product.category=category.categoryid and product.category between 13 and 18  ORDER BY productid LIMIT ? OFFSET ?";
    db.query(sql, [limit, offset], (err, data) => {
      if (err) {
        return res.status(500).json("Error fetching products");
      }

      return res.json({
        products: data,
        currentPage: page,
        totalPages: totalPages,
        totalProducts: totalProducts
      });
    });
  });
});
//lấy nhẫn
app.get("/home/nhan", (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 4;
  const offset = (page - 1) * limit;

  // First, get the total count of products
  db.query("SELECT COUNT(*) as total FROM product where product.category between 19 and 24 ", (err, countResult) => {
    if (err) {
      return res.status(500).json("Error counting products");
    }

    const totalProducts = countResult[0].total;
    const totalPages = Math.ceil(totalProducts / limit);

    // Then, get the products for the current page
    const sql = "SELECT * FROM product,category where product.category=category.categoryid and product.category between 19 and 24  ORDER BY productid LIMIT ? OFFSET ?";
    db.query(sql, [limit, offset], (err, data) => {
      if (err) {
        return res.status(500).json("Error fetching products");
      }

      return res.json({
        products: data,
        currentPage: page,
        totalPages: totalPages,
        totalProducts: totalProducts
      });
    });
  });
});
//tìm kiếm sản phẩm
app.get('/search', (req, res) => {
  const searchTerm = req.query.term;
  const sql = "SELECT * FROM product WHERE name LIKE ? LIMIT 10";
  db.query(sql, [`%${searchTerm}%`], (err, results) => {
    if (err) {
      console.error('Error searching products:', err);
      return res.status(500).json({ error: "Error searching products" });
    }
    res.json(results);
  });
});
app.get('/product/:id', (req, res) => {
  const productId = req.params.id;
  const sql = "SELECT * FROM product WHERE productid = ?";
  db.query(sql, [productId], (err, results) => {
    if (err) {
      console.error('Error fetching product details:', err);
      return res.status(500).json({ error: "Error fetching product details" });
    }
    if (results.length === 0) {
      return res.status(404).json({ error: "Product not found" });
    }
    res.json(results[0]);
  });
});

// Cập nhật sản phẩm
app.put('/updateproduct/:productid', (req, res) => {
  const productId = req.params.productid;
  const sql = "UPDATE `product` SET `name` = ?, `image` = ?, `price` = ?, `amount` = ?, `category` = ? WHERE `productid` = ?";
  const values = [
    req.body.name,
    req.body.image,
    req.body.price,
    req.body.amount,
    req.body.category,
    productId
  ];
  db.query(sql, values, (err, data) => {
    if (err) {
      return res.status(500).json("Error");
    }
    return res.json(data);
  });
});

// Xóa sản phẩm
app.delete('/deleteproduct/:productid', (req, res) => {
  const productId = req.params.productid;
  const sql = "DELETE FROM `product` WHERE `productid` = ?";
  db.query(sql, [productId], (err, data) => {
    if (err) {
      return res.status(500).json("Error");
    }
    return res.json(data);
  });
});

//OTP

// Generate OTP
function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000);
}

// Send OTP via email
async function sendOTP(email, otp) {
  let transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 587,
    secure: false,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  });

  let mailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject: 'Password Reset OTP',
    text: `Your OTP for password reset is: ${otp}`
  };

  try {
    let info = await transporter.sendMail(mailOptions);
    console.log('Email sent: ' + info.response);
    return true;
  } catch (error) {
    console.error('Error sending email:', error);
    return false;
  }
}

// Request OTP
app.post('/forgot-password', (req, res) => {
  const { email } = req.body;
  const otp = generateOTP();
  const sql = "UPDATE user SET otp = ?, otp_expiry = DATE_ADD(NOW(), INTERVAL 15 MINUTE) WHERE email = ?";

  db.query(sql, [otp, email], async (err, result) => {
    if (err) {
      console.error('Database error:', err);
      return res.status(500).json("Error generating OTP");
    }
    if (result.affectedRows === 0) {
      return res.status(404).json("Email not found");
    }
    try {
      const emailSent = await sendOTP(email, otp);
      if (emailSent) {
        res.json("OTP sent successfully");
      } else {
        // If email sending fails, remove the OTP from the database
        const resetSql = "UPDATE user SET otp = NULL, otp_expiry = NULL WHERE email = ?";
        db.query(resetSql, [email], (resetErr) => {
          if (resetErr) {
            console.error('Error resetting OTP:', resetErr);
          }
        });
        res.status(500).json("Error sending OTP");
      }
    } catch (error) {
      console.error('Error in OTP process:', error);
      res.status(500).json("Error processing OTP request");
    }
  });
});

// Verify OTP and reset password
app.post('/reset-password', (req, res) => {
  const { email, otp, newPassword } = req.body;
  const sql = "SELECT * FROM user WHERE email = ? AND otp = ? AND otp_expiry > NOW()";

  db.query(sql, [email, otp], (err, result) => {
    if (err) {
      return res.status(500).json("Error verifying OTP");
    }
    if (result.length === 0) {
      return res.status(400).json("Invalid or expired OTP");
    }

    const updateSql = "UPDATE user SET password = ?, otp = NULL, otp_expiry = NULL WHERE email = ?";
    db.query(updateSql, [newPassword, email], (updateErr, updateResult) => {
      if (updateErr) {
        return res.status(500).json("Error resetting password");
      }
      res.json("Password reset successfully");
    });
  });
});

//resetpassword
app.post('/resetpass', (req, res) => {
  const sql = "UPDATE user SET password = ? WHERE consumerid = ?"
  const { newpass, userid } = req.body;

  db.query(sql, [hashPass(newpass), userid], (err, result) => {
    if (err) {
      return res.json("error reset password");
    }
    res.json("password reset successfully")
  })
})

//login via google
passport.use(new GoogleStrategy({
  clientID: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  callbackURL: "http://localhost:8088/auth/google/callback"
},
  function (accessToken, refreshToken, profile, done) {
    const sql = "SELECT * FROM user WHERE email = ?";
    db.query(sql, [profile.emails[0].value], (err, result) => {
      if (err) return done(err);
      if (result.length) {
        // User exists, update username if it has changed and log them in
        const user = result[0];
        if (user.username !== profile.displayName) {
          db.query('UPDATE user SET username = ? WHERE email = ?', [profile.displayName, user.email], (err) => {
            if (err) return done(err);
            user.username = profile.displayName;
            return done(null, user);
          });
        } else {
          return done(null, user);
        }
      } else {
        // User doesn't exist, create new user
        const newUser = {
          username: profile.displayName,
          email: profile.emails[0].value
        };
        db.query('INSERT INTO user SET ?', newUser, (err, res) => {
          if (err) return done(err);
          newUser.email = profile.emails[0].value; // Use email as identifier
          return done(null, newUser);
        });
      }
    });
  }
));

passport.serializeUser((user, done) => {
  done(null, user.email); // Use email instead of id
});

passport.deserializeUser((email, done) => {
  db.query("SELECT * FROM user WHERE email = ?", [email], (err, result) => {
    if (err) return done(err);
    done(null, result[0] || null);
  });
});
app.get('/auth/google',
  passport.authenticate('google', { scope: ['profile', 'email'] }));

app.get('/auth/google/callback',
  passport.authenticate('google', { failureRedirect: '/login' }),
  function (req, res) {
    const token = generateToken(req.user);

    res.redirect(`http://localhost:3000/?token=${token}`);
  });


// login via Facebook
passport.use(new FacebookStrategy({
  clientID: process.env.FACEBOOK_APP_ID,
  clientSecret: process.env.FACEBOOK_APP_SECRET,
  callbackURL: "http://localhost:8088/auth/facebook/callback",
  profileFields: ['id', 'displayName', 'email']
}, function (accessToken, refreshToken, profile, done) {
  const sql = "SELECT * FROM user WHERE email = ?";
  db.query(sql, [profile.emails[0].value], (err, result) => {
    if (err) return done(err);
    if (result.length) {
      // User exists, update username if it has changed and log them in
      const user = result[0];
      if (user.username !== profile.displayName) {
        db.query('UPDATE user SET username = ? WHERE email = ?', [profile.displayName, user.email], (err) => {
          if (err) return done(err);
          user.username = profile.displayName;
          return done(null, user);
        });
      } else {
        return done(null, user);
      }
    } else {
      // User doesn't exist, create new user
      const newUser = {
        username: profile.displayName,
        email: profile.emails[0].value
      };
      db.query('INSERT INTO user SET ?', newUser, (err, res) => {
        if (err) return done(err);
        newUser.email = profile.emails[0].value;
        return done(null, newUser);
      });
    }
  });
}));
app.get('/auth/facebook', passport.authenticate('facebook', { scope: ['email'] }));
app.get('/auth/facebook/callback',
  passport.authenticate('facebook', { failureRedirect: '/login' }),
  function (req, res) {
    const token = generateToken(req.user);
    res.redirect(`http://localhost:3000/?token=${token}`);
  }
);

//login via github
passport.use(new GitHubStrategy({
  clientID: process.env.GITHUB_CLIENT_ID,
  clientSecret: process.env.GITHUB_CLIENT_SECRET,
  callbackURL: "http://localhost:8088/auth/github/callback"
},
  function (accessToken, refreshToken, profile, done) {
    const sql = "SELECT * FROM user WHERE email = ?";
    db.query(sql, [profile.emails[0].value], (err, result) => {
      if (err) return done(err);
      if (result.length) {
        // User exists, update username if it has changed and log them in
        const user = result[0];
        if (user.username !== profile.username) {
          db.query('UPDATE user SET username = ? WHERE email = ?', [profile.username, user.email], (err) => {
            if (err) return done(err);
            user.username = profile.username;
            return done(null, user);
          });
        } else {
          return done(null, user);
        }
      } else {
        // User doesn't exist, create new user
        const newUser = {
          username: profile.username,
          email: profile.emails[0].value
        };
        db.query('INSERT INTO user SET ?', newUser, (err, res) => {
          if (err) return done(err);
          newUser.email = profile.emails[0].value;
          return done(null, newUser);
        });
      }
    });
  }
));
app.get('/auth/github',
  passport.authenticate('github', { scope: ['user:email'] }));
app.get('/auth/github/callback',
  passport.authenticate('github', { failureRedirect: '/login' }),
  function (req, res) {
    const token = generateToken(req.user);
    // Successful authentication, redirect home.
    res.redirect(`http://localhost:3000/?token=${token}`);
  });

//update profile 
app.post('/updateuser',(req,res)=>{
  const sql="UPDATE user set username = ?, phone=?,address=? where email=? "
  const values=[
    req.body.username,
    req.body.phone,
    req.body.address,
    req.body.email
  ]
  db.query(sql, values, (err, data) => {
    if (err) {
      return res.status(500).json("Error");
    }
    return res.json(data);
  });
})
// upload image
app.post('/upload',upload.single('image'),(req,res) =>{
    const image=req.file.filename;
    const sql="update user set image_url=? where consumerid=?"
    db.query(sql,[image,req.body.consumerid],(err,result) => {
    if (err) return res.json({status:"false"});
    return res.json({status:"true", filename: image})
})
})

//cart
// app.post('/addtocart', (req, res) => {
//   const checkedSql = "SELECT * FROM cart WHERE user_id = ? AND product_id = ?"
//   const values = [
//     req.body.quantity,
//     req.body.userid,
//     req.body.productid,
//   ]
//   db.query(checkedSql, [req.body.userid,req.body.productid,], (error, checkData) => {
//     if (error) {
//       return res.status(500).json("error")
//     }
//     if (checkData.length > 0) {
//       const updateSql = "UPDATE cart SET quantity = ? WHERE user_id = ? AND product_id = ?"
//       db.query(updateSql, values, (err, data) => {
//         if (err) {
//           return res.status(500).json("error")
//         }
//         return res.json(data);
//       })
//     } else {
//       const insertSql = "INSERT INTO `cart`(`quantity`,`user_id`,`product_id`) VALUES (?,?,?)"
//       db.query(insertSql, values, (err, data) => {
//         if (err) {
//           return res.status(500).json("error")
//         }
//         return res.json(data);
//       })
//     }
//   }) ;
// })

// app.delete('/removefromcart/:userid/:productid', (req, res) => {
//   const sql = "DELETE FROM `cart` WHERE  `user_id` = ? AND `product_id` = ?"
//   const values = [
//     req.params.userid,
//     req.params.productid,
//   ]
//   db.query(sql, values, (err, data) => {
//     if (err) {
//       return res.status(500).json("error")
//     }
//     return res.json(data);
//   })
// });

// app.post('/cart', (req, res) => {
//   const sql = "select c.quantity , p.* from cart c join product p on c.product_id = p.productid where c.user_id = ?";
//   // const values = [
//   //   req.body.userid,
//   // ]
//   const userId = [req.body.userId];
//   db.query(sql, userId,(err, data) => {
//     if (err) {
//       return res.json("Error")
//     }
//     if (data.length > 0) {
//       return res.json(data)
//     } else {
//       return res.json("No item in cart")
//     }
//   })
// })

app.get('/api/products', (req, res) => {
  const sql = `
    SELECT 
      product.*, 
      category.categoryname, 
      category.material,
      CASE 
        WHEN category.gender = 0 THEN 'Nam'
        WHEN category.gender = 1 THEN 'Nữ'
        ELSE 'Khác'
      END AS gender
    FROM product
    JOIN category ON product.category = category.categoryid
  `;

  db.query(sql, (err, data) => {
    if (err) {
      console.error('Error fetching products:', err.message);
      return res.status(500).json({ error: err.message });
    }
    if (data.length > 0) {
      console.log(data);
      return res.json(data);
    } else {
      return res.json([]);
    }
  });
});


// Endpoint để lấy dữ liệu cho bộ lọc
app.get('/api/filters', (req, res) => {
  const queries = [
    "SELECT DISTINCT NULLIF(brand, '') AS brand FROM product WHERE brand IS NOT NULL",
    "SELECT DISTINCT NULLIF(goldage, '') AS goldage FROM product WHERE goldage IS NOT NULL",
    "SELECT DISTINCT NULLIF(material, '') AS material FROM category WHERE material IS NOT NULL",
    "SELECT DISTINCT CASE gender WHEN 0 THEN 'Nam' WHEN 1 THEN 'Nữ' END AS gender FROM category WHERE gender IS NOT NULL",
    "SELECT DISTINCT NULLIF(categoryname, '') AS categoryname FROM category WHERE categoryname IS NOT NULL"
  ];

  Promise.all(queries.map(query => 
    new Promise((resolve, reject) => {
      db.query(query, (err, results) => {
        if (err) reject(err);
        resolve(results);
      });
    })
  ))
  .then(([brands, goldAges, materials, genders, productTypes]) => {
    const filters = {
      brands: ['Tất cả', ...brands.map(b => b.brand)],
      goldAges: ['Tất cả', ...goldAges.map(g => g.goldage)],
      materials: ['Tất cả', ...materials.map(m => m.material)],
      genders: ['Tất cả', ...genders.map(g => g.gender)],
      productTypes: ['Tất cả', ...productTypes.map(p => p.categoryname)]
    };
    res.json(filters);
  })
  .catch(err => {
    console.error('Error fetching filters:', err);
    res.status(500).json({ error: "Internal server error" });
  });
});


////////////Cart
app.post('/addtocart', (req, res) => {
  const checkedSql = "SELECT * FROM cart WHERE user_id = ? AND product_id = ? AND size = ?"
  const values = [
    req.body.quantity,
    req.body.userid,
    req.body.productid,
    req.body.size
  ]
  db.query(checkedSql, [req.body.userid,req.body.productid,req.body.size,], (error, checkData) => {
    if (error) {
      return res.status(500).json("error")
    }
    if (checkData.length > 0) {
      const updateSql = "UPDATE cart SET quantity = quantity + ? WHERE user_id = ? AND product_id = ? AND size = ?"
      db.query(updateSql, values, (err, data) => {
        if (err) {
          return res.status(500).json("error")
        }
        return res.json(data);
      })
    } else {
      const insertSql = "INSERT INTO `cart`(`quantity`,`user_id`,`product_id`,`size`) VALUES (?,?,?,?)"
      db.query(insertSql, values, (err, data) => {
        if (err) {
          return res.status(500).json("error")
        }
        return res.json(data);
      })
    }
  }) ;
})

app.delete('/removefromcart/:cartid', (req, res) => {
  const sql = "DELETE FROM `cart` WHERE `cart_id` = ?"
  const values = [
    req.params.cartid,
  ]
  db.query(sql, values, (err, data) => {
    if (err) {
      return res.status(500).json("error")
    }
    return res.json(data);
  })
});

app.post('/cart', (req, res) => {
  const sql = "select c.quantity , c.size, c.cart_id as cartid, p.* from cart c join product p on c.product_id = p.productid where c.user_id = ?";
  // const values = [
  //   req.body.userid,
  // ]
  const userId = [req.body.userId];
  db.query(sql, userId,(err, data) => {
    if (err) {
      return res.json("Error")
    }
    if (data.length > 0) {
      return res.json(data)
    } else {
      return res.json("No item in cart")
    }
  })
});

app.post('/order', (req, res) => {
  const { userId, total, phone, address, email, paymentStatus, items } = req.body;
  const sql = "INSERT INTO order_detail(user_id, total, payment_status, phone, address, email) VALUES (?,?,?,?,?,?)";
  const value = [
    req.body.userId,
    req.body.total,
    req.body.paymentStatus,
    req.body.phone,
    req.body.address,
    req.body.email,
  ]
  // const values = [
  //   req.body.userid,
  // ]
  db.query(sql, value, async (err, result) => {
    if (err) {
      return res.json("Error")
    }
    const orderDetailId = result.insertId;
    items.forEach(item => {
      const sql2 = "INSERT INTO order_item(order_id, product_id, size, quantity) VALUES (?,?,?,?)";
      db.query(sql2,[orderDetailId, item.productId, item.size, item.quantity], (err2, data) => {
        if(err2) {
          return res.json("Error 2");
        }
        //https://img.vietqr.io/image/<BANK_ID>-<ACCOUNT_NO>-<TEMPLATE>.png?amount=<AMOUNT>&addInfo=<DESCRIPTION>
        const sql3 = "DELETE FROM cart WHERE product_id = ? and size = ?"
        db.execute(sql3,[item.productId, item.size]);
        //TODO update inventory
        const sql4 = "UPDATE product SET amount = amount - ? where productid = ?"
        db.execute(sql4,[item.quantity, item.productId]);
        if (paymentStatus === 1) {
          return res.json({ message: 'Cảm ơn bạn đã đặt hàng' });
        } else {
          const imageUrl = `https://img.vietqr.io/image/970415-105001062900-print.png?amount=${total}&addInfo=DONHANG%20${orderDetailId}`;
          return res.json({ imageUrl });
        }
        // return res.json(data);
      })
    });
  })
});

app.post('/userInfomation', (req, res) => {
  const sql = "select * from `user` where consumerid = ?";
  // const values = [
  //   req.body.userid,
  // ]
  const userId = [req.body.userId];
  db.query(sql, userId,(err, data) => {
    if (err) {
      return res.json("Error")
    }
    if (data.length > 0) {
      return res.json(data)
    } else {
      return res.json("No user match")
    }
  })
});

app.get('/orders', (req, res) => {
  const sql = "select od.*, u.username from order_detail od join `user` u on u.consumerid = od.user_id order by order_date desc";
  // const values = [
  //   req.body.userid,
  // ]
  db.query(sql,(err, data) => {
    if (err) {
      return res.json("Error")
    }
    if (data.length > 0) {
      return res.json(data)
    } else {
      return res.json("No order till now")
    }
  })
});

app.get('/orders/:orderId/items', async (req, res) => {
  const { orderId } = req.params;
  // const connection = await mysql.createConnection(dbConfig);
  // const [rows] = await connection.query(`
    
  // `, [orderId]);
  const sql = ` SELECT oi.order_item_id, oi.order_id, oi.product_id, oi.size, oi.quantity, p.name, p.image 
    FROM order_item oi 
    JOIN product p ON oi.product_id = p.productid 
    WHERE oi.order_id = ?
  `
  db.query(sql,[orderId],(err, data) => {
    if (err) {
      return res.json("Error")
    }
    return res.json(data)
  })
});

app.put('/orders/:orderId', async (req, res) => {
  const { orderId } = req.params;
  const { paymentStatus } = req.body;
  // const connection = await mysql.createConnection(dbConfig);
  const sql = 'UPDATE order_detail SET payment_status = ? WHERE order_id = ?';
  
  db.query(sql,[paymentStatus, orderId],(err, data) => {
    if (err) {
      return res.json("Error")
    }
    return res.json(data)
  })
  // res.status(204).send();
});

//AI
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);
const model = genAI.getGenerativeModel({ model: 'gemini-pro' });
async function getKnowledgeBase() {
  try {
    const query = 'SELECT topic, content FROM knowledge_base';
    return new Promise((resolve, reject) => {
      db.query(query, (error, rows) => {
        if (error) {
          console.error('Error fetching knowledge base:', error);
          reject(error);
        } else {
          const knowledgeBaseText = rows.reduce((acc, row) => {
            return acc + `\n\nTopic: ${row.topic}\n${row.content}`;
          }, '');
          resolve(knowledgeBaseText);
        }
      });
    });
  } catch (error) {
    throw error;
  }
}

// Function to process chat with knowledge base
async function processChatWithKnowledgeBase(userMessage) {
  try {
    // Fetch knowledge base from database
    const knowledgeBase = await getKnowledgeBase();

    // Create prompt for Gemini API
    const prompt = `
      Here is the knowledge base that the chatbot has access to:
      ${knowledgeBase}

      Based on this knowledge base, please provide a relevant and informative response to the following user question:
      User Question: ${userMessage}
    `;

    const result = await model.generateContent(prompt);
    return result.response.text;
  } catch (error) {
    console.error('Error processing chat:', error);
    throw error;
  }
}

// Function to save chat history
async function saveChatHistory(question, answer) {
  try {
    const query = 'INSERT INTO chat_history (question, answer, timestamp) VALUES (?, ?, NOW())';
    db.query(query, [question, answer], (error) => {
      if (error) {
        console.error('Error saving chat history:', error);
      }
    });
  } catch (error) {
    console.error('Error saving chat history:', error);
  }
}

// API Endpoints

// Process chat message
app.post('/api/chat', async (req, res) => {
  try {
    const { message } = req.body;
    const responseText = await processChatWithKnowledgeBase(message);
    await saveChatHistory(message, responseText);
    res.json({ response: responseText });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get chat history
app.get('/api/chat-history', (req, res) => {
  const query = 'SELECT * FROM chat_history ORDER BY timestamp DESC LIMIT 50';
  db.query(query, (error, rows) => {
    if (error) {
      res.status(500).json({ error: 'Failed to retrieve chat history.' });
    } else {
      res.json(rows);
    }
  });
});

app.listen(8088, () => {
  console.log("listening")
})

function hashPass(content) {
  if (typeof content !== 'string') {
    content = JSON.stringify(content);
  }
  return createHash('sha256').update(content).digest('hex');
}