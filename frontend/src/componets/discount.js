import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { TextField, Button, Select, MenuItem, InputLabel, FormControl, Typography, Box } from '@mui/material';
import ProductSelectionPopup from './ProductSelectionPopup';
import '../styles/discount.scss';

const CreateDiscount = () => {
  const navigate = useNavigate();
  const [discount, setDiscount] = useState({
    discount_code: '',
    discount_name: '',
    discount_type: 1,
    start_date: '',
    end_date: '',
    discount_condition: '',
    discount_value: '',
    discount_description: ''
  });
  const [isPopupOpen, setIsPopupOpen] = useState(false);
  const [selectedProducts, setSelectedProducts] = useState([]);

  // Handle discount type change
  const handleDiscountTypeChange = (e) => {
    const type = parseInt(e.target.value);
    setDiscount({ ...discount, discount_type: type });
  };

  // Handle form field changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setDiscount({ ...discount, [name]: value });
  };

  // Save discount
  const handleSaveDiscount = () => {
    if (!discount.discount_code || !discount.discount_name || !discount.start_date || !discount.end_date || !discount.discount_value) {
      alert('Please fill in all required fields.');
      return;
    }

    if (discount.discount_type === 2 && !discount.discount_condition) {
      alert('Please fill in the discount condition for order-level discounts.');
      return;
    }

    // Prepare discount data
    const discountData = {
      ...discount,
      selectedProducts: selectedProducts
    };

    // Send the request to save the discount
    axios.post('http://localhost:8088/discount', discountData)
      .then(response => {
        alert('Discount created successfully.');
        navigate('/manage-discount'); // Redirect after saving
      })
      .catch(err => {
        console.error('Error saving discount:', err);
        alert('Error saving discount.');
      });
  };

  // Open product selection popup
  const handleOpenProductPopup = () => {
    setIsPopupOpen(true);
  };

  // Close product selection popup
  const handleCloseProductPopup = () => {
    setIsPopupOpen(false);
  };

  // Handle the selection of products
  const handleSubmitProducts = (products) => {
    setSelectedProducts(products);
    handleCloseProductPopup();
  };

  return (
    <Box sx={{ padding: 3, maxWidth: 800, margin: '0 auto', backgroundColor: '#f5f5f5', borderRadius: 2 }}>
      <Typography variant="h4" align="center" gutterBottom>Tạo mã khuyến mãi</Typography>

      <form noValidate autoComplete="off">
        <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
          <TextField
            label="Mã khuyến mãi"
            variant="outlined"
            name="discount_code"
            value={discount.discount_code}
            onChange={handleInputChange}
            fullWidth
            required
          />
          <TextField
            label="Tên khuyến mãi"
            variant="outlined"
            name="discount_name"
            value={discount.discount_name}
            onChange={handleInputChange}
            fullWidth
            required
          />
        </Box>

        <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2, marginTop: 2 }}>
          <FormControl fullWidth>
            <InputLabel>Discount Type</InputLabel>
            <Select
              name="Loại khuyến mãi"
              value={discount.discount_type}
              onChange={handleDiscountTypeChange}
              label="Discount Type"
            >
              <MenuItem value={1}>Áp dụng trực tiếp cho sản phẩm</MenuItem>
              <MenuItem value={2}>Dùng cho đặt hàng</MenuItem>
            </Select>
          </FormControl>

          <TextField
            label="Ngày bắt đầu"
            type="date"
            variant="outlined"
            name="start_date"
            value={discount.start_date}
            onChange={handleInputChange}
            fullWidth
            required
            InputLabelProps={{
              shrink: true,
            }}
          />
        </Box>

        <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2, marginTop: 2 }}>
          <TextField
            label="Ngày kết thúc"
            type="date"
            variant="outlined"
            name="end_date"
            value={discount.end_date}
            onChange={handleInputChange}
            fullWidth
            required
            InputLabelProps={{
              shrink: true,
            }}
          />

          {discount.discount_type === 2 && (
            <TextField
              label="Giá trị tối thiểu"
              variant="outlined"
              name="discount_condition"
              value={discount.discount_condition}
              onChange={handleInputChange}
              fullWidth
            />
          )}
        </Box>

        <Box sx={{ marginTop: 2 }}>
          <TextField
            label="Giá trị khuyến mãi"
            type="number"
            min = "1"
            max = "100"
            variant="outlined"
            name="discount_value"
            value={discount.discount_value}
            onChange={handleInputChange}
            fullWidth
            required
          />
        </Box>

        <Box sx={{ marginTop: 2 }}>
          <TextField
            label="Mô tả thêm (Không bắt buộc)"
            variant="outlined"
            name="discount_description"
            value={discount.discount_description}
            onChange={handleInputChange}
            fullWidth
            multiline
            rows={4}
          />
        </Box>

        {discount.discount_type === 1 && (
          <Button
            variant="contained"
            color="primary"
            fullWidth
            sx={{ marginTop: 3 }}
            onClick={handleOpenProductPopup}
          >
            Chọn sản phẩm được áp dụng
          </Button>
        )}

        <Button
          variant="contained"
          color="success"
          fullWidth
          sx={{ marginTop: 3 }}
          onClick={handleSaveDiscount}
        >
          Lưu
        </Button>
      </form>

      <ProductSelectionPopup
        isOpen={isPopupOpen}
        onClose={handleCloseProductPopup}
        onSubmit={handleSubmitProducts}
      />
    </Box>
  );
};

export default CreateDiscount;
