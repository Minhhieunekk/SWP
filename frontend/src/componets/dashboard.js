import React, { useState, useEffect } from 'react';
import { Modal, Button, Form } from 'react-bootstrap';
import { Edit, Trash, PlusCircle } from 'react-feather';
import '../styles/dashboard.scss'; 
import axios from "axios";

const Dashboard = () => {
  const [employees, setEmployees] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  useEffect(() => {
    fetchEmployees();
  }, []);

  const fetchEmployees = () => {
    axios.get('http://localhost:8088/dashboard')
      .then(res => setEmployees(res.data))
      .catch(err => console.log(err));
  };

  const handleAdd = (newEmployee) => {
    axios.post('http://localhost:8088/addproduct', newEmployee)
      .then(res => {
        console.log(res);
        fetchEmployees(); 
      })
      .catch(err => console.log(err));
  };

  const handleEdit = (updatedEmployee) => {
    axios.put(`http://localhost:8088/updateproduct/${updatedEmployee.productid}`, updatedEmployee)
      .then(res => {
        console.log(res);
        fetchEmployees(); // Refresh the list after updating
      })
      .catch(err => console.log(err));
  };

  const handleDelete = () => {
    if (selectedEmployee) {
      axios.delete(`http://localhost:8088/deleteproduct/${selectedEmployee.productid}`)
        .then(res => {
          console.log(res);
          fetchEmployees(); // Refresh the list after deleting
          setShowDeleteModal(false);
          setSelectedEmployee(null);
        })
        .catch(err => console.log(err));
    }
  };

  return (
    <div className="container-xl">
      <div className="table-responsive">
        <div className="table-wrapper">
          <div className="table-title">
            <div className="row">
              <div className="col-sm-6">
                <h2>Manage <b>Products</b></h2>
              </div>
              <div className="col-sm-6">
                <Button className="btn btn-success" onClick={() => setShowAddModal(true)}>
                  <PlusCircle size={18} /> <span>Add New Product</span>
                </Button>
              </div>
            </div>
          </div>
          <table className="table table-striped table-hover">
            <thead>
              <tr>
                <th>Name</th>
                <th>Price</th>
                <th>Amount</th>
                <th>Category</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {employees.map((employee) => (
                <tr key={employee.productid}>
                  <td>{employee.name}</td>
                  <td>{employee.price}</td>
                  <td>{employee.amount}</td>
                  <td>{employee.category}</td>
                  <td>
                    <a href="#" className="edit" onClick={() => { setSelectedEmployee(employee); setShowEditModal(true); }}>
                      <Edit size={18} />
                    </a>
                    <a href="#" className="delete" onClick={() => { setSelectedEmployee(employee); setShowDeleteModal(true); }}>
                      <Trash size={18} />
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="clearfix">
            <div className="hint-text">Showing <b>{employees.length}</b> entries</div>
          </div>
        </div>
      </div>

      <EmployeeModal
        show={showAddModal}
        onHide={() => setShowAddModal(false)}
        onSubmit={handleAdd}
        title="Add Product"
      />

      <EmployeeModal
        show={showEditModal}
        onHide={() => setShowEditModal(false)}
        onSubmit={handleEdit}
        title="Edit Product"
        employee={selectedEmployee}
      />

      <Modal show={showDeleteModal} onHide={() => setShowDeleteModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Delete Product</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p>Are you sure you want to delete this product?</p>
          <p className="text-warning"><small>This action cannot be undone.</small></p>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowDeleteModal(false)}>Cancel</Button>
          <Button variant="danger" onClick={handleDelete}>Delete</Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

const EmployeeModal = ({ show, onHide, onSubmit, title, employee = null }) => {
  const [formData, setFormData] = useState({
    name: '',
    price: '',
    amount: '',
    category: '',
    image: ''
  });

  useEffect(() => {
    if (employee) {
      setFormData({
        productid: employee.productid,
        name: employee.name || '',
        price: employee.price || '',
        amount: employee.amount || '',
        category: employee.category || '',
        image: employee.image || ''
      });
    } else {
      setFormData({
        name: '',
        price: '',
        amount: '',
        category: '',
        image: ''
      });
    }
  }, [employee]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
    onHide();
  };

  return (
    <Modal show={show} onHide={onHide}>
      <Form onSubmit={handleSubmit}>
        <Modal.Header closeButton>
          <Modal.Title>{title}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form.Group>
            <Form.Label>Name</Form.Label>
            <Form.Control type="text" name="name" value={formData.name} onChange={handleChange} required />
          </Form.Group>
          <Form.Group>
            <Form.Label>Price</Form.Label>
            <Form.Control type="text" name="price" value={formData.price} onChange={handleChange} required />
          </Form.Group>
          <Form.Group>
            <Form.Label>Amount</Form.Label>
            <Form.Control type='text' name="amount" value={formData.amount} onChange={handleChange} required />
          </Form.Group>
          <Form.Group>
            <Form.Label>Category</Form.Label>
            <Form.Control type="text" name="category" value={formData.category} onChange={handleChange} required />
          </Form.Group>
          <Form.Group>
            <Form.Label>Image</Form.Label>
            <Form.Control type="text" name="image" value={formData.image} onChange={handleChange} required />
          </Form.Group>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={onHide}>Cancel</Button>
          <Button variant="primary" type="submit">Save</Button>
        </Modal.Footer>
      </Form>
    </Modal>
  );
};

export default Dashboard;