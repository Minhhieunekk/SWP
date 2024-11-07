import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Modal, Input, List, Spin, Typography, Descriptions, Image, Rate, Button, message } from 'antd';
import { SearchOutlined, ShoppingCartOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router';
const { Text } = Typography;

const CentralSearchModal = ({ visible, onClose }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);

  useEffect(() => {
    const fetchProducts = async () => {
      if (searchTerm.trim() !== '') {
        setLoading(true);
        try {
          const response = await axios.get(`http://localhost:8088/search?term=${searchTerm}`);
          setSearchResults(response.data);
        } catch (error) {
          console.error('Error fetching search results:', error);
          setSearchResults([]);
        }
        setLoading(false);
      } else {
        setSearchResults([]);
      }
    };

    const debounceTimer = setTimeout(() => {
      fetchProducts();
    }, 300);

    return () => clearTimeout(debounceTimer);
  }, [searchTerm]);

  const handleProductClick = async (productId) => {
    try {
      const response = await axios.get(`http://localhost:8088/product/${productId}`);
      setSelectedProduct(response.data);
    } catch (error) {
      console.error('Error fetching product details:', error);
    }
  };
 const navigate=useNavigate();
  const handleview = (productid) => {
   navigate(`/productdetail/${productid}`)
  };

  return (
    <Modal
      visible={visible}
      onCancel={onClose}
      footer={null}
      width={800}
      title="Tìm kiếm sản phẩm"
    >
      <Input
        placeholder="Nhập tên sản phẩm"
        prefix={<SearchOutlined />}
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        style={{ marginBottom: 16 }}
      />
      
      {loading ? (
        <div style={{ textAlign: 'center', padding: '20px' }}>
          <Spin size="large" />
        </div>
      ) : (
        <List
          dataSource={searchResults}
          renderItem={(item) => (
            
            <List.Item 
              key={item.productid}
              onClick={() => handleProductClick(item.productid)}
              style={{ cursor: 'pointer' }}
            >
              <List.Item.Meta
                avatar={
                <Image src={item.image} width={100} alt={item.name} />}
                title={<Text strong>{item.name}</Text>}
                description={<Text type="secondary">{parseFloat(item.price).toLocaleString('vi-VN')} ₫</Text>}
              />
            </List.Item>
          )}
        />
      )}

      {selectedProduct && (
        <Modal
          visible={!!selectedProduct}
          onCancel={() => setSelectedProduct(null)}
          footer={null}
          title="Chi tiết sản phẩm"
        >
          <Image
            src={selectedProduct.image}
            alt={selectedProduct.name}
            style={{ maxWidth: '100%', marginBottom: 16 }}
          />
          <Descriptions bordered>
            <Descriptions.Item label="Tên" span={3}>{selectedProduct.name}</Descriptions.Item>
            <Descriptions.Item label="Giá" span={3}>
              {parseFloat(selectedProduct.price).toLocaleString('vi-VN')} ₫
            </Descriptions.Item>
            <Descriptions.Item label="Số lượng" span={3}>{selectedProduct.amount}</Descriptions.Item>
            <Descriptions.Item label="Danh mục" span={3}>{selectedProduct.category}</Descriptions.Item>
            <Descriptions.Item label="Đánh giá" span={3}>
              <Rate disabled defaultValue={(selectedProduct.totalrate/selectedProduct.peoplerate) || 0} />
              ({selectedProduct.peoplerate || 0} đánh giá)
            </Descriptions.Item>
          </Descriptions>
          <Button 
            type="default" 
           
            onClick={() => handleview(selectedProduct.productid)}
            style={{ marginTop: 16 }}
          >
            Xem chi tiết
          </Button>
        </Modal>
      )}
    </Modal>
  );
};

export default CentralSearchModal;