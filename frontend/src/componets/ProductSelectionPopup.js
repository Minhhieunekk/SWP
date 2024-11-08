import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Dialog, DialogActions, DialogContent, DialogTitle, Button, List, ListItem, ListItemText, CircularProgress, TextField, Box } from '@mui/material';

const ProductSelectionPopup = ({ isOpen, onClose, onSubmit }) => {
  const [products, setProducts] = useState([]);
  const [selectedProducts, setSelectedProducts] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);

  // Fetch products when the popup is opened
  useEffect(() => {
    if (isOpen) {
      fetchProducts();
    }
  }, [isOpen, search, page]);

  // Fetch products from the server
  const fetchProducts = async () => {
    setLoading(true);
    try {
      const response = await axios.get('http://localhost:8088/get-products', {
        params: {
          search: search,
          page: page,
        },
      });
      // Ensure that the response has the expected data structure
      const fetchedProducts = response.data.products || [];
      setProducts(fetchedProducts);
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setLoading(false);
    }
  };

  // Handle search input change
  const handleSearchChange = (e) => {
    setSearch(e.target.value);
    setPage(1); // Reset to first page when search changes
  };

  // Add product to selected list
  const handleAddProduct = (product) => {
    if (!selectedProducts.some(p => p.productid === product.productid)) {
      setSelectedProducts([...selectedProducts, product]);
    }
  };

  // Remove product from selected list
  const handleRemoveProduct = (product) => {
    setSelectedProducts(selectedProducts.filter(p => p.productid !== product.productid));
  };

  // Submit selected products and close the popup
  const handleApply = () => {
    onSubmit(selectedProducts);
    onClose();
  };

  return (
    <Dialog open={isOpen} onClose={onClose} maxWidth="lg">
      <DialogTitle>Chọn sản phẩm</DialogTitle>
      <DialogContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
          <Box sx={{ width: '45%' }}>
            {/* Search field */}
            <TextField
              label="Tìm kiếm theo tên hoặc mã sản phẩm"
              variant="outlined"
              fullWidth
              value={search}
              onChange={handleSearchChange}
              sx={{ marginBottom: 2 }}
            />

            {loading ? (
              <CircularProgress />
            ) : (
              <List>
                {/* Ensure that products is defined and is an array */}
                {Array.isArray(products) && products.length > 0 ? (
                  products.map((product) => (
                    <ListItem
                      button
                      key={product.productid}
                      onClick={() => handleAddProduct(product)}
                    >
                      <ListItemText primary={product.name} secondary={product.code} />
                    </ListItem>
                  ))
                ) : (
                  <ListItem>
                    <ListItemText primary="Không tìm thấy sản phẩm" />
                  </ListItem>
                )}
              </List>
            )}

            {/* Pagination controls */}
            <Box sx={{ display: 'flex', justifyContent: 'center', marginTop: 2 }}>
              <Button
                disabled={page === 1}
                onClick={() => setPage(page - 1)}
              >
                Trang trước
              </Button>
              <Button onClick={() => setPage(page + 1)}>
                Trang sau
              </Button>
            </Box>
          </Box>

          {/* Selected products list */}
          <Box sx={{ width: '45%', padding: '0 20px' }}>
            <Box sx={{ marginBottom: 2 }}>
              <strong>Sản phẩm đã chọn</strong>
            </Box>
            <List>
              {selectedProducts.map((product) => (
                <ListItem
                  button
                  key={product.productid}
                  onClick={() => handleRemoveProduct(product)}
                >
                  <ListItemText primary={"" + product.name + "-" + product.code} />
                </ListItem>
              ))}
            </List>
          </Box>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} color="secondary">
          Hủy
        </Button>
        <Button onClick={handleApply} color="primary">
          Áp dụng
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ProductSelectionPopup;
