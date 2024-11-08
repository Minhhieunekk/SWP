const { createHash } = require('crypto')
const express = require("express");
const mysql = require('mysql2');
const cors = require('cors');
const nodemailer = require('nodemailer');
const passport = require('passport');
const session = require('express-session');
const cookieParser = require('cookie-parser');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const path = require('path');
const bodyParser = require('body-parser');
const { ChatGoogleGenerativeAI } = require('@langchain/google-genai');
const { SqlDatabase } = require("langchain/sql_db")
const { createSqlQueryChain } = require("langchain/chains/sql_db");
const { QuerySqlTool } = require('langchain/tools/sql');
const { ChatPromptTemplate, MessagesPlaceholder, SystemMessagePromptTemplate } = require('@langchain/core/prompts');
const { StringOutputParser } = require('@langchain/core/output_parsers');
const { RunnablePassthrough, RunnableSequence } = require('@langchain/core/runnables');
const { DataSource } = require('typeorm')
const GitHubStrategy = require('passport-github2').Strategy;
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const FacebookStrategy = require('passport-facebook').Strategy;


require('dotenv').config();


const app = express();
app.use('/avatar', express.static('public/avatar'));
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'public/avatar')
  },
  filename: (req, file, cb) => {
    cb(null, file.fieldname + "_" + Date.now() + path.extname(file.originalname));
  }
})

const upload = multer({
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
app.use(bodyParser.json());
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
  const newProduct = req.body;
  console.log('Received new product data:', newProduct);

  // Convert gender to binary
  const genderBinary = newProduct.gender.toLowerCase() === 'nam' ? 0 : 1;
  console.log('Converted gender to binary:', {
    originalGender: newProduct.gender,
    genderBinary: genderBinary
  });

  // Convert goldage to null if "Không có"
  const goldageValue = newProduct.goldage === 'Không có' ? null : newProduct.goldage;
  console.log('Processed goldage:', {
    originalGoldage: newProduct.goldage,
    processedGoldage: goldageValue
  });

  // Begin transaction
  db.beginTransaction(err => {
    if (err) {
      console.error('Error starting transaction:', err);
      return res.status(500).json({
        error: 'Failed to start transaction',
        details: err.message
      });
    }
    console.log('Transaction started successfully');

    // Get categoryId
    const categoryQuery = 'SELECT categoryid FROM category WHERE categoryname = ? AND material = ? AND gender = ?';
    const categoryParams = [newProduct.categoryname, newProduct.material, genderBinary];
    console.log('Executing category query:', {
      query: categoryQuery,
      params: categoryParams
    });

    db.query(
      categoryQuery,
      categoryParams,
      (err, categoryResults) => {
        if (err) {
          console.error('Error getting category:', err);
          return db.rollback(() => {
            res.status(500).json({
              error: 'Failed to get category',
              details: err.message
            });
          });
        }
        console.log('Category query results:', categoryResults);

        if (categoryResults.length === 0) {
          console.log('No category found for the given parameters');
          return db.rollback(() => {
            res.status(404).json({
              error: 'Category not found'
            });
          });
        }

        const categoryId = categoryResults[0].categoryid;
        console.log('Found categoryId:', categoryId);

        // Get last productid
        const lastProductQuery = 'SELECT productid FROM product ORDER BY productid DESC LIMIT 1';
        console.log('Executing last product query:', lastProductQuery);

        db.query(
          lastProductQuery,
          (err, lastProductResults) => {
            if (err) {
              console.error('Error getting last product ID:', err);
              return db.rollback(() => {
                res.status(500).json({
                  error: 'Failed to get last product ID',
                  details: err.message
                });
              });
            }
            console.log('Last product query results:', lastProductResults);

            const nextProductId = lastProductResults.length > 0 ?
              lastProductResults[0].productid + 1 : 1;
            console.log('Next product ID:', nextProductId);

            // Generate product code
            const productCode = `VNJOS${String(nextProductId).padStart(4, '0')}`;
            console.log('Generated product code:', productCode);

            // Insert new product
            const insertProductQuery = `
                          INSERT INTO product (
                              name, 
                              price, 
                              category, 
                              brand, 
                              goldage, 
                              image,
                              code
                          ) VALUES (?, ?, ?, ?, ?,?, ?)
                      `;
            const insertProductParams = [
              newProduct.name,
              newProduct.price * 1.1,
              categoryId,
              newProduct.brand,
              goldageValue,
              newProduct.image,
              productCode
            ];
            console.log('Executing insert product query:', {
              query: insertProductQuery,
              params: insertProductParams
            });

            db.query(
              insertProductQuery,
              insertProductParams,
              (err, productResult) => {
                if (err) {
                  console.error('Error inserting product:', err);
                  return db.rollback(() => {
                    res.status(500).json({
                      error: 'Failed to insert product',
                      details: err.message
                    });
                  });
                }
                console.log('Product insert result:', productResult);

                const newProductId = productResult.insertId;
                console.log('New product ID:', newProductId);

                // Insert into inventory
                const insertInventoryQuery = `
                                  INSERT INTO inventory (
                                      prd_id,
                                      size,
                                      amount
                                  ) VALUES (?, ?, ?)
                              `;
                const insertInventoryParams = [
                  newProductId,
                  newProduct.size,
                  newProduct.amount
                ];
                console.log('Executing insert inventory query:', {
                  query: insertInventoryQuery,
                  params: insertInventoryParams
                });

                db.query(
                  insertInventoryQuery,
                  insertInventoryParams,
                  (err) => {
                    if (err) {
                      console.error('Error inserting inventory:', err);
                      return db.rollback(() => {
                        res.status(500).json({
                          error: 'Failed to insert inventory',
                          details: err.message
                        });
                      });
                    }
                    console.log('Inventory inserted successfully');

                    // Commit transaction
                    db.commit(err => {
                      if (err) {
                        console.error('Error committing transaction:', err);
                        return db.rollback(() => {
                          res.status(500).json({
                            error: 'Failed to commit transaction',
                            details: err.message
                          });
                        });
                      }
                      console.log('Transaction committed successfully');

                      res.status(201).json({
                        message: 'Product added successfully',
                        productId: newProductId,
                        productCode: productCode
                      });
                    });
                  }
                );
              }
            );
          }
        );
      }
    );
  });
});

//quản lý người dùng 
app.get('/manageruser', (req, res) => {
  const sql = `
    SELECT 
      u.consumerid, u.username, u.phone, u.email, u.address, u.image_url,
      SUM(od.total) AS total_spent, 
      COUNT(od.order_id) AS total_products
    FROM user u
    LEFT JOIN order_detail od ON u.consumerid = od.user_id
    GROUP BY u.consumerid
  `;

  db.query(sql, (err, results) => {
    if (err) {
      console.error('Error fetching users:', err);
      return res.status(500).json({ error: 'Error fetching users' });
    }
    res.json(results);
  });
});

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
        message: "Tên đăng nhập đã tồn tại",
        user: user
      });
    } else {
      return res.json({ exists: false });
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
      return res.json({ exists: true, message: "Email đã tồn tại" });
    } else {
      return res.json({ exists: false });
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
      return res.json({ exists: true, message: "Số điện thoại đã tồn tại" });
    } else {
      return res.json({ exists: false });
    }
  });
});

//product dashboard
app.get("/dashboard", (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const offset = (page - 1) * limit;

  // Truy vấn đếm tổng số sản phẩm với các bảng JOIN
  const countSql = `
    SELECT COUNT(*) as total 
    FROM product p
    JOIN category c ON p.category = c.categoryid
    JOIN inventory i ON p.productid = i.prd_id
  `;

  db.query(countSql, (err, countResult) => {
    if (err) {
      return res.status(500).json("Error counting products");
    }

    const totalProducts = countResult[0].total;
    const totalPages = Math.ceil(totalProducts / limit);

    // Truy vấn lấy sản phẩm cho trang hiện tại với các bảng JOIN
    const sql = `
      SELECT 
        p.productid,
        p.name,
        p.price,
        p.image,
        p.code,
        i.amount,
        i.size,
        c.categoryname,
        p.brand,
        c.material,
        p.goldage,
        p.image
      FROM 
        product p
      JOIN 
        category c ON p.category = c.categoryid
      JOIN 
        inventory i ON p.productid = i.prd_id
      ORDER BY p.productid
      LIMIT ? OFFSET ?
    `;

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



// lấy sản phẩm bằng productid
app.get('/productdetail', (req, res) => {
  const { productid } = req.query;
  const sql = `
    SELECT 
      p.productid,
      p.name,
      p.image,
      p.price,
      p.totalrate,
      p.peoplerate,
      p.description,
      p.brand,
      p.goldage,
      p.code,
      c.categoryname,
      c.material,
      c.gender,
      i.size,
      i.amount
    FROM 
      product p
    JOIN 
      category c ON p.category = c.categoryid
    JOIN 
      inventory i ON p.productid = i.prd_id
    WHERE 
      p.productid = ?
  `;

  db.query(sql, [productid], (err, data) => {
    if (err) {
      return res.status(500).json({ error: "Internal server error" });
    }
    if (data && data.length > 0) {
      return res.json({ product: data });
    } else {
      return res.status(404).json({ error: "Product not found" });
    }
  });
});


app.get("/home", (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = 4; // Display 4 products per page
  const offset = (page - 1) * limit;

  // Step 1: Get the last 10 products by productid
  const last10ProductsQuery = `
    SELECT * 
    FROM product 
    JOIN category ON product.category = category.categoryid 
    ORDER BY productid DESC 
    LIMIT 10
  `;

  db.query(last10ProductsQuery, (err, last10ProductsResult) => {
    if (err) {
      return res.status(500).json("Error fetching the last 10 products");
    }


    const totalProducts = last10ProductsResult.length;
    const totalPages = Math.ceil(totalProducts / limit);


    const paginatedProducts = last10ProductsResult.slice(offset, offset + limit);

    return res.json({
      products: paginatedProducts,
      currentPage: page,
      totalPages: totalPages,
      totalProducts: totalProducts
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
app.put('/updateproduct/:id', (req, res) => {
  const productId = req.params.id;
  const updatedProduct = req.body;
  console.log('Updating product ID:', productId);
  console.log('Updated product data:', updatedProduct);

  // Convert gender to binary
  const genderBinary = updatedProduct.gender.toLowerCase() === 'nam' ? 0 : 1;
  console.log('Converted gender:', { original: updatedProduct.gender, binary: genderBinary });

  // Convert goldage
  const goldageValue = updatedProduct.goldage === 'Không có' ? null : updatedProduct.goldage;
  console.log('Processed goldage:', { original: updatedProduct.goldage, processed: goldageValue });

  // Begin transaction
  db.beginTransaction(err => {
    if (err) {
      console.error('Error starting transaction:', err);
      return res.status(500).json({
        error: 'Failed to start transaction',
        details: err.message
      });
    }
    console.log('Transaction started for update');

    // Get categoryId
    const categoryQuery = 'SELECT categoryid FROM category WHERE categoryname = ? AND material = ? AND gender = ?';
    const categoryParams = [updatedProduct.categoryname, updatedProduct.material, genderBinary];
    console.log('Getting category:', { query: categoryQuery, params: categoryParams });

    db.query(categoryQuery, categoryParams, (err, categoryResults) => {
      if (err) {
        console.error('Error getting category:', err);
        return db.rollback(() => {
          res.status(500).json({
            error: 'Failed to get category',
            details: err.message
          });
        });
      }

      if (categoryResults.length === 0) {
        console.log('Category not found');
        return db.rollback(() => {
          res.status(404).json({
            error: 'Category not found'
          });
        });
      }

      const categoryId = categoryResults[0].categoryid;
      console.log('Found categoryId:', categoryId);

      // Update product
      const updateProductQuery = `
              UPDATE product 
              SET name = ?,
                  price = ?,
                  category = ?,
                  brand = ?,
                  goldage = ?,
                  image = ?
              WHERE productid = ?
          `;
      const updateProductParams = [
        updatedProduct.name,
        updatedProduct.price,
        categoryId,
        updatedProduct.brand,
        goldageValue,
        updatedProduct.image,
        productId
      ];
      console.log('Updating product:', { query: updateProductQuery, params: updateProductParams });

      db.query(updateProductQuery, updateProductParams, (err, productResult) => {
        if (err) {
          console.error('Error updating product:', err);
          return db.rollback(() => {
            res.status(500).json({
              error: 'Failed to update product',
              details: err.message
            });
          });
        }

        // Update inventory
        const updateInventoryQuery = `
                  UPDATE inventory 
                  SET size = ?,
                      amount = ?
                  WHERE prd_id = ?
              `;
        const updateInventoryParams = [updatedProduct.size, updatedProduct.amount, productId];
        console.log('Updating inventory:', { query: updateInventoryQuery, params: updateInventoryParams });

        db.query(updateInventoryQuery, updateInventoryParams, (err) => {
          if (err) {
            console.error('Error updating inventory:', err);
            return db.rollback(() => {
              res.status(500).json({
                error: 'Failed to update inventory',
                details: err.message
              });
            });
          }

          // Commit transaction
          db.commit(err => {
            if (err) {
              console.error('Error committing update transaction:', err);
              return db.rollback(() => {
                res.status(500).json({
                  error: 'Failed to commit update transaction',
                  details: err.message
                });
              });
            }
            console.log('Update transaction committed successfully');

            res.status(200).json({
              message: 'Product updated successfully',
              productId: productId
            });
          });
        });
      });
    });
  });
});

// Xóa sản phẩm
app.delete('/deleteproduct/:id', (req, res) => {
  const productId = req.params.id;
  console.log('Deleting product ID:', productId);

  // Begin transaction
  db.beginTransaction(err => {
    if (err) {
      console.error('Error starting delete transaction:', err);
      return res.status(500).json({
        error: 'Failed to start delete transaction',
        details: err.message
      });
    }
    console.log('Delete transaction started');

    // Delete from inventory first (due to foreign key constraint)
    const deleteInventoryQuery = 'DELETE FROM inventory WHERE prd_id = ?';
    console.log('Deleting from inventory:', { query: deleteInventoryQuery, params: [productId] });

    db.query(deleteInventoryQuery, [productId], (err) => {
      if (err) {
        console.error('Error deleting from inventory:', err);
        return db.rollback(() => {
          res.status(500).json({
            error: 'Failed to delete from inventory',
            details: err.message
          });
        });
      }

      // Then delete from product
      const deleteProductQuery = 'DELETE FROM product WHERE productid = ?';
      console.log('Deleting from product:', { query: deleteProductQuery, params: [productId] });

      db.query(deleteProductQuery, [productId], (err) => {
        if (err) {
          console.error('Error deleting product:', err);
          return db.rollback(() => {
            res.status(500).json({
              error: 'Failed to delete product',
              details: err.message
            });
          });
        }

        // Commit transaction
        db.commit(err => {
          if (err) {
            console.error('Error committing delete transaction:', err);
            return db.rollback(() => {
              res.status(500).json({
                error: 'Failed to commit delete transaction',
                details: err.message
              });
            });
          }
          console.log('Delete transaction committed successfully');

          res.status(200).json({
            message: 'Product deleted successfully',
            productId: productId
          });
        });
      });
    });
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
  const sql = "SELECT password FROM user WHERE consumerid = ?";
  const updateSql = "UPDATE user SET password = ? WHERE consumerid = ?";
  const { currentPassword, newPassword, userid } = req.body;

  // First check if current password matches
  db.query(sql, [userid], (err, result) => {
    0
    if (err) {
      return res.json({ success: false, messages: ["Lỗi hệ thống"] });
    }

    if (result.length === 0) {
      return res.json({ success: false, messages: ["Người dùng không tồn tại"] });
    }

    // Verify current password (assuming hashPass can also verify passwords)
    if (result[0].password !== hashPass(currentPassword)) {
      return res.json({ success: false, messages: ["Mật khẩu hiện tại không đúng"] });
    }

    // Update with new password
    db.query(updateSql, [hashPass(newPassword), userid], (updateErr, updateResult) => {
      if (updateErr) {
        return res.json({ success: false, messages: ["Lỗi cập nhật mật khẩu"] });
      }
      res.json({ success: true, messages: ["Đổi mật khẩu thành công"] });
    });
  });
});
app.post('/checkCurrentPassword', (req, res) => {
  const sql = "SELECT password FROM user WHERE consumerid = ?";
  const { currentPassword, userid } = req.body;

  db.query(sql, [userid], (err, result) => {
    if (err) {
      return res.json({ valid: false, message: "Lỗi hệ thống" });
    }

    if (result.length === 0) {
      return res.json({ valid: false, message: "Người dùng không tồn tại" });
    }

    const isValid = result[0].password === hashPass(currentPassword);
    res.json({
      valid: isValid,
      message: isValid ? "" : "Mật khẩu hiện tại không đúng"
    });
  });
});
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
app.post('/updateuser', (req, res) => {
  const sql = "UPDATE user set username = ?, phone=?,address=? where email=? "
  const values = [
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
app.post('/upload', upload.single('image'), (req, res) => {
  const image = req.file.filename;
  const sql = "update user set image_url=? where consumerid=?"
  db.query(sql, [image, req.body.consumerid], (err, result) => {
    if (err) return res.json({ status: "false" });
    return res.json({ status: "true", filename: image })
  })
})


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

app.get('/api/filterdashboard', (req, res) => {
  const queries = [
    "SELECT DISTINCT NULLIF(brand, '') AS brand FROM product WHERE brand IS NOT NULL",
    "SELECT DISTINCT NULLIF(goldage, '') AS goldage FROM product WHERE goldage IS NOT NULL",
    "SELECT DISTINCT NULLIF(material, '') AS material FROM category WHERE material IS NOT NULL",
    "SELECT DISTINCT CASE gender WHEN 0 THEN 'Nam' WHEN 1 THEN 'Nữ' END AS gender FROM category WHERE gender IS NOT NULL",
    "SELECT DISTINCT NULLIF(categoryname, '') AS categoryname FROM category WHERE categoryname IS NOT NULL",
    "SELECT DISTINCT NULLIF(size, '') AS size FROM inventory WHERE size IS NOT NULL"
  ];

  Promise.all(queries.map(query =>
    new Promise((resolve, reject) => {
      db.query(query, (err, results) => {
        if (err) reject(err);
        resolve(results);
      });
    })
  ))
    .then(([brands, goldAges, materials, genders, productTypes, sizes]) => {
      const filters = {
        brands: [...brands.map(b => b.brand)],
        goldAges: ["Không có", ...goldAges.map(g => g.goldage)],
        materials: [...materials.map(m => m.material)],
        genders: [...genders.map(g => g.gender)],
        productTypes: [...productTypes.map(p => p.categoryname)],
        sizes: [...sizes.map(s => s.size)]
      };
      res.json(filters);
    })
    .catch(err => {
      console.error('Error fetching filters:', err);
      res.status(500).json({ error: "Internal server error" });
    });
});
// Endpoint cho trang sức (jewelry)
app.get('/api/jewelry/:type', (req, res) => {
  const { type } = req.params;
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
    WHERE category.categoryname = ?
  `;

  db.query(sql, [type], (err, data) => {
    if (err) {
      console.error('Error fetching jewelry products:', err.message);
      return res.status(500).json({ error: err.message });
    }
    return res.json(data);
  });
});

// Endpoint cho chất liệu (materials)
app.get('/api/materials/:material', (req, res) => {
  const { material } = req.params;
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
    WHERE category.material = ?
  `;

  db.query(sql, [material], (err, data) => {
    if (err) {
      console.error('Error fetching material products:', err.message);
      return res.status(500).json({ error: err.message });
    }
    return res.json(data);
  });
});

// Endpoint cho quà tặng (gifts)
app.get('/api/gifts/:gender', (req, res) => {
  const { gender } = req.params;
  const genderValue = gender === 'Nam' ? 0 : 1;
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
    WHERE category.gender = ?
  `;

  db.query(sql, [genderValue], (err, data) => {
    if (err) {
      console.error('Error fetching gift products:', err.message);
      return res.status(500).json({ error: err.message });
    }
    return res.json(data);
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
  db.query(checkedSql, [req.body.userid, req.body.productid, req.body.size,], (error, checkData) => {
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
  });
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
  db.query(sql, userId, (err, data) => {
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
      db.query(sql2, [orderDetailId, item.productId, item.size, item.quantity], (err2, data) => {
        if (err2) {
          return res.json("Error 2");
        }
        //https://img.vietqr.io/image/<BANK_ID>-<ACCOUNT_NO>-<TEMPLATE>.png?amount=<AMOUNT>&addInfo=<DESCRIPTION>
        const sql3 = "DELETE FROM cart WHERE product_id = ? and size = ?"
        db.execute(sql3, [item.productId, item.size]);
        //TODO update inventory
        const sql4 = "UPDATE product SET amount = amount - ? where productid = ?"
        db.execute(sql4, [item.quantity, item.productId]);
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
  db.query(sql, userId, (err, data) => {
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
  db.query(sql, (err, data) => {
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
  db.query(sql, [orderId], (err, data) => {
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

  db.query(sql, [paymentStatus, orderId], (err, data) => {
    if (err) {
      return res.json("Error")
    }
    return res.json(data)
  })
  // res.status(204).send();
});



//feedback product
app.post('/submitFeedback', (req, res) => {
  const { user_id, product_id, rate, feedback } = req.body;

  const insertFeedback = `INSERT INTO feedback (user_id, product_id, rate, feedback) VALUES (?, ?, ?, ?)`;
  const updateProductRate = `
      UPDATE product
      SET totalrate = totalrate + ?, peoplerate = peoplerate + 1
      WHERE productid = ?
  `;

  db.query(insertFeedback, [user_id, product_id, rate, feedback], (err, result) => {
    if (err) {
      console.error("Error inserting feedback:", err);
      res.status(500).send("Error saving feedback");
      return;
    }

    db.query(updateProductRate, [rate, product_id], (updateErr) => {
      if (updateErr) {
        console.error("Error updating product rate:", updateErr);
        res.status(500).send("Error updating product rate");
      } else {
        res.send("Feedback submitted successfully");
      }
    });
  });
});

//Order info
app.get('/orderinfo/:consumerid', (req, res) => {
  const consumerId = req.params.consumerid;
  const sql = `
        SELECT 
        od.total, od.payment_status, od.order_date, od.order_status, 
        oi.size, oi.quantity,
        p.name, p.image, p.productid, p.code
      FROM order_detail od 
      INNER JOIN order_item oi ON od.order_id = oi.order_id
      INNER JOIN product p ON oi.product_id = p.productid
      WHERE od.user_id = ?

  `;
  db.query(sql, [consumerId], (err, result) => {
    if (err) {
      console.error("Error fetching order info:", err);
      res.status(500).send("Error fetching order info");
    } else {
      res.json(result);
    }
  });
});

app.listen(8088, () => {
  console.log("Server running on port 8088");
});



function hashPass(content) {
  if (typeof content !== 'string') {
    content = JSON.stringify(content);
  }
  return createHash('sha256').update(content).digest('hex');
}



// Tạo một DataSource mới cho TypeORM
const typeormDataSource = new DataSource({
  type: 'mysql',
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT ? parseInt(process.env.DB_PORT) : 3306,
  username: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'swpvip',
  entities: [], // Không sử dụng entities vì chúng ta chỉ dùng cho LangChain
  synchronize: false, // Không tự động đồng bộ hóa schema
  logging: false,
});

// Hàm khởi tạo hệ thống QA
const dbPromise = db.promise()
async function initializeQASystem() {
  const model = new ChatGoogleGenerativeAI({
    modelName: "gemini-1.5-flash",
    temperature: 0,
  });

  const systemPrompt = SystemMessagePromptTemplate.fromTemplate(`
    Bạn là một chuyên viên tư vấn trang sức chuyên nghiệp.
    Nhiệm vụ của bạn là:
    1. Phân tích câu hỏi của khách hàng.
    2. Tạo truy vấn vào cơ sở dữ liệu của chúng tôi để lấy thông tin cần thiết.
    3. Đưa ra câu trả lời chính xác và hữu ích dựa trên dữ liệu lấy được.
    4. Tư vấn dựa trên nhu cầu khách hàng mà không bao gồm bất kỳ câu lệnh SQL nào trong câu trả lời.

    Nguyên tắc trả lời:
    - Chỉ cung cấp thông tin liên quan trực tiếp đến câu hỏi.
    - Sử dụng ngôn ngữ tiếng Việt đơn giản, dễ hiểu.
    - Từ chối trả lời mọi câu hỏi về thông tin tài khoản/mật khẩu.
    - Trình bày kết quả dưới dạng bảng nếu có nhiều dữ liệu.
    - Không bao giờ hiển thị hoặc đề cập đến câu lệnh SQL trong câu trả lời.
  `);

  const chatPrompt = ChatPromptTemplate.fromMessages([
    systemPrompt,
    new MessagesPlaceholder("chat_history"),
    ["human", "{question}"]
  ]);

  // Tạo instance của SqlDatabase sử dụng dbPromise
  const knowledge_base = await SqlDatabase.fromDataSourceParams({
    appDataSource: typeormDataSource
  });

  const executeQuery = new QuerySqlTool(knowledge_base);
  const writeQuery = await createSqlQueryChain({
    llm: model,
    db: knowledge_base,
    dialect: "mysql"
  });

  const chain = RunnableSequence.from([
    RunnablePassthrough.assign({
      query: writeQuery
    }).assign({
      result: async (i) => {
        try {
          const queryResult = await executeQuery.invoke(i.query);
          // Trả về kết quả truy vấn mà không bao gồm SQL
          return queryResult;
        } catch (error) {
          console.error('Error executing query:', error);
          return 'Đã xảy ra lỗi khi truy vấn dữ liệu.';
        }
      },
    }),
    chatPrompt.pipe(model).pipe(new StringOutputParser()),
  ]);

  return { chain, knowledge_base };
}

// Hàm lấy lịch sử chat từ database
const getChatHistory = async () => {
  try {
    const [rows] = await dbPromise.query("SELECT * FROM chat_history ORDER BY timestamp DESC LIMIT 10");
    return rows;
  } catch (err) {
    console.error('Error fetching chat history:', err);
    return [];
  }
};

// Hàm lưu lịch sử chat vào database
const saveChatHistory = async (question, answer) => {
  try {
    const sql = "INSERT INTO chat_history (question, answer) VALUES (?, ?)";
    await dbPromise.execute(sql, [question, answer]);
    return true;
  } catch (err) {
    console.error('Error saving chat history:', err);
    return false;
  }
};

// Hàm xử lý phản hồi từ model
const processResponse = (response) => {
  // Loại bỏ bất kỳ đoạn mã SQL nào nếu có
  let cleaned = response.replace(/```sql[\s\S]*?```/gi, '');
  cleaned = cleaned.replace(/^\s*SQL\s*:\s*.*$/gi, '');
  return cleaned.trim();
};

// Khởi tạo hệ thống QA và lưu vào biến toàn cục
let qaSystem;

(async () => {
  try {
    qaSystem = await initializeQASystem();
    console.log("Hệ thống QA đã được khởi tạo thành công!");
  }
  catch (error) {
    console.error("Ứng dụng không thể khởi động do lỗi kết nối database hoặc khởi tạo QA:", error);
    process.exit(1);
  }
})();

// Endpoint xử lý chat
app.post('/api/chat', async (req, res) => {
  const { message } = req.body;

  if (!message) {
    return res.status(400).json({ response: 'Hãy nhập câu hỏi của bạn!' });
  }

  try {
    const chatHistory = await getChatHistory();
    const formattedHistory = chatHistory.map(entry => [
      { role: "human", content: entry.question },
      { role: "assistant", content: entry.answer }
    ]).flat();

    const result = await qaSystem.chain.invoke({
      question: message,
      chat_history: formattedHistory
    });

    // Xử lý phản hồi để loại bỏ SQL nếu có
    const cleanedResult = processResponse(result);

    const saveSuccess = await saveChatHistory(message, cleanedResult);
    if (!saveSuccess) {
      console.warn('Không thể lưu lịch sử chat.');
    }

    res.json({ response: cleanedResult });
  } catch (error) {
    console.error('Chat error:', error);
    res.status(500).json({ response: 'Đã xảy ra lỗi khi xử lý tin nhắn của bạn.' });
  }
});


