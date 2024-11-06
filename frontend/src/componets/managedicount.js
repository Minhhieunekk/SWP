import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Button, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Modal, Box, TextField, Grid, Checkbox, ListItemText, List, ListItem } from '@mui/material';
import { Link } from 'react-router-dom';

const ManageDiscounts = () => {
  const [discounts, setDiscounts] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [openDetailModal, setOpenDetailModal] = useState(false);
  const [selectedDiscount, setSelectedDiscount] = useState(null);
  const [openUpdateModal, setOpenUpdateModal] = useState(false);
  const [products, setProducts] = useState([]);
  const [selectedProducts, setSelectedProducts] = useState([]);
  const [errors, setErrors] = useState({});
  
  // Fetch discounts
  useEffect(() => {
    axios.get(`http://localhost:8088/api/discounts?page=${page}&limit=10`)
      .then(response => {
        setDiscounts(response.data.discounts);
        setTotalPages(response.data.totalPages);
      })
      .catch(error => console.error('Error fetching discounts:', error));
  }, [page]);

  // Fetch products applied to discount type 1
  const fetchProductDetails = (discountId) => {
    axios.get(`http://localhost:8088/api/discounts/${discountId}/products`)
      .then(response => {
        setProducts(response.data.products);
      })
      .catch(error => console.error('Error fetching products for discount:', error));
  };

  // Open detail modal
  const handleDetailClick = (discount) => {
    setSelectedDiscount(discount);
    fetchProductDetails(discount.id); // Get products for discount type 1
    setOpenDetailModal(true);
  };

  // Open update modal
  const handleUpdateClick = (discount) => {
    setSelectedDiscount(discount);
    setOpenUpdateModal(true);
    fetchProductDetails(discount.id);
  };

  // Handle update discount
  const handleUpdateDiscount = async () => {
    const updatedData = {
      discount_code: selectedDiscount.discount_code,
      discount_name: selectedDiscount.discount_name,
      start_date: selectedDiscount.start_date,
      end_date: selectedDiscount.end_date,
      discount_value: selectedDiscount.discount_value,
      discount_condition: selectedDiscount.discount_condition,
      discount_description: selectedDiscount.discount_description,
      selected_products: selectedProducts,
    };

    try {
      await axios.put(`http://localhost:8088/api/discounts/${selectedDiscount.id}`, updatedData);
      setOpenUpdateModal(false);
      fetchDiscounts(); // Refresh the discount list
    } catch (error) {
      console.error('Error updating discount:', error);
    }
  };

  // Handle delete discount
  const handleDeleteDiscount = async (discountId) => {
    try {
      await axios.delete(`http://localhost:8088/api/discounts/${discountId}`);
      fetchDiscounts(); // Refresh the discount list
    } catch (error) {
      console.error('Error deleting discount:', error);
    }
  };

  // Toggle product selection
  const handleProductSelect = (productId) => {
    setSelectedProducts(prev => {
      if (prev.includes(productId)) {
        return prev.filter(id => id !== productId);
      } else {
        return [...prev, productId];
      }
    });
  };

  // Fetch all discounts
  const fetchDiscounts = () => {
    axios.get(`http://localhost:8088/api/discounts?page=${page}&limit=10`)
      .then(response => {
        setDiscounts(response.data.discounts);
        setTotalPages(response.data.totalPages);
      })
      .catch(error => console.error('Error fetching discounts:', error));
  };

  return (
    <div>
      <div style={{ marginBottom: '20px' }}>
        <Button variant="contained" color="primary" component={Link} to="/create-discount">Create Discount</Button>
      </div>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Discount Code</TableCell>
              <TableCell>Discount Name</TableCell>
              <TableCell>Discount Type</TableCell>
              <TableCell>Start Date</TableCell>
              <TableCell>End Date</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {discounts.map((discount) => (
              <TableRow key={discount.id}>
                <TableCell>{discount.discount_code}</TableCell>
                <TableCell>{discount.discount_name}</TableCell>
                <TableCell>{discount.discount_type === 1 ? 'Product-based' : 'Order-based'}</TableCell>
                <TableCell>{discount.start_date}</TableCell>
                <TableCell>{discount.end_date}</TableCell>
                <TableCell>
                  <Button onClick={() => handleDetailClick(discount)}>View</Button>
                  <Button onClick={() => handleUpdateClick(discount)}>Update</Button>
                  <Button onClick={() => handleDeleteDiscount(discount.id)}>Delete</Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Pagination */}
      <div style={{ marginTop: '20px' }}>
        <Button disabled={page === 1} onClick={() => setPage(page - 1)}>Previous</Button>
        <span>Page {page} of {totalPages}</span>
        <Button disabled={page === totalPages} onClick={() => setPage(page + 1)}>Next</Button>
      </div>

      {/* Detail Modal */}
      <Modal
        open={openDetailModal}
        onClose={() => setOpenDetailModal(false)}
        aria-labelledby="discount-detail-modal"
      >
        <Box sx={{ padding: 3, backgroundColor: 'white', borderRadius: '8px', width: '600px', margin: 'auto', marginTop: '100px' }}>
          <h2>Discount Details</h2>
          <div><strong>Discount Code:</strong> {selectedDiscount?.discount_code}</div>
          <div><strong>Discount Name:</strong> {selectedDiscount?.discount_name}</div>
          <div><strong>Discount Type:</strong> {selectedDiscount?.discount_type === 1 ? 'Product-based' : 'Order-based'}</div>
          <div><strong>Start Date:</strong> {selectedDiscount?.start_date}</div>
          <div><strong>End Date:</strong> {selectedDiscount?.end_date}</div>
          <div><strong>Description:</strong> {selectedDiscount?.discount_description}</div>
          {selectedDiscount?.discount_type === 1 && (
            <>
              <h3>Products Applied:</h3>
              <List>
                {products.map((product) => (
                  <ListItem key={product.id}>
                    <Checkbox
                      checked={selectedProducts.includes(product.id)}
                      onChange={() => handleProductSelect(product.id)}
                    />
                    <ListItemText primary={product.name} />
                  </ListItem>
                ))}
              </List>
            </>
          )}
          <Button onClick={() => setOpenDetailModal(false)}>Close</Button>
        </Box>
      </Modal>

      {/* Update Modal */}
      <Modal
        open={openUpdateModal}
        onClose={() => setOpenUpdateModal(false)}
        aria-labelledby="update-discount-modal"
      >
        <Box sx={{ padding: 3, backgroundColor: 'white', borderRadius: '8px', width: '600px', margin: 'auto', marginTop: '100px' }}>
          <h2>Update Discount</h2>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <TextField
                label="Discount Code"
                variant="outlined"
                fullWidth
                value={selectedDiscount?.discount_code}
                disabled
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                label="Discount Name"
                variant="outlined"
                fullWidth
                value={selectedDiscount?.discount_name}
                onChange={(e) => setSelectedDiscount(prev => ({ ...prev, discount_name: e.target.value }))}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                label="Start Date"
                variant="outlined"
                type="date"
                fullWidth
                value={selectedDiscount?.start_date}
                onChange={(e) => setSelectedDiscount(prev => ({ ...prev, start_date: e.target.value }))}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                label="End Date"
                variant="outlined"
                type="date"
                fullWidth
                value={selectedDiscount?.end_date}
                onChange={(e) => setSelectedDiscount(prev => ({ ...prev, end_date: e.target.value }))}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                label="Discount Value"
                variant="outlined"
                type="number"
                fullWidth
                value={selectedDiscount?.discount_value}
                onChange={(e) => setSelectedDiscount(prev => ({ ...prev, discount_value: e.target.value }))}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                label="Discount Description"
                variant="outlined"
                fullWidth
                value={selectedDiscount?.discount_description}
                onChange={(e) => setSelectedDiscount(prev => ({ ...prev, discount_description: e.target.value }))}
              />
            </Grid>
            {selectedDiscount?.discount_type === 1 && (
              <>
                <h3>Products Applied:</h3>
                <List>
                  {products.map((product) => (
                    <ListItem key={product.id}>
                      <Checkbox
                        checked={selectedProducts.includes(product.id)}
                        onChange={() => handleProductSelect(product.id)}
                      />
                      <ListItemText primary={product.name} />
                    </ListItem>
                  ))}
                </List>
              </>
            )}
          </Grid>
          <Button onClick={handleUpdateDiscount}>Save Changes</Button>
          <Button onClick={() => setOpenUpdateModal(false)}>Cancel</Button>
        </Box>
      </Modal>
    </div>
  );
};

export default ManageDiscounts;
