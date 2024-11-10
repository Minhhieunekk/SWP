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
const fs = require('fs');
const moment = require('moment');

require('dotenv').config();


const app = express();
app.use('/avatar', express.static('public/avatar'));
app.use('/images', express.static('public/images'));
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
    { username: user.username, consumerid: user.consumerid, password: user.password,admin: user.admin },
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
                              description,
                              code
                          ) VALUES (?, ?, ?, ?, ?,?,?, ?)
                      `;
            const insertProductParams = [
              newProduct.name,
              newProduct.price * 1.1,
              categoryId,
              newProduct.brand,
              goldageValue,
              newProduct.image,
              newProduct.description,
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
          u.consumerid,
          u.admin, 
          u.username, 
          u.phone, 
          u.email, 
          u.address, 
          u.image_url,
          COALESCE(SUM(od.total), 0) AS total_spent, 
          COALESCE(COUNT(od.order_id), 0) AS total_products
        FROM user u
        LEFT JOIN order_detail od ON u.consumerid = od.user_id 
        AND od.payment_status = 1 
        AND od.order_status = 5
        GROUP BY u.consumerid;

  `;

  db.query(sql, (err, results) => {
    if (err) {
      console.error('Error fetching users:', err);
      return res.status(500).json({ error: 'Error fetching users' });
    }
    res.json(results);
  });
});
//xoá người dùng và thay đổi quyền
app.delete('/manageruser/:userId', (req, res) => {
  const { userId } = req.params;
  const sql = 'DELETE FROM user WHERE consumerid = ?';

  db.query(sql, [userId], (err, result) => {
      if (err) {
          console.error('Error deleting user:', err);
          return res.status(500).json({ error: 'Error deleting user' });
      }
      res.status(200).json({ message: 'User deleted successfully' });
  });
});
app.put('/manageruser/:userId', (req, res) => {
  const { userId } = req.params;
  const { admin } = req.body;  // Admin value (0 or 1)
  const sql = 'UPDATE user SET admin = ? WHERE consumerid = ?';

  db.query(sql, [admin, userId], (err, result) => {
      if (err) {
          console.error('Error updating role:', err);
          return res.status(500).json({ error: 'Error updating role' });
      }
      res.status(200).json({ message: 'Role updated successfully' });
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
          password: user.password,
          admin: user.admin
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
    const sql = "SELECT username, consumerid, password,admin FROM user WHERE consumerid = ?";

    db.query(sql, [decoded.consumerid], (err, data) => {
      if (err) {
        return res.status(500).json({ message: "Database error" });
      }
      if (data.length > 0) {
        return res.json({
          username: data[0].username,
          consumerid: data[0].consumerid,
          password: data[0].password,
          admin:data[0].admin
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
  const search = req.query.search || '';

  // Only search by 'code'
  let whereClause = '1=1'; // Default condition
  let searchParam = [];

  if (search) {
    whereClause = 'p.code LIKE ?';
    searchParam = [`${search}`];
  }

  // Query to count total products with search condition
  const countSql = `
    SELECT COUNT(*) as total 
    FROM product p
    JOIN category c ON p.category = c.categoryid
    JOIN inventory i ON p.productid = i.prd_id
    WHERE ${whereClause}
  `;

  db.query(countSql, searchParam, (err, countResult) => {
    if (err) {
      console.error("Error counting products:", err);
      return res.status(500).json("Error counting products");
    }

    const totalProducts = countResult[0].total;
    const totalPages = Math.ceil(totalProducts / limit);

    // Query to fetch products with search condition and pagination
    const sql = `
      SELECT 
        p.productid,
        p.name,
        p.price,
        p.description,
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
      WHERE ${whereClause}
      ORDER BY p.productid
      LIMIT ? OFFSET ?
    `;

    // Combine search parameters with pagination parameters
    const queryParams = [...searchParam, limit, offset];

    db.query(sql, queryParams, (err, data) => {
      if (err) {
        console.error("Error fetching products:", err);
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
      p.price as old_price,
      CASE
        when d.discount_value is null then p.price
        when d.discount_value is not null then (p.price * (100-d.discount_value)/100) end as price,
      p.totalrate,
      p.peoplerate,
      p.description,
      p.brand,
      p.goldage,
      p.code,
      c.categoryname,
      c.material,
      c.gender,
      d.discount_value,
      i.size,
      i.amount
    FROM 
      product p
    JOIN 
      category c ON p.category = c.categoryid
    JOIN 
      inventory i ON p.productid = i.prd_id
    LEFT JOIN (SELECT * FROM discount WHERE CURDATE() BETWEEN discount.start_date AND discount.end_date) d ON d.discount_id = p.discount_id
    WHERE p.productid = ?
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
      SELECT product.productid , product.name, product.image, product.price as old_price, product.description, product.category, product.totalrate, product.peoplerate, product.brand, product.goldage, product.code, product.discount_id,
      CASE 
        when d.discount_value is null then product.price
        when d.discount_value is not null then (product.price * (100-d.discount_value)/100) end as price,
      d.discount_value ,
      category.*
      FROM product 
      JOIN category ON product.category = category.categoryid
      LEFT JOIN (SELECT * FROM discount WHERE CURDATE() BETWEEN discount.start_date AND discount.end_date) d ON d.discount_id = product.discount_id
      ORDER BY product.productid DESC 
      LIMIT 10;
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

//lấy sản phẩm giảm giá
app.get("/home/discount", (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 4;
  const offset = (page - 1) * limit;

  // First, get the total count of products that have a discount_id
  db.query("SELECT COUNT(*) as total FROM product WHERE product.discount_id IS NOT NULL", (err, countResult) => {
    if (err) {
      return res.status(500).json("Error counting products with discount");
    }

    const totalProducts = countResult[0].total;
    const totalPages = Math.ceil(totalProducts / limit);

    // Then, get the products with discount_id for the current page
    const sql = `
      SELECT product.*, 
        product.productid, 
        product.name, 
        product.image, 
        product.price AS old_price, 
        product.description, 
        product.category, 
        product.totalrate, 
        product.peoplerate, 
        product.brand, 
        product.goldage, 
        product.code, 
        product.discount_id,
        CASE 
          WHEN d.discount_value IS NULL THEN product.price 
          WHEN d.discount_value IS NOT NULL THEN (product.price * (100 - d.discount_value) / 100) 
        END AS price, 
        d.discount_value, 
        category.* 
      FROM product
      LEFT JOIN (SELECT * FROM discount WHERE CURDATE() BETWEEN discount.start_date AND discount.end_date) d ON d.discount_id = product.discount_id
      JOIN category ON product.category = category.categoryid
      WHERE product.discount_id IS NOT NULL
      ORDER BY product.productid DESC
      LIMIT ? OFFSET ?`;

    db.query(sql, [limit, offset], (err, data) => {
      if (err) {
        return res.status(500).json("Error fetching products with discount");
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
    const sql = `SELECT product.*,
    product.productid , product.name, product.image, product.price as old_price, product.description, product.category, product.totalrate, product.peoplerate, product.brand, product.goldage, product.code, product.discount_id,
    CASE 
      when d.discount_value is null then product.price
      when d.discount_value is not null then (product.price * (100-d.discount_value)/100) end as price,
      d.discount_value,
    category.*, 
    d.discount_value FROM product LEFT JOIN (SELECT * FROM discount WHERE CURDATE() BETWEEN discount.start_date AND discount.end_date) d ON d.discount_id = product.discount_id,category where product.category=category.categoryid and product.category between 1 and 6  ORDER BY productid LIMIT ? OFFSET ?`;
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
    const sql = `SELECT product.productid , product.name, product.image, product.price as old_price, product.description, product.category, product.totalrate, product.peoplerate, product.brand, product.goldage, product.code, product.discount_id,
    CASE 
      when d.discount_value is null then product.price
      when d.discount_value is not null then (product.price * (100-d.discount_value)/100) end as price,
      d.discount_value,
    category.*  
    FROM product LEFT JOIN (SELECT * FROM discount WHERE CURDATE() BETWEEN discount.start_date AND discount.end_date) d ON d.discount_id = product.discount_id,category where product.category=category.categoryid and product.category between 7 and 12  ORDER BY productid LIMIT ? OFFSET ?`;
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
    const sql = `SELECT
    product.productid , product.name, product.image, product.price as old_price, product.description, product.category, product.totalrate, product.peoplerate, product.brand, product.goldage, product.code, product.discount_id,
    category.*,
    CASE 
      when d.discount_value is null then product.price
      when d.discount_value is not null then (product.price * (100-d.discount_value)/100) end as price,
      d.discount_value
    FROM product LEFT JOIN (SELECT * FROM discount WHERE CURDATE() BETWEEN discount.start_date AND discount.end_date) d ON d.discount_id = product.discount_id,category where product.category=category.categoryid and product.category between 13 and 18  ORDER BY productid LIMIT ? OFFSET ?`;
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
    const sql = `SELECT 
      product.productid , product.name, product.image, product.price as old_price, product.description, product.category, product.totalrate, product.peoplerate, product.brand, product.goldage, product.code, product.discount_id,
      category.*,
      CASE 
        when d.discount_value is null then product.price
        when d.discount_value is not null then (product.price * (100-d.discount_value)/100) end as price,
        d.discount_value
     FROM product LEFT JOIN (SELECT * FROM discount WHERE CURDATE() BETWEEN discount.start_date AND discount.end_date) d ON d.discount_id = product.discount_id,category where product.category=category.categoryid and product.category between 19 and 24  ORDER BY productid LIMIT ? OFFSET ?`;
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
          const sql = `SELECT 
          product.productid, 
          product.name, 
          product.image, 
          product.price AS old_price, 
          product.description, 
          product.totalrate, 
          product.peoplerate, 
          product.brand, 
          product.goldage, 
          product.code, 
          product.discount_id,
          CASE 
              WHEN d.discount_value IS NULL THEN product.price
              ELSE (product.price * (100 - d.discount_value) / 100)
          END AS price,
          d.discount_value
        FROM 
          product
        LEFT JOIN 
          (SELECT * FROM discount WHERE CURDATE() BETWEEN discount.start_date AND discount.end_date) d 
          ON d.discount_id = product.discount_id
        WHERE 
          product.name LIKE ? 
        ORDER BY 
          product.productid DESC 
        LIMIT 10;
        `;
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
  const sql =  `SELECT 
          product.productid, 
          product.name, 
          product.image, 
          product.price AS old_price, 
          product.description, 
          product.totalrate, 
          product.peoplerate, 
          product.brand, 
          product.goldage, 
          product.code, 
          product.discount_id,
          CASE 
              WHEN d.discount_value IS NULL THEN product.price
              ELSE (product.price * (100 - d.discount_value) / 100)
          END AS price,
          d.discount_value
        FROM 
          product
        LEFT JOIN 
          (SELECT * FROM discount WHERE CURDATE() BETWEEN discount.start_date AND discount.end_date) d 
          ON d.discount_id = product.discount_id
        WHERE 
          product.productid = ? 
        ORDER BY 
          product.productid DESC 
        LIMIT 10;
        `;
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
                  description = ?,
                  image = ?
              WHERE productid = ?
          `;
      const updateProductParams = [
        updatedProduct.name,
        updatedProduct.price,
        categoryId,
        updatedProduct.brand,
        goldageValue,
        updatedProduct.description,
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
    subject: 'Mã OTP để Đặt Lại Mật Khẩu - Jewelry Store',
    text: `
      Kính gửi Quý khách,
  
      Chúng tôi nhận được yêu cầu đặt lại mật khẩu cho tài khoản của bạn trên hệ thống trang sức Jewelry. 
      Để hoàn tất quá trình, vui lòng nhập mã OTP dưới đây:
      
      Mã OTP: ${otp}
  
      Nếu bạn không yêu cầu thay đổi mật khẩu, vui lòng bỏ qua email này. 
  
      Cảm ơn bạn đã tin tưởng và sử dụng dịch vụ của chúng tôi. Chúng tôi luôn sẵn sàng hỗ trợ bạn.
  
      Trân trọng,
      Đội ngũ Hỗ trợ Khách hàng - Jewelry Store
    `
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
    db.query(updateSql, [hashPass(newPassword), email], (updateErr, updateResult) => {
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
      product.productid , product.name, product.image, product.price as old_price, product.description, product.category, product.totalrate, product.peoplerate, product.brand, product.goldage, product.code, product.discount_id, 
      category.categoryname, 
      category.material,
      CASE 
	      when d.discount_value is null then product.price
	      when d.discount_value is not null then (product.price * (100-d.discount_value)/100) end as price,
      d.discount_value,
      CASE 
        WHEN category.gender = 0 THEN 'Nam'
        WHEN category.gender = 1 THEN 'Nữ'
        ELSE 'Khác'
      END AS gender
    FROM product
    JOIN category ON product.category = category.categoryid
    LEFT JOIN (SELECT * FROM discount WHERE CURDATE() BETWEEN discount.start_date AND discount.end_date) d ON product.discount_id = d.discount_id
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
      product.productid , product.name, product.image, product.price as old_price, product.description, product.category, product.totalrate, product.peoplerate, product.brand, product.goldage, product.code, product.discount_id, 
      category.categoryname, 
      category.material,
      CASE 
        when d.discount_value is null then product.price
        when d.discount_value is not null then (product.price * (100-d.discount_value)/100) end as price,
      d.discount_value,
      CASE 
        WHEN category.gender = 0 THEN 'Nam'
        WHEN category.gender = 1 THEN 'Nữ'
        ELSE 'Khác'
      END AS gender
    FROM product
    JOIN category ON product.category = category.categoryid
    LEFT JOIN (SELECT * FROM discount WHERE CURDATE() BETWEEN discount.start_date AND discount.end_date) d ON product.discount_id = d.discount_id
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
      product.productid , product.name, product.image, product.price as old_price, product.description, product.category, product.totalrate, product.peoplerate, product.brand, product.goldage, product.code, product.discount_id, 
      category.categoryname, 
      category.material,
      CASE 
        when d.discount_value is null then product.price
        when d.discount_value is not null then (product.price * (100-d.discount_value)/100) end as price,
      d.discount_value,
      CASE 
        WHEN category.gender = 0 THEN 'Nam'
        WHEN category.gender = 1 THEN 'Nữ'
        ELSE 'Khác'
      END AS gender
    FROM product
    JOIN category ON product.category = category.categoryid
    LEFT JOIN (SELECT * FROM discount WHERE CURDATE() BETWEEN discount.start_date AND discount.end_date) d ON product.discount_id = d.discount_id
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
      product.productid , product.name, product.image, product.price as old_price, product.description, product.category, product.totalrate, product.peoplerate, product.brand, product.goldage, product.code, product.discount_id, 
      category.categoryname, 
      category.material,
      CASE 
        when d.discount_value is null then product.price
        when d.discount_value is not null then (product.price * (100-d.discount_value)/100) end as price,
      d.discount_value,
      CASE 
        WHEN category.gender = 0 THEN 'Nam'
        WHEN category.gender = 1 THEN 'Nữ'
        ELSE 'Khác'
      END AS gender
    FROM product
    JOIN category ON product.category = category.categoryid
    LEFT JOIN (SELECT * FROM discount WHERE CURDATE() BETWEEN discount.start_date AND discount.end_date) d ON product.discount_id = d.discount_id
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
      // const updateSql = "UPDATE cart SET quantity = quantity + ? WHERE user_id = ? AND product_id = ? AND size = ?"
      // db.query(updateSql, values, (err, data) => {
      //   if (err) {
      //     return res.status(500).json("error")
      //   }
      //   return res.json(data);
      // })
      return res.json('Existed');
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
  const sql = `select c.quantity , c.size, c.cart_id as cartid, 
    p.productid , p.name, p.image, p.price as old_price, p.description, p.category, p.totalrate, p.peoplerate, p.brand, p.goldage, p.code, p.discount_id,
    i.amount,
    CASE 
      when d.discount_value is null then p.price
      when d.discount_value is not null then (p.price * (100-d.discount_value)/100) end as price 
    from cart c 
    join product p on c.product_id = p.productid 
    join inventory i on i.prd_id = p.productid 
    left join 
      (SELECT * FROM discount WHERE CURDATE() BETWEEN discount.start_date AND discount.end_date) d
      on p.discount_id = d.discount_id
    where c.size = i.size and c.user_id = ?`;
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
    let textToMail = "";
    items.forEach(item => {
      const sql2 = "INSERT INTO order_item(order_id, product_id, size, quantity) VALUES (?,?,?,?)";
      textToMail = textToMail + item.name + " - Size: " + item.size + " x " + item.quantity + "\n";
      db.query(sql2, [orderDetailId, item.productId, item.size, item.quantity], (err2, data) => {
        if (err2) {
          return res.json("Error 2");
        }
        //https://img.vietqr.io/image/<BANK_ID>-<ACCOUNT_NO>-<TEMPLATE>.png?amount=<AMOUNT>&addInfo=<DESCRIPTION>
        const sql3 = "DELETE FROM cart WHERE product_id = ? and size = ?"
        db.execute(sql3, [item.productId, item.size]);
        //TODO update inventory
        const sql4 = "UPDATE inventory SET amount = amount - ? where prd_id = ? and size = ?"
        db.execute(sql4, [item.quantity, item.productId, item.size]);
        // return res.json(data);
      })
    });
    if (paymentStatus === 1) {
      //(email, template, phone, address, listItem, total)
      sendEmail(req.body.email, 'templates/mail_order_template1.txt', req.body.phone, req.body.address, textToMail, req.body.total);
      return res.json({ message: 'Cảm ơn bạn đã đặt hàng' });
    } else {
      sendEmail(req.body.email, 'templates/mail_order_template1.txt', req.body.phone, req.body.address, textToMail, req.body.total);
      const imageUrl = `https://img.vietqr.io/image/970415-105001062900-print.png?amount=${total}&addInfo=DONHANG%20${orderDetailId}`;
      return res.json({ imageUrl });
    }
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

// app.get('/orders', (req, res) => {
//   const sql = "select od.*, u.username from order_detail od join `user` u on u.consumerid = od.user_id order by order_date desc";
//   // const values = [
//   //   req.body.userid,
//   // ]
//   db.query(sql,(err, data) => {
//     if (err) {
//       return res.json("Error")
//     }
//     if (data.length > 0) {
//       return res.json(data)
//     } else {
//       return res.json("No order till now")
//     }
//   })
// });

const formatDate = (date) => {
  return `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')}`;
};

// API to fetch orders
app.get('/orders', (req, res) => {
  const { startDate, endDate, paymentStatus, status, numberPerPage, page, sortColumn, sortDirection } = req.query;

  const start = new Date(startDate || new Date(new Date().setDate(new Date().getDate() - 7)));
  const end = new Date(endDate || new Date());

  // Set end time to 23:59:59
  start.setHours(0, 0, 0, 0)
  end.setHours(23, 59, 59, 999);

  const statusFilter = status === '-1' ? '' : `AND od.order_status = ${status}`;
  const paymentFilter = paymentStatus === '-1' ? '' : ` AND od.payment_status = ${paymentStatus} `
  const limit = parseInt(numberPerPage) || 10;
  const offset = (parseInt(page) - 1) * limit || 0;
  const column = sortColumn || 'order_date';
  const direction = sortDirection || 'DESC';

  const query = `
    SELECT od.*, u.username 
    FROM order_detail od
    JOIN user u ON u.consumerid = od.user_id
    WHERE od.order_date BETWEEN ? AND ?
    ${statusFilter}
    ${paymentFilter}
    ORDER BY od.${column} ${direction}
    LIMIT ? OFFSET ?
  `;

  db.query(query, [start, end, limit, offset], (err, results) => {
    if (err) {
      console.error(err);
      return res.status(500).send('Database query error');
    }

    const countQuery = `
      SELECT COUNT(*) AS total 
      FROM order_detail od
      JOIN user u ON u.consumerid = od.user_id
      WHERE od.order_date BETWEEN ? AND ?
      ${statusFilter}
    `;

    db.query(countQuery, [start, end], (err, countResults) => {
      if (err) {
        console.error(err);
        return res.status(500).send('Database query error');
      }

      const total = countResults[0].total;
      res.json({
        orders: results,
        total,
        totalPages: Math.ceil(total / limit),
      });
    });
  });
});




app.get('/orders/:orderId/items', async (req, res) => {
  const { orderId } = req.params;
  // const connection = await mysql.createConnection(dbConfig);
  // const [rows] = await connection.query(`

  // `, [orderId]);
  const sql = ` SELECT oi.order_item_id, oi.order_id, oi.product_id, oi.size, oi.quantity, p.name, p.image, p.price as old_price, i.amount,
    CASE 
    when d.discount_value is null then p.price
    when d.discount_value is not null then (p.price * (100-d.discount_value)/100) end as price
    FROM order_item oi 
    JOIN product p ON oi.product_id = p.productid
    JOIN inventory i on oi.product_id = i.prd_id
    left join 
      (SELECT * FROM discount WHERE CURDATE() BETWEEN discount.start_date AND discount.end_date) d
      on p.discount_id = d.discount_id
    WHERE oi.order_id = ? AND i.size=oi.size
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
  const sql = 'UPDATE order_detail SET payment_status = ?, updated_at = CURRENT_TIMESTAMP WHERE order_id = ? ';

  db.query(sql, [paymentStatus, orderId], (err, data) => {
    if (err) {
      return res.json("Error")
    }
    return res.json(data)
  })
  // res.status(204).send();
});

// // Fetch order details
// app.get('/order-details/:orderId', (req, res) => {
//   const { orderId } = req.params;

//   const query = `
//     SELECT oi.order_item_id, oi.order_id, oi.product_id, oi.size, oi.quantity, p.name, p.image, p.price as old price, p.amount
//     FROM order_item oi
//     JOIN product p ON oi.product_id = p.productid
//     WHERE oi.order_id = ?;
//   `;

//   db.query(query, [orderId], (err, rows) => {
//     if (err) return res.status(500).send({ error: 'Error fetching order items' });
//     res.json({ items: rows });
//   });
// });

// Update quantity of an order item
app.put('/order-item/quantity', (req, res) => {
  const { orderItemId, newQuantity } = req.body;

  // First, get the current product's amount to check if the new quantity is valid
  db.query('SELECT p.amount FROM order_item oi JOIN product p ON oi.product_id = p.productid WHERE oi.order_item_id = ?', [orderItemId], (err, result) => {
    if (err) return res.status(500).send({ error: 'Error fetching product data' });

    const availableAmount = result[0].amount;

    if (newQuantity > availableAmount) {
      return res.status(400).send({ error: 'Quantity exceeds available stock' });
    }

    // Update order item
    db.query(
      'UPDATE order_item SET quantity = ? WHERE order_item_id = ?',
      [newQuantity, orderItemId],
      (err, result) => {
        if (err) return res.status(500).send({ error: 'Error updating item quantity' });

        // Update product stock
        db.query('UPDATE product SET amount = amount - ? WHERE productid = (SELECT product_id FROM order_item WHERE order_item_id = ?)', [newQuantity, orderItemId], (err, result) => {
          if (err) return res.status(500).send({ error: 'Error updating product stock' });
          res.send({ message: 'Cập nhật đơn hàng thành công.' });
        });
      }
    );
  });
});

// Delete order item and update product stock
app.delete('/order-item/:orderItemId', (req, res) => {
  const { orderItemId } = req.params;

  // First, get the quantity to restore product stock
  db.query('SELECT quantity, product_id FROM order_item WHERE order_item_id = ?', [orderItemId], (err, result) => {
    if (err) return res.status(500).send({ error: 'Error fetching item data' });

    const { quantity, product_id } = result[0];

    // Delete order item
    db.query('DELETE FROM order_item WHERE order_item_id = ?', [orderItemId], (err, result) => {
      if (err) return res.status(500).send({ error: 'Error deleting order item' });

      // Restore product stock
      db.query('UPDATE product SET amount = amount + ? WHERE productid = ?', [quantity, product_id], (err, result) => {
        if (err) return res.status(500).send({ error: 'Error restoring product stock' });
        res.send({ message: 'Cập nhật đơn hàng thành công.' });
      });
    });
  });
});

// Update payment status of the order
app.put('/order/payment-status', (req, res) => {

  db.query(
    'UPDATE order_detail SET payment_status = 1, updated_at = CURRENT_TIMESTAMP WHERE order_id = ?',
    [orderId],
    (err, result) => {
      if (err) return res.status(500).send({ error: 'Error updating payment status' });
      res.send({ message: 'Cập nhật trạng thái thành công.' });
    }
  );
});

// Update order status of the order
app.put('/order/order-status', (req, res) => {
  const { orderId, status } = req.body;
  if (status === 5) {
        db.execute("UPDATE order_detail SET payment_status = 1, updated_at = CURRENT_TIMESTAMP WHERE order_id = ?", [orderId]);
  }
  db.query(
    'UPDATE order_detail SET order_status = ?, updated_at = CURRENT_TIMESTAMP WHERE order_id = ?',
    [status, orderId],
    (err, result) => {
      if (err) return res.status(500).send({ error: 'Error updating payment status' });
      res.send({ message: 'Cập nhật trạng thái thành công.' });
    }
  );
});

app.put('/orders/updateTotal', (req, res) => {
  const { orderId, newTotal } = req.body;

  db.query(
    'UPDATE order_detail SET total = ?, updated_at = CURRENT_TIMESTAMP WHERE order_id = ?',
    [newTotal, orderId],
    (err, result) => {
      if (err) return res.status(500).send({ error: 'Error updating payment status' });
      res.send({ message: 'Cập nhật trạng thái thành công.' });
    }
  );
});

// // Create a new discount
// app.post('/api/discounts', (req, res) => {
//   const {
//     discount_code,
//     discount_name,
//     discount_type,
//     start_date,
//     end_date,
//     discount_value,
//     discount_condition,
//     selected_products,
//     discount_description,  // New field
//   } = req.body;

//   // Check if required fields are provided and not null
//   if (!discount_code || !discount_name || !start_date || !end_date || !discount_value || !discount_description) {
//     return res.status(400).json({
//       error: 'All fields are required: discount_code, discount_name, start_date, end_date, discount_value, and discount_description',
//     });
//   }

//   // Check if discount_value is a valid number
//   if (isNaN(discount_value)) {
//     return res.status(400).json({ error: 'Discount value must be a valid number' });
//   }

//   const discountQuery = `
//     INSERT INTO discount (discount_code, discount_name, discount_type, start_date, end_date, discount_value, discount_condition, discount_description)
//     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`;

//   db.query(
//     discountQuery,
//     [
//       discount_code,
//       discount_name,
//       discount_type,
//       start_date,
//       end_date,
//       discount_value,
//       discount_condition || null, // Allow null for condition in product-based discount
//       discount_description, // Save description
//     ],
//     (err, result) => {
//       if (err) {
//         console.error('Error saving discount:', err);
//         return res.status(500).json({ error: 'Failed to create discount' });
//       }

//       const discountId = result.insertId;

//       if (discount_type === 1 && selected_products.length > 0) {
//         // Apply discount to products
//         selected_products.forEach((productId) => {
//           db.query('UPDATE product SET discount_id = ? WHERE productid = ?', [discountId, productId], (err) => {
//             if (err) {
//               console.error(`Error applying discount to product ${productId}:`, err);
//             }
//           });
//         });
//       }

//       res.status(201).json({ message: 'Discount created successfully', discountId });
//     }
//   );
// });

// Route: Get all discounts with pagination
app.get('/api/discounts', (req, res) => {
  const { page = 1, limit = 10 } = req.query;
  const offset = (page - 1) * limit;

  const sql = `SELECT * FROM discount LIMIT ${limit} OFFSET ${offset}`;
  db.query(sql, (err, results) => {
    if (err) {
      return res.status(500).json({ error: 'Error fetching discounts' });
    }
    const countSql = `SELECT COUNT(*) AS total FROM discount`;
    db.query(countSql, (countErr, countResults) => {
      if (countErr) {
        return res.status(500).json({ error: 'Error fetching total count' });
      }
      const totalPages = Math.ceil(countResults[0].total / limit);
      res.json({
        discounts: results,
        totalPages
      });
    });
  });
});

// Route: Get discount details by ID (with product list if discount_type = 1)
app.get('/api/discounts/:id', (req, res) => {
  const { id } = req.params;
  const sql = `SELECT * FROM discount WHERE discount_id = ?`;

  db.query(sql, [id], (err, discountResults) => {
    if (err) {
      return res.status(500).json({ error: 'Error fetching discount' });
    }
    if (discountResults.length === 0) {
      return res.status(404).json({ error: 'Discount not found' });
    }

    const discount = discountResults[0];

    // If discount type is 1, get the associated products
    if (discount.discount_type === 1) {
      const productSql = `SELECT * FROM product WHERE discount_id = ?`;
      db.query(productSql, [id], (productErr, productResults) => {
        if (productErr) {
          return res.status(500).json({ error: 'Error fetching products' });
        }
        res.json({
          discount,
          products: productResults
        });
      });
    } else {
      res.json({ discount });
    }
  });
});

// Route: Create a new discount
app.post('/api/discounts', (req, res) => {
  const { discount_code, discount_name, discount_type, start_date, end_date, discount_value, discount_condition, discount_description } = req.body;
  const sql = `INSERT INTO discount (discount_code, discount_name, discount_type, start_date, end_date, discount_value, discount_condition, discount_description) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`;

  db.query(sql, [discount_code, discount_name, discount_type, start_date, end_date, discount_value, discount_condition, discount_description], (err, results) => {
    if (err) {
      return res.status(500).json({ error: 'Error creating discount' });
    }
    res.status(201).json({ message: 'Discount created successfully', discount_id: results.insertId });
  });
});

// Route: Update an existing discount
app.put('/api/discounts/:id', (req, res) => {
  const { id } = req.params;
  const { discount_name, start_date, end_date, discount_value, discount_condition, discount_description } = req.body;

  const sql = `UPDATE discount SET discount_name = ?, start_date = ?, end_date = ?, discount_value = ?, discount_condition = ?, discount_description = ? WHERE discount_id = ?`;

  db.query(sql, [discount_name, start_date, end_date, discount_value, discount_condition, discount_description, id], (err, results) => {
    if (err) {
      return res.status(500).json({ error: 'Error updating discount' });
    }
    if (results.affectedRows === 0) {
      return res.status(404).json({ error: 'Discount not found' });
    }
    res.json({ message: 'Discount updated successfully' });
  });
});

// Route: Delete a discount
app.delete('/api/discounts/:id', (req, res) => {
  const { id } = req.params;

  // First, remove the association with products for discount type 1
  const removeProductsSql = `UPDATE product SET discount_id = NULL WHERE discount_id = ?`;
  db.query(removeProductsSql, [id], (err) => {
    if (err) {
      return res.status(500).json({ error: 'Error removing product associations' });
    }

    // Now delete the discount
    const deleteSql = `DELETE FROM discount WHERE discount_id = ?`;
    db.query(deleteSql, [id], (err, results) => {
      if (err) {
        return res.status(500).json({ error: 'Error deleting discount' });
      }
      if (results.affectedRows === 0) {
        return res.status(404).json({ error: 'Discount not found' });
      }
      res.json({ message: 'Discount deleted successfully' });
    });
  });
});

// Route: Assign products to a discount (for product-based discounts)
app.post('/api/discounts/:id/products', (req, res) => {
  const { id } = req.params;
  const { productIds } = req.body;  // Array of product IDs

  const sql = `UPDATE product SET discount_id = ? WHERE productid IN (?)`;

  db.query(sql, [id, productIds], (err, results) => {
    if (err) {
      return res.status(500).json({ error: 'Error assigning products to discount' });
    }
    res.json({ message: 'Products assigned to discount successfully' });
  });
});

// Route: Remove product from discount
app.post('/api/discounts/:id/remove-product', (req, res) => {
  const { id } = req.params;
  const { productIds } = req.body;  // Array of product IDs

  const sql = `UPDATE product SET discount_id = NULL WHERE productid IN (?) AND discount_id = ?`;

  db.query(sql, [productIds, id], (err, results) => {
    if (err) {
      return res.status(500).json({ error: 'Error removing products from discount' });
    }
    res.json({ message: 'Products removed from discount successfully' });
  });
});




function hashPass(content) {
  if (typeof content !== 'string') {
    content = JSON.stringify(content);
  }
  return createHash('sha256').update(content).digest('hex');
};

// Function to send email
const sendEmail = async (email, fileTemplate, phone, address, listItem, total) => {
  try {
    // Fetch user data from database
    // const user = await getUserData(userId);

    // Read the .txt template file
    fs.readFile(fileTemplate, 'utf8', (err, template) => {
      if (err) {
        console.log('Error reading the file:', err);
        return;
      }

      // Replace variables in the template with values from the database
      let emailContent = template;
      emailContent = emailContent.replace('{{listItem}}', listItem);
      emailContent = emailContent.replace('{{total}}', total);
      emailContent = emailContent.replace('{{address}}', address);
      emailContent = emailContent.replace('{{phone}}', phone);
      // Add more replacements as needed

      // Create a transporter using SMTP (example with Gmail)
      const transporter = nodemailer.createTransport({
        host: 'smtp.gmail.com',
        port: 587,
        secure: false,
        auth: {
          user: 'chidechoinum1@gmail.com',  // Using email from .env file
          pass: 'rmpakmoqvcreiwli',  // Using App Password from .env file
        },
      });

      // Email options
      const mailOptions = {
        from: 'chidechoinum1@gmail.com',  // Sender address (also from .env)
        to: email,                // Recipient's email
        subject: 'Đặt hàng thành công',
        text: emailContent,            // The text content for the email
      };

      // Send the email
      transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
          console.log('Error sending email:', error);
        } else {
          console.log('Email sent: ' + info.response);
        }
      });
    });
  } catch (err) {
    console.error('Error fetching user data:', err);
  }
};



app.get('/order-status-counts', (req, res) => {
  const { start_date, end_date } = req.query;
  const start = new Date(start_date || new Date(new Date().setDate(new Date().getDate() - 30)));
  const end = new Date(end_date || new Date());

  // Set end time to 23:59:59
  start.setHours(0, 0, 0, 0)
  end.setHours(23, 59, 59, 999);
  // Validate date format (YYYY-MM-DD)
  if (!start_date || !end_date) {
    return res.status(400).json({ error: 'Both start_date and end_date are required' });
  }

  // const query = `
  //   SELECT 
  //     (SELECT COUNT(*) FROM order_detail WHERE payment_status = 0 AND order_date BETWEEN ? AND ?) AS not_paid,
  //     (SELECT COUNT(*) FROM order_detail WHERE payment_status = 1 AND order_date BETWEEN ? AND ?) AS paid,
  //     (SELECT COUNT(*) FROM order_detail WHERE order_status = 1 AND order_date BETWEEN ? AND ?) AS received,
  //     (SELECT COUNT(*) FROM order_detail WHERE order_status = 2 AND order_date BETWEEN ? AND ?) AS packaging,
  //     (SELECT COUNT(*) FROM order_detail WHERE order_status = 3 AND order_date BETWEEN ? AND ?) AS shipping,
  //     (SELECT COUNT(*) FROM order_detail WHERE order_status = 4 AND order_date BETWEEN ? AND ?) AS done,
  //     (SELECT COUNT(*) FROM order_detail WHERE order_status = 0 AND order_date BETWEEN ? AND ?) AS cancel;
  // `;

  const query = `
    SELECT 
      (SELECT COUNT(*) FROM order_detail WHERE payment_status = 0 ) AS not_paid,
      (SELECT COUNT(*) FROM order_detail WHERE payment_status = 1 ) AS paid,
      (SELECT COUNT(*) FROM order_detail WHERE order_status = 1 ) AS received,
      (SELECT COUNT(*) FROM order_detail WHERE order_status = 2 ) AS confirm,
      (SELECT COUNT(*) FROM order_detail WHERE order_status = 3 ) AS packaging,
      (SELECT COUNT(*) FROM order_detail WHERE order_status = 4 ) AS shipping,
      (SELECT COUNT(*) FROM order_detail WHERE order_status = 5 ) AS done,
      (SELECT COUNT(*) FROM order_detail WHERE order_status = 6) AS failed,
      (SELECT COUNT(*) FROM order_detail WHERE order_status = 0 ) AS cancel;
  `;
  // Execute the query with the date range parameters
  db.query(query, [
    start, end,
    start, end,
    start, end,
    start, end,
    start, end,
    start, end,
    start, end
  ], (err, results) => {
    if (err) {
      console.error('Error fetching counts:', err);
      return res.status(500).json({ error: 'Database error' });
    }
    res.json(results[0]);
  });
});

// Helper function to get date range for the last 6 months
const getLastSixMonths = () => {
  const months = [];
  for (let i = 0; i < 6; i++) {
    months.push(moment().subtract(i, 'months').format('YYYY-MM'));
  }
  return months.reverse(); // Order from oldest to most recent
};

// 1. Earnings Overview (Today, This Month, All Time)
app.get('/earnings', (req, res) => {
  const query = `
    SELECT
      (SELECT SUM(total) FROM order_detail WHERE payment_status = 1 AND DATE(updated_at) = CURDATE()) AS today_earn,
      (SELECT SUM(total) FROM order_detail WHERE payment_status = 1 AND MONTH(updated_at) = MONTH(CURDATE()) AND YEAR(updated_at) = YEAR(CURDATE())) AS this_month_earn,
      (SELECT SUM(total) FROM order_detail WHERE payment_status = 1) AS all_time_earn
  `;

  db.query(query, (err, results) => {
    if (err) {
      console.error('Error fetching earnings:', err);
      return res.status(500).json({ error: 'Database error' });
    }
    res.json(results[0]);
  });
});

// 2. Product Sales by Category (Last 6 months)
app.get('/sales-by-category', (req, res) => {
  const months = getLastSixMonths(); // Get last 6 months

  // We will group by category and month, summing the quantity for each
  const query = `
    SELECT 
      CONCAT(YEAR(order_detail.order_date),'-',MONTH(order_detail.order_date)) AS month,
      SUM(CASE WHEN product.category BETWEEN 1 AND 6 THEN order_item.quantity ELSE 0 END) AS khuyen_tai_sales,
      SUM(CASE WHEN product.category BETWEEN 7 AND 12 THEN order_item.quantity ELSE 0 END) AS day_chuyen_sales,
      SUM(CASE WHEN product.category BETWEEN 13 AND 18 THEN order_item.quantity ELSE 0 END) AS vong_tay_sales,
      SUM(CASE WHEN product.category BETWEEN 19 AND 24 THEN order_item.quantity ELSE 0 END) AS nhan_sales
    FROM order_item
    JOIN product ON order_item.product_id = product.productid
    JOIN order_detail ON order_item.order_id = order_detail.order_id
    WHERE order_detail.payment_status = 1 AND CONCAT(YEAR(order_detail.order_date),'-',MONTH(order_detail.order_date)) IN (?)
    GROUP BY month
    ORDER BY month
  `;

  db.query(query, [months], (err, results) => {
    if (err) {
      console.error('Error fetching sales by category:', err);
      return res.status(500).json({ error: 'Database error' });
    }
    res.json(results);
  });
});

// 3. Order Status Overview (Last 6 months)
app.get('/order-status-overview', (req, res) => {
  const months = getLastSixMonths();
  const query = `
    SELECT
      CONCAT(YEAR(order_detail.order_date),'-',MONTH(order_detail.order_date)) AS month,
      COUNT(CASE WHEN order_detail.order_status = 0 THEN 1 END) AS canceled_orders,
      COUNT(*) AS total_orders
    FROM order_detail
    WHERE CONCAT(YEAR(order_detail.order_date),'-',MONTH(order_detail.order_date)) IN (?)
    GROUP BY month
  `;

  db.query(query, [months], (err, results) => {
    if (err) {
      console.error('Error fetching order status overview:', err);
      return res.status(500).json({ error: 'Database error' });
    }
    res.json(results);
  });
});

// 4. Monthly Earnings (Last 6 months)
app.get('/monthly-earnings', (req, res) => {
  const months = getLastSixMonths();
  const query = `
    SELECT 
      CONCAT(YEAR(order_detail.order_date),'-',MONTH(order_detail.order_date)) AS month,
      SUM(total) AS monthly_earnings
    FROM order_detail
    WHERE payment_status = 1 AND CONCAT(YEAR(order_detail.order_date),'-',MONTH(order_detail.order_date)) IN (?)
    GROUP BY month
  `;

  db.query(query, [months], (err, results) => {
    if (err) {
      console.error('Error fetching monthly earnings:', err);
      return res.status(500).json({ error: 'Database error' });
    }
    res.json(results);
  });
});

// 5. Top 10 Best Selling Products
app.get('/top-products', (req, res) => {
  const query = `
    SELECT product.name, SUM(order_item.quantity) AS total_sold
    FROM order_item
    JOIN product ON order_item.product_id = product.productid
    JOIN order_detail ON order_item.order_id = order_detail.order_id
    WHERE order_detail.payment_status = 1
    GROUP BY product.name
    ORDER BY total_sold DESC
    LIMIT 5
  `;

  db.query(query, (err, results) => {
    if (err) {
      console.error('Error fetching top products:', err);
      return res.status(500).json({ error: 'Database error' });
    }
    res.json(results);
  });
});

// 6. Top 5 Best Selling Products (Last 30 days)
app.get('/top-products-last-30-days', (req, res) => {
  const query = `
    SELECT product.name, SUM(order_item.quantity) AS total_sold
    FROM order_item
    JOIN product ON order_item.product_id = product.productid
    JOIN order_detail ON order_item.order_id = order_detail.order_id
    WHERE order_detail.payment_status = 1
      AND order_detail.order_date > CURDATE() - INTERVAL 30 DAY
    GROUP BY product.name
    ORDER BY total_sold DESC
    LIMIT 5
  `;

  db.query(query, (err, results) => {
    if (err) {
      console.error('Error fetching top products in the last 30 days:', err);
      return res.status(500).json({ error: 'Database error' });
    }
    res.json(results);
  });
});

app.post('/discount', (req, res) => {
  const {
    discount_code,
    discount_name,
    discount_type,
    start_date,
    end_date,
    discount_condition,
    discount_value,
    discount_description,
    selectedProducts
  } = req.body;

  // Basic validation
  if (!discount_code || !discount_name || !start_date || !end_date || !discount_value) {
    return res.status(400).json({ message: 'Please fill all required fields.' });
  }

  if (discount_type === 2 && !discount_condition) {
    return res.status(400).json({ message: 'Discount condition is required for order-level discount.' });
  }

  const query = `
    INSERT INTO discount (discount_code, discount_name, discount_type, start_date, end_date, discount_condition, discount_value, discount_description)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `;

  db.query(query, [discount_code, discount_name, discount_type, start_date, end_date, discount_type === 1 ? '0' : discount_condition, discount_value, discount_description || null], (err, result) => {
    if (err) {
      console.error('Error creating discount:', err);
      return res.status(500).json({ message: 'Internal server error.' });
    }

    const discount_id = result.insertId;

    // Case 1: If the discount type is for products (discount_type = 1), update the product.discount_id
    if (discount_type === 1 && selectedProducts && selectedProducts.length > 0) {
      const productDiscountQuery = 'UPDATE product SET discount_id = ? WHERE productid IN (?)';
      const productIds = selectedProducts.map(product => product.productid);

      db.query(productDiscountQuery, [discount_id, productIds], (err, result) => {
        if (err) {
          console.error('Error assigning products to discount:', err);
          return res.status(500).json({ message: 'Internal server error.' });
        }
      });
    }

    res.json({ message: 'Discount created successfully.', discount_id });
  });
});

// 2. Endpoint to fetch products with pagination and search
app.get('/get-products', (req, res) => {
  const { search = '' } = req.query; // default to page 1, limit 10
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const offset = (page - 1) * limit;

  const searchQuery = `%${search}%`;

  // Query to fetch paginated products
  const query = `
    SELECT productid, name, code 
    FROM product
    WHERE name LIKE ? OR code LIKE ?
    LIMIT ? offset ?
  `;

  db.query(query, [searchQuery, searchQuery, limit, offset], (err, results) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }

    // Get total count for pagination purposes
    db.query('SELECT COUNT(*) AS total FROM product WHERE name LIKE ? OR code LIKE ?', [searchQuery, searchQuery], (err, countResult) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      const totalItems = countResult[0].total;
      const totalPages = Math.ceil(totalItems / limit);

      res.json({
        products: results,
        totalItems,
        totalPages,
        currentPage: parseInt(page),
      });
    });
  });
});

// Backend code to handle pagination and filtering for the discount list

app.get('/get-all-discounts', (req, res) => {
  const { endDate, discountType, discountCode } = req.query;
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const offset = (page - 1) * limit;
  // const offset = (page - 1) * limit;

  let query = `SELECT * FROM discount WHERE 1=1`; // Base query

  // Filter by discount_code
  if (discountCode) {
    query += ` AND discount_code LIKE ?`;
  }

  // Filter by discount_type
  if (discountType) {
    query += ` AND discount_type = ?`;
  }

  // Filter by end_date
  if (endDate) {
    query += ` AND end_date <= ?`;
  }

  query += ` LIMIT ? OFFSET ?`; // Pagination
  const queryParams = [
    discountCode ? `%${discountCode}%` : null,
    discountType || null,
    endDate || null,
    limit,
    offset
  ].filter(param => param !== null); // Remove null values

  // Execute the query for fetching discounts
  db.query(query, queryParams, (err, results) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }

    // Get the total count for pagination with filters applied
    let countQuery = `SELECT COUNT(*) AS total FROM discount WHERE 1=1`; // Base count query

    // Apply the same filters to the count query
    if (discountCode) {
      countQuery += ` AND discount_code LIKE ?`;
    }
    if (discountType) {
      countQuery += ` AND discount_type = ?`;
    }
    if (endDate) {
      countQuery += ` AND end_date <= ?`;
    }

    const countQueryParams = [
      discountCode ? `%${discountCode}%` : null,
      discountType || null,
      endDate || null
    ].filter(param => param !== null); // Remove null values from the params

    // Execute the count query to get the total number of filtered records
    db.query(countQuery, countQueryParams, (err, countResult) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }

      const totalItems = countResult[0].total;
      const totalPages = Math.ceil(totalItems / limit);

      res.json({
        discounts: results,
        totalItems,
        totalPages,
        currentPage: parseInt(page),
      });
    });
  });
});

app.put('/update-product-discount', (req, res) => {
  const { productid, discount_id } = req.body;
  const query = 'UPDATE product SET discount_id = ? WHERE productid = ?';

  db.query(query, [discount_id, productid], (err, result) => {
    if (err) throw err;
    res.json({ message: 'Product discount updated successfully' });
  });
});

app.get('/products-by-discount/:discountId', (req, res) => {
  const { discountId } = req.params;
  const query = 'SELECT productid, name, code FROM product WHERE discount_id = ?';

  db.query(query, [discountId], (err, results) => {
    if (err) throw err;
    res.json(results);
  });
});

// Endpoint to update a discount (excluding discount_code and discount_type)
app.put('/update-discount', (req, res) => {
  const { discount_id, discount_name, discount_value, discount_condition, discount_description, start_date, end_date } = req.body;

  const query = `
    UPDATE discount 
    SET discount_name = ?, discount_value = ?, discount_condition = ?, discount_description = ?, start_date = ?, end_date = ?
    WHERE discount_id = ?
  `;

  db.query(query, [discount_name, discount_value, discount_condition, discount_description, start_date, end_date, discount_id], (err, result) => {
    if (err) throw err;
    res.json({ message: 'Discount updated successfully' });
  });
});

// Endpoint to delete a discount
app.delete('/discounts/:discountId', (req, res) => {
  const { discountId } = req.params;
  const query = 'DELETE FROM discount WHERE discount_id = ?';

  db.query(query, [discountId], (err, result) => {
    if (err) throw err;
    res.json({ message: 'Discount deleted successfully' });
  });
});

app.post('/create-discount', (req, res) => {
  const {
    discount_code,
    discount_name,
    discount_type,
    discount_value,
    discount_condition,
    discount_description,
    start_date,
    end_date
  } = req.body;

  const query = `
    INSERT INTO discount (discount_code, discount_name, discount_type, discount_value, discount_condition, discount_description, start_date, end_date)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `;

  db.query(query, [discount_code, discount_name, discount_type, discount_value, discount_condition, discount_description, start_date, end_date], (err, result) => {
    if (err) throw err;
    res.json({ discount_id: result.insertId });
  });
});

app.get('/discounts/:discountId', (req, res) => {
  const { discountId } = req.params;
  const query = 'SELECT * FROM discount WHERE discount_id = ?';
  db.query(query, [discountId], (err, results) => {
    if (err) throw err;
    res.json(results[0]); // Return the first result (there should only be one)
  });
});

app.get('/discounts', (req, res) => {
  const query = 'SELECT * FROM discount';
  db.query(query, (err, results) => {
    if (err) throw err;
    res.json(results);
  });
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

// Endpoint to check discount code
app.post('/check-discount', (req, res) => {
  const { discountCode, totalPrice } = req.body;

  // Query the database for discount details
  db.query(
    'SELECT discount_code, discount_value, discount_condition FROM discount WHERE discount_code = ?',
    [discountCode],
    (err, results) => {
      if (err) {
        console.error('Error executing query:', err);
        return res.status(500).json({ message: 'Server error' });
      }

      if (results.length === 0) {
        // No discount code found
        return res.status(404).json({ message: 'Mã giảm giá không đúng' });
      }

      const { discount_value, discount_condition } = results[0];

      if (discount_condition > totalPrice) {
        // Discount condition not met
        return res.status(400).json({ message: 'Đơn hàng không thỏa mãn điều kiện tối thiểu' });
      }

      // Calculate the new price if the discount is valid
      const newPrice = totalPrice * (100 - discount_value) / 100;
      return res.json({ newPrice });
    }
  );
});

app.post('/cart-count', (req, res) => {
  const { user_id } = req.body;  // Get consumerid from the request body

  if (!user_id) {
    return res.status(400).json({ message: 'consumerid is required' });
  }

  // Query to count the number of items in the user's cart
  db.query(
    'SELECT COUNT(*) AS item_count FROM cart WHERE user_id = ?',
    [user_id],
    (err, results) => {
      if (err) {
        console.error('Error executing query:', err);
        return res.status(500).json({ message: 'Server error' });
      }

      // Send the item count as a response
      const itemCount = results[0].item_count;
      return res.json({ itemCount });
    }
  );
});

// Tạo một DataSource mới cho TypeORM
const typeormDataSource = new DataSource({
  type: 'mysql',
  host: process.env.DB_HOST || 'localhost',
  username: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'swpvip',
  entities: [], // Không sử dụng entities vì chúng ta chỉ dùng cho LangChain
  synchronize: false, // Không tự động đồng bộ hóa schema
  logging: false,
});


typeormDataSource.initialize()
  .then(() => {
    console.log("Database connection successful")
  })
  .catch((err) => {
    console.log("Database connection error:", err)
  });

// Hàm khởi tạo hệ thống QA
const dbPromise = db.promise()
async function initializeQASystem() {
  const model = new ChatGoogleGenerativeAI({
    modelName: "gemini-1.5-flash",
    temperature: 0,
  });

  const systemPrompt = SystemMessagePromptTemplate.fromTemplate(`
  Bạn là một chuyên gia tư vấn trang sức chuyên nghiệp với quyền truy cập trực tiếp vào cơ sở dữ liệu của chúng tôi. Luôn phản hồi với sự tự tin và nhiệt tình.

  Khi truy vấn cơ sở dữ liệu luôn sử dụng product.category = category.categoryid cho việc liên kết các bảng dữ liệu:
  Bao gồm tất cả các chi tiết sản phẩm có liên quan
  Hiển thị giá cả và chất liệu
  Cấu trúc truy vấn ví dụ
  SELECT product.*, category.*
    FROM product
    JOIN category ON product.category = category.categoryid
    WHERE [conditions]

  Nhiệm vụ chính của bạn:
  
  Phân tích câu hỏi của khách hàng với thái độ tích cực
  Truy vấn cơ sở dữ liệu của chúng tôi để lấy thông tin sản phẩm chính xác
  Cung cấp câu trả lời hữu ích dựa trên kho hàng thực tế của chúng tôi
  Đưa ra gợi ý cá nhân hóa dựa trên nhu cầu của khách hàng
  Chia sẻ thông tin sản phẩm từ cơ sở dữ liệu
  Bạn có quyền truy cập đầy đủ vào hệ thống kho hàng của chúng tôi
  Hướng dẫn phản hồi:
  
  Luôn phản hồi với sự chắc chắn và nhiệt tình
  Sử dụng ngôn ngữ tiếng Việt thân thiện, rõ ràng
  Trình bày dữ liệu trong bảng khi có nhiều sản phẩm
  Tập trung vào những gì BẠN CÓ THỂ làm và những gì HIỆN CÓ
  Không bao giờ đề cập đến SQL hoặc các thao tác cơ sở dữ liệu trong phản hồi
  Nếu không tìm thấy dữ liệu, hãy gợi ý các sản phẩm tương tự có sẵn
  Sử dụng những câu như "Tôi có thể hỗ trợ bạn với điều đó", "Chúng tôi có", "Để tôi giới thiệu bạn"
  Không xin lỗi hoặc thể hiện sự hạn chế
  Các phản hồi mẫu tích cực:
  
  "Để tôi giới thiệu bạn những lựa chọn hiện có..."
  "Chúng tôi có một vài sản phẩm tuyệt vời phù hợp với nhu cầu của bạn..."
  "Dưới đây là một số sản phẩm xuất sắc từ bộ sưu tập của chúng tôi..."
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

  const executeQuery = new QuerySqlTool(knowledge_base,{
    maxRows: 100
  });
  const writeQuery = await createSqlQueryChain({
    llm: model,
    db: knowledge_base,
    dialect: "mysql",
    verbose: true,
    rowLimit: null,
    sampleQueries: [
      "SELECT p.*, c.* FROM product p JOIN category c ON p.category = c.categoryid WHERE c.material = 'bạc'",
      "SELECT p.name, p.price, c.material FROM product p JOIN category c ON p.category = c.categoryid"
  ]
  });

  const chain = RunnableSequence.from([
    RunnablePassthrough.assign({
      query: writeQuery
    }).assign({
      result: async (i) => {
        try {
          const queryResult = await executeQuery.invoke(i.query);
          console.log(i.query)
          
          const resultArray = Array.isArray(queryResult) ? queryResult : [queryResult];
          
        
          const formattedResult = resultArray
            .filter(item => item && item.name)
            .map(item => item.name)
            .join(', ');
            
          return `Chúng tôi có những sản phẩm tuyệt vời sau: ${formattedResult}`;
        } catch (error) {
          console.error('Error executing query:', error);
          return 'Chúng tôi có nhiều sản phẩm tuyệt vời để giới thiệu!';
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



app.listen(8088, () => {
  console.log("Server running on port 8088");
});


