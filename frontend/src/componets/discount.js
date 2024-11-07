import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Button, TextField, Select, MenuItem, InputLabel, FormControl, Modal, Box, Checkbox, ListItemText, List, ListItem, Grid, FormHelperText } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import AppHeader from './Header';

function DiscountForm() {
  const [discountType, setDiscountType] = useState(1); // Default to product discount type
  const [discountName, setDiscountName] = useState('');
  const [discountCode, setDiscountCode] = useState('');
  const [discountDescription, setDiscountDescription] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [discountValue, setDiscountValue] = useState('');
  const [discountCondition, setDiscountCondition] = useState('');
  const [products, setProducts] = useState([]);
  const [selectedProducts, setSelectedProducts] = useState([]);
  const [openProductModal, setOpenProductModal] = useState(false);
  const [errors, setErrors] = useState({});
  const [canProceed, setCanProceed] = useState(false); // State to track if user can proceed to next step

  const navigate = useNavigate();

  // Fetch products for selecting which products to apply the discount
  useEffect(() => {
    axios.get('http://localhost:8088/api/product')
      .then((response) => {
        setProducts(response.data);
      })
      .catch((error) => {
        console.error('There was an error fetching products:', error);
      });
  }, []);

  // Handle discount type change
  const handleDiscountTypeChange = (e) => {
    setDiscountType(Number(e.target.value));
    if (e.target.value === 1) {
      setDiscountCondition(''); // Reset discount condition when product-based
    }
  };

  // Handle product selection
  const handleProductSelect = (productId) => {
    setSelectedProducts(prev => {
      if (prev.includes(productId)) {
        return prev.filter(id => id !== productId);
      } else {
        return [...prev, productId];
      }
    });
  };

  // Validate the form
  const validateForm = () => {
    const newErrors = {};
    if (!discountCode) newErrors.discountCode = 'Không được bỏ trống';
    if (!discountName) newErrors.discountName = 'Không được bỏ trống';
    if (!startDate) newErrors.startDate = 'Không được bỏ trống';
    if (!endDate) newErrors.endDate = 'Không được bỏ trống';
    if (!discountValue) newErrors.discountValue = 'Không được bỏ trống';
    if (!discountDescription) newErrors.discountDescription = 'Không được bỏ trống';
    
    return newErrors;
  };

  // Handle validation before going to next step
  const handleNextStep = () => {
    const validationErrors = validateForm();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      setCanProceed(false); // Prevent proceeding to next step if there are errors
    } else {
      setCanProceed(true); // Allow user to proceed to the product selection step
      setOpenProductModal(true); // Open modal to select products
    }
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    const validationErrors = validateForm();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    const discountData = {
      discount_code: discountCode,
      discount_name: discountName,
      discount_type: discountType,
      start_date: startDate,
      end_date: endDate,
      discount_value: discountValue,
      discount_condition: discountType === 1 ? null : discountCondition,
      selected_products: discountType === 1 ? selectedProducts : [],
      discount_description: discountDescription, // Add description
    };

    try {
      const response = await axios.post('http://localhost:8088/api/discounts', discountData);
      console.log('Discount created:', response.data);
      navigate.push('/'); // Redirect to homepage
    } catch (error) {
      console.error('Error creating discount:', error);
    }
  };

  return (
    <>
    <AppHeader/>
    <br></br>
    <br></br>
    <br></br>
    <br></br>
    <br></br>
    <br></br>
    <br></br>
    <br></br>
    <div style={{ padding: '20px' }}>
      <form onSubmit={handleSubmit}>
        <Grid container spacing={3}>
          <Grid item xs={12} sm={6}>
            <TextField
              label="Mã khuyến mãi"
              variant="outlined"
              fullWidth
              value={discountCode}
              onChange={(e) => setDiscountCode(e.target.value)}
              error={!!errors.discountCode}
              helperText={errors.discountCode}
              required
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              label="Tên khuyến mãi"
              variant="outlined"
              fullWidth
              value={discountName}
              onChange={(e) => setDiscountName(e.target.value)}
              error={!!errors.discountName}
              helperText={errors.discountName}
              required
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth>
              <InputLabel>Loại khuyến mãi</InputLabel>
              <Select
                value={discountType}
                onChange={handleDiscountTypeChange}
                label="Loại khuyến mãi"
                required
              >
                <MenuItem value={1}>Áp dụng trực tiếp cho sản phẩm</MenuItem>
                <MenuItem value={2}>Dùng khi đặt hàng</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              label="Bắt đầu"
              variant="outlined"
              type="date"
              fullWidth
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              error={!!errors.startDate}
              helperText={errors.startDate}
              required
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              label="Kết thúc"
              variant="outlined"
              type="date"
              fullWidth
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              error={!!errors.endDate}
              helperText={errors.endDate}
              required
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              label="Giá trị (%)"
              variant="outlined"
              type="number"
              fullWidth
              min = '0'
              mã = '100'
              value={discountValue}
              onChange={(e) => setDiscountValue(e.target.value)}
              error={!!errors.discountValue}
              helperText={errors.discountValue}
              required
            />
          </Grid>
          {discountType === 2 && (
            <Grid item xs={12}>
              <TextField
                label="Điều kiện tối thiểu"
                variant="outlined"
                type="number"
                fullWidth
                value={discountCondition}
                onChange={(e) => setDiscountCondition(e.target.value)}
              />
            </Grid>
          )}
          <Grid item xs={12}>
            <TextField
              label="Mô tả thêm"
              variant="outlined"
              fullWidth
              value={discountDescription}
              onChange={(e) => setDiscountDescription(e.target.value)}
              error={!!errors.discountDescription}
              helperText={errors.discountDescription}
              required
            />
          </Grid>
          {discountType === 1 && (
            <Grid item xs={12}>
              <Button
                variant="contained"
                color="primary"
                onClick={handleNextStep}
                disabled={canProceed} // Disable button if there are validation errors
              >
                Chọn sản phẩm được khuyến mại
              </Button>
            </Grid>
          )}
        </Grid>

        <Button variant="contained" color="primary" type="submit" style={{ marginTop: '20px' }}>
          Lưu khuyến mại.
        </Button>
      </form>

      {/* Modal to choose products */}
      <Modal
        open={openProductModal}
        onClose={() => setOpenProductModal(false)}
        aria-labelledby="product-selection-modal"
        aria-describedby="choose-products-to-apply-discount"
      >
        <Box sx={modalStyle}>
          <h2 id="product-selection-modal">Chọn sản phẩm</h2>
          <List>
            {products.map((product) => (
              <ListItem key={product.productid}>
                <Checkbox
                  checked={selectedProducts.includes(product.productid)}
                  onChange={() => handleProductSelect(product.productid)}
                />
                <ListItemText primary={product.name} />
              </ListItem>
            ))}
          </List>
          <Button
            variant="contained"
            color="primary"
            onClick={() => {
              setOpenProductModal(false);
            }}
            style={{ marginTop: '20px' }}
          >
            Lưu
          </Button>
        </Box>
      </Modal>
    </div>
    </>
  );
}

// Modal styling
const modalStyle = {
  position: 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  backgroundColor: 'white',
  padding: '20px',
  borderRadius: '8px',
  boxShadow: 24,
  width: '400px',
};

export default DiscountForm;
