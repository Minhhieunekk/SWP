import React, { useState, useEffect } from 'react';
import { Modal, Button, Form, FormControl, InputGroup } from 'react-bootstrap';
import { Edit, Trash, PlusCircle, Search } from 'react-feather';
import { Image } from 'antd';
import '../styles/dashboard.scss';
import axios from 'axios';
import AppHeader from './Header';
import { toast, Bounce } from 'react-toastify';
import { Link, useLocation } from 'react-router-dom';
import 'react-toastify/dist/ReactToastify.css';

const Dashboard = () => {
  const [products, setProducts] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [user, setUser] = useState(null);
  const itemsPerPage = 10;

  useEffect(() => {
    fetchProducts(currentPage, itemsPerPage, searchTerm);
  }, [currentPage, searchTerm]);

  const fetchProducts = async (page, limit, search) => {
    try {
      const url = new URL('http://localhost:8088/dashboard');
      url.searchParams.append('page', page);
      url.searchParams.append('limit', limit);
      if (search) {
        url.searchParams.append('search', search);
      }

      const res = await axios.get(url.toString());
      setProducts(res.data.products);
      setTotalPages(res.data.totalPages);
    } catch (err) {
      console.error('Error fetching products:', err);
      toast.error('Lỗi khi tải dữ liệu sản phẩm');
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setCurrentPage(1);
    fetchProducts(1, itemsPerPage, searchTerm);
  };

  const handleAdd = async (newProduct) => {
    try {
      await axios.post('http://localhost:8088/addproduct', newProduct);
      fetchProducts(currentPage, itemsPerPage);
      toast.success('Đã thêm sản phẩm thành công', { position: 'top-center', transition: Bounce });
    } catch (err) {
      console.error('Error adding product:', err);
      toast.error('Lỗi khi thêm sản phẩm');
    }
  };

  const handleEdit = async (updatedProduct) => {
    try {
      await axios.put(`http://localhost:8088/updateproduct/${updatedProduct.productid}`, updatedProduct);
      fetchProducts(currentPage, itemsPerPage);
      toast.success('Đã cập nhật sản phẩm thành công', { position: 'top-center', transition: Bounce });
    } catch (err) {
      console.error('Error updating product:', err);
      toast.error('Lỗi khi cập nhật sản phẩm');
    }
  };

  const handleDelete = async () => {
    if (selectedProduct) {
      try {
        await axios.delete(`http://localhost:8088/deleteproduct/${selectedProduct.productid}`);
        fetchProducts(currentPage, itemsPerPage);
        setShowDeleteModal(false);
        setSelectedProduct(null);
        toast.success('Đã xoá sản phẩm thành công', { position: 'top-center', transition: Bounce });
      } catch (err) {
        console.error('Error deleting product:', err);
        toast.error('Lỗi khi xoá sản phẩm');
      }
    }
  };

  const handlePageChange = (direction) => {
    if (direction === 'prev' && currentPage > 1) {
      setCurrentPage(prev => prev - 1);
    } else if (direction === 'next' && currentPage < totalPages) {
      setCurrentPage(prev => prev + 1);
    }
  };
  const fetchUserData = async (token) => {
    try {

      const res = await axios.get('http://localhost:8088/api/user/details', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      setUser(res.data);

    } catch (err) {
      console.error('Error fetching user data:', err);

      if (err.response?.status === 401 || err.response?.status === 403) {
        localStorage.removeItem('token');

      }
    }
  };
  const location = useLocation();
  useEffect(() => {
    const token = localStorage.getItem('token');
    const queryParams = new URLSearchParams(location.search);
    const tokenFromUrl = queryParams.get('token');
    if (!token && tokenFromUrl) {
      localStorage.setItem('token', tokenFromUrl);
      fetchUserData(tokenFromUrl);
    } else if (token) {
      fetchUserData(token);
    }
  }, [location.search])



  return (
    <>
       {user?.admin===1 &&
        <>
        <AppHeader />
      <div className="container" style={{ position: 'relative', top: '130px' }}>
        <div className="table-responsive">
          <div className="table-wrapper">
            <div className="table-title">
              <div className="row">
                <div className="col-sm-6">
                  <h2>Quản lý <b>Sản phẩm</b></h2>
                </div>
                <div className="col-sm-6">
                  <Button className="btn btn-success" onClick={() => setShowAddModal(true)}>
                    <PlusCircle size={18} /> <span>Thêm mới sản phẩm</span>
                  </Button>
                </div>
              </div>
            </div>
            <div className="row mt-3">
              <div className="col-12">
                <Form onSubmit={handleSearch}>
                  <InputGroup>
                    <FormControl
                      placeholder="Nhập mã sản phẩm để tìm kiếm..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                    <Button variant="outline-secondary" type="submit">
                      <Search size={18} />
                    </Button>
                  </InputGroup>
                </Form>
              </div>
            </div>
            <table className="table table-striped table-hover">
              <thead>
                <tr>
                  <th>Tên</th>
                  <th>Mã sản phẩm</th>
                  <th>Giá gốc</th>
                  <th>Số lượng (cái)</th>
                  <th>Phân loại</th>
                  <th>Thương hiệu</th>
                  <th>Chất liệu</th>
                  <th>Tuổi vàng</th>
                  <th>Ảnh</th>
                  <th>Kích cỡ</th>
                  <th>Chỉnh sửa</th>
                </tr>
              </thead>
              <tbody>
                {products.map((product) => (
                  <tr key={product.productid}>
                    <td>{product.name}</td>
                    <td>{product.code}</td>
                    <td>{product.price.toLocaleString()} VND</td>
                    <td>{product.amount}</td>
                    <td>{product.categoryname}</td>
                    <td>{product.brand}</td>
                    <td>{product.material}</td>
                    <td>{product.goldage}</td>
                    <td>
                      {product.image && (
                        <Image src={`images/${product.image}`} alt={product.name} width={100} height={100} />
                      )}
                    </td>
                    <td>{product.size}</td>
                    <td>
                          <Link className="edit" onClick={() => { setSelectedProduct(product); setShowEditModal(true); }}>
                            <Edit size={18} />
                          </Link>
                          <Link className="delete" onClick={() => { setSelectedProduct(product); setShowDeleteModal(true); }}>
                            <Trash size={18} />
                          </Link>
                        </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="clearfix">
              <div className="hint-text">Hiển thị <b>{products.length}</b> sản phẩm</div>
            </div>

            {/* Pagination Controls */}
            <div className="pagination">
              <Button disabled={currentPage === 1} onClick={() => handlePageChange('prev')}>Trước</Button>
              <span>Trang {currentPage} trong {totalPages}</span>
              <Button disabled={currentPage === totalPages} onClick={() => handlePageChange('next')}>Sau</Button>
            </div>
          </div>
        </div>

        {/* Add/Edit Modal */}
        <ProductModal show={showAddModal} onHide={() => setShowAddModal(false)} onSubmit={handleAdd} title="Thêm sản phẩm" />
        <ProductModal show={showEditModal} onHide={() => setShowEditModal(false)} onSubmit={handleEdit} title="Thay đổi sản phẩm" product={selectedProduct} />

        {/* Delete Modal */}
        <Modal show={showDeleteModal} onHide={() => setShowDeleteModal(false)} centered>
          <Modal.Header closeButton>
            <Modal.Title>Xoá sản phẩm</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <p>Bạn có muốn xoá sản phẩm không?</p>
            <p className="text-warning"><small>Điều này sẽ không thể hoàn tác</small></p>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowDeleteModal(false)}>Huỷ</Button>
            <Button variant="danger" onClick={handleDelete}>Xoá</Button>
          </Modal.Footer>
        </Modal>
      </div>
        </>
       }
      
    </>
  );
};

const ProductModal = ({ show, onHide, onSubmit, title, product = null }) => {
  const [formData, setFormData] = useState({
    productid: '',
    name: '',
    price: '',
    description: '',
    amount: '',
    categoryname: '',
    brand: '',
    material: '',
    goldage: '',
    gender: '',
    size: '',
    image: null
  });

  const [errors, setErrors] = useState({
    price: '',
    amount: ''
  });

  const [filters, setFilters] = useState({
    brands: [],
    goldAges: [],
    materials: [],
    genders: [],
    productTypes: [],
    sizes: []
  });

  useEffect(() => {
    if (show) {
      axios.get('http://localhost:8088/api/filterdashboard')
        .then(res => {
          setFilters(res.data);
        })
        .catch(err => {
          console.error('Error fetching filters:', err);
        });
    }

    if (product) {
      setFormData({
        productid: product.productid,
        name: product.name || '',
        price: product.price || '',
        description: product.description || '',
        amount: product.amount || '',
        categoryname: product.categoryname || '',
        brand: product.brand || '',
        material: product.material || '',
        goldage: product.goldage || '',
        gender: product.gender || '',
        size: product.size || '',
        image: null
      });
    } else {
      setFormData({
        productid: '',
        name: '',
        price: '',
        description:'',
        amount: '',
        categoryname: '',
        brand: '',
        material: '',
        goldage: '',
        gender: '',
        size: '',
        image: null
      });
    }
    // Reset errors when modal is opened/closed
    setErrors({
      price: '',
      amount: ''
    });
  }, [product, show]);

  const validateNumber = (value, fieldName) => {
    const numberValue = parseInt(value);
    if (value === '') {
      return `${fieldName} không được để trống`;
    }
    if (isNaN(numberValue)) {
      return `${fieldName} phải là số nguyên`;
    }
    if (numberValue < 0) {
      return `${fieldName} không được âm `;
    }
    if (numberValue >2000000000) {
      return `${fieldName} quá lớn `;
    }
    if (numberValue !== parseFloat(value)) {
      return `${fieldName} phải là số nguyên`;
    }
    return '';
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    if (name === 'price' || name === 'amount') {
      const error = validateNumber(value, name === 'price' ? 'Giá' : 'Số lượng');
      setErrors(prev => ({
        ...prev,
        [name]: error
      }));
    }

    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFormData(prev => ({
        ...prev,
        image: file.name
      }));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    // Validate all fields before submission
    const priceError = validateNumber(formData.price, 'Giá');
    const amountError = validateNumber(formData.amount, 'Số lượng');

    setErrors({
      price: priceError,
      amount: amountError
    });

    if (priceError || amountError) {
      toast.error('Vui lòng kiểm tra lại thông tin nhập vào', {
        position: "top-center",
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
        theme: "light"
      });
      return;
    }

    // Convert price and amount to integers before submission
    const submissionData = {
      ...formData,
      price: parseInt(formData.price),
      amount: parseInt(formData.amount)
    };

    onSubmit(submissionData);
    onHide();
  };

  return (
    <Modal show={show} onHide={onHide} centered>
      <Form onSubmit={handleSubmit}>
        <Modal.Header closeButton>
          <Modal.Title>{title}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form.Group controlId="formProductName">
            <Form.Label>Tên sản phẩm</Form.Label>
            <Form.Control
              type="text"
              placeholder="Nhập tên sản phẩm"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
            />
          </Form.Group>
          <Form.Group controlId="formProductDescription">
            <Form.Label>Mô tả sản phẩm</Form.Label>
            <Form.Control
              type="text"
              placeholder="Mô tả sản phẩm"
              name="description"
              value={formData.description}
              onChange={handleChange}
              required
              as='textarea'
            />
          </Form.Group>

          <Form.Group controlId="formProductPrice">
            <Form.Label>Giá nhập</Form.Label>
            <Form.Control
              type="text"
              placeholder="Nhập giá sản phẩm"
              name="price"
              value={formData.price}
              onChange={handleChange}
              isInvalid={!!errors.price}
              required
            />
            <Form.Control.Feedback type="invalid">
              {errors.price}
            </Form.Control.Feedback>
          </Form.Group>

          <Form.Group controlId="formProductAmount">
            <Form.Label>Số lượng(cái)</Form.Label>
            <Form.Control
              type="text"
              placeholder="Chọn số lượng"
              name="amount"
              value={formData.amount}
              onChange={handleChange}
              isInvalid={!!errors.amount}
              required
            />
            <Form.Control.Feedback type="invalid">
              {errors.amount}
            </Form.Control.Feedback>
          </Form.Group>

          {/* Rest of the form groups remain the same */}
          <Form.Group controlId="formProductCategory">
            <Form.Label>Phân loại</Form.Label>
            <Form.Control
              as="select"
              name="categoryname"
              value={formData.categoryname}
              onChange={handleChange}
              required
            >
              {filters.productTypes.map((type, index) => (
                <option key={index} value={type}>{type}</option>
              ))}
            </Form.Control>
          </Form.Group>

          <Form.Group controlId="formProductBrand">
            <Form.Label>Thương hiệu</Form.Label>
            <Form.Control
              as="select"
              name="brand"
              value={formData.brand}
              onChange={handleChange}
              required
            >
              {filters.brands.map((brand, index) => (
                <option key={index} value={brand}>{brand}</option>
              ))}
            </Form.Control>
          </Form.Group>

          <Form.Group controlId="formProductMaterial">
            <Form.Label>Chất liệu</Form.Label>
            <Form.Control
              as="select"
              name="material"
              value={formData.material}
              onChange={handleChange}
              required
            >
              {filters.materials.map((material, index) => (
                <option key={index} value={material}>{material}</option>
              ))}
            </Form.Control>
          </Form.Group>

          <Form.Group controlId="formProductGoldage">
            <Form.Label>Tuổi vàng</Form.Label>
            <Form.Control
              as="select"
              name="goldage"
              value={formData.goldage}
              onChange={handleChange}
              required
            >
              {filters.goldAges.map((goldage, index) => (
                <option key={index} value={goldage}>{goldage}</option>
              ))}
            </Form.Control>
          </Form.Group>

          <Form.Group controlId="formProductGender">
            <Form.Label>Giới tính</Form.Label>
            <Form.Control
              as="select"
              name="gender"
              value={formData.gender}
              onChange={handleChange}
              required
            >
              {filters.genders.map((gender, index) => (
                <option key={index} value={gender}>{gender}</option>
              ))}
            </Form.Control>
          </Form.Group>

          <Form.Group controlId="formProductSize">
            <Form.Label>Size</Form.Label>
            <Form.Control
              as="select"
              name="size"
              value={formData.size}
              onChange={handleChange}
              required
            >
              {filters.sizes.map((size, index) => (
                <option key={index} value={size}>{size}</option>
              ))}
            </Form.Control>
          </Form.Group>

          <Form.Group controlId="formProductImage">
            <Form.Label>Hình ảnh</Form.Label>
            <Form.Control
              type="file"
              accept="image/*"
              onChange={handleFileChange}
            />
          </Form.Group>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={onHide}>Đóng</Button>
          <Button variant="primary" type="submit">{title}</Button>
        </Modal.Footer>
      </Form>
    </Modal>
  );
};

export default Dashboard;
