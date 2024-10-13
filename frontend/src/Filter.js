import React, { useState } from "react";
import "./Filter.css";


const ProductFilter = () => {
  const [selectedFilters, setSelectedFilters] = useState({
    brand: '',
    price: '',
    collection: '',
    gender: '',
    age: '',
    material: '',
    type: ''
  });

  const [products] = useState([
    {
      id: 1,
      name: "Nhẫn cưới nam Kim cương Vàng 18K",
      image: "/path-to-image1.jpg",
      categoryname: "Nhẫn cưới",
      material: "Vàng 18K",
      price: 8300000,
      totalrate: 45,
      peoplerate: 9,
      brand: "pnj",
      gender: "male",
      age: "18k"
    },
    {
      id: 2,
      name: "Nhẫn cưới Kim cương Vàng trắng 14Ksdfgsdfg",
      image: "/path-to-image2.jpg",
      categoryname: "Nhẫn cầu hôn",
      material: "Vàng trắng 14K",
      price: 7324000,
      totalrate: 40,
      peoplerate: 8,
      brand: "pnj",
      gender: "female",
      age: "14k"
    },
    {
      id: 3,
      name: "Nhẫn cưới nam Vàng trắng 10K",
      image: "/path-to-image3.jpg",
      categoryname: "Nhẫn cưới",
      material: "Vàng trắng 10K",
      price: 3802000,
      totalrate: 50,
      peoplerate: 10,
      brand: "pandora",
      gender: "male",
      age: "10k"
    },
    {
        id: 4,
        name: "Nhẫn cưới nam Vàng trắng 10K",
        image: "/path-to-image3.jpg",
        categoryname: "Nhẫn cưới",
        material: "Vàng trắng 10K",
        price: 38020006,
        totalrate: 505,
        peoplerate: 10,
        brand: "pandora",
        gender: "male",
        age: "14k"
      },
      {
        id: 5,
        name: "Nhẫn cưới nam Vàng trắng 10K",
        image: "/path-to-image3.jpg",
        categoryname: "Nhẫn cưới",
        price: 3802000,
        totalrate: 50,
        peoplerate: 10,
        brand: "Disnay",
        gender: "male",
        material: "gold",
        type: "ruby",
        age: "24k"
      }
  ]);

  const handleFilterChange = (filterId, value) => {
    setSelectedFilters(prevFilters => ({
      ...prevFilters,
      [filterId]: value
    }));
  };

  // Filtering logic based on selected filters
  const filteredProducts = products.filter(product => {
    return (
      (selectedFilters.brand === '' || product.brand === selectedFilters.brand) &&
      (selectedFilters.price === '' || (selectedFilters.price === 'low' ? product.price <= 5000000 : product.price > 5000000)) &&
      (selectedFilters.collection === '' || product.categoryname === selectedFilters.collection) &&
      (selectedFilters.gender === '' || product.gender === selectedFilters.gender) &&
      (selectedFilters.age === '' || product.age === selectedFilters.age)
    );
  });

  const filters = [
    {
      id: 'brand',
      label: 'Thương hiệu',
      options: [
        { value: '', label: 'Tất cả' },
        { value: 'pnj', label: 'PNJ' },
        { value: 'Disney', label: 'Disney' }
        
      ]
    },
    {
      id: 'price',
      label: 'Giá',
      options: [
        { value: '', label: 'Tất cả' },
        { value: 'low', label: 'Thấp đến cao' },
        { value: 'high', label: 'Cao đến thấp' }
      ]
    },
    {
      id: 'collection',
      label: 'Bộ sưu tập',
      options: [
        { value: '', label: 'Tất cả' },
        { value: 'Nhẫn cưới', label: 'Nhẫn cưới' },
        { value: 'Nhẫn cầu hôn', label: 'Nhẫn cầu hôn' },
        { value: 'Nhẫn phong thủy', label: 'Nhẫn phong thủy' },
        { value: 'The Moment', label: 'The Moment' }
      ]
    },
    {
      id: 'gender',
      label: 'Giới tính',
      options: [
        { value: '', label: 'Tất cả' },
        { value: 'male', label: 'Nam' },
        { value: 'female', label: 'Nữ' }
      ]
    },
    {
      id: 'age',
      label: 'Tuổi vàng',
      options: [
        { value: '', label: 'Tất cả' },
        { value: '10k', label: '10K' },
        { value: '14k', label: '14K' },
        { value: '18k', label: '18K' },
        { value: '24k', label: '24K' }
      ]
    },
    {
        id: 'material',
        label: 'Chất liệu',
        options: [
          { value: '', label: 'Tất cả' },
          { value: 'gold', label: 'Vàng' },
          { value: 'platium', label: 'Platium' }  
        ]
      },
      {
        id: 'type',
        label: 'Loại đá chính',
        options: [
          { value: '', label: 'Tất cả' },
          { value: 'ruby', label: 'Ruby' },
          { value: 'gold', label: 'Gold' },
          { value: 'silver', label: 'Silver' },
          { value: 'diamond', label: 'Diamond' }
        ]
      }
  ];

  return (
    <div>
      <h1>Jewelry Store</h1>
      <div className="filters">
        {filters.map(filter => (
          <div key={filter.id}>
            <label>{filter.label}</label>
            <select onChange={e => handleFilterChange(filter.id, e.target.value)}>
              {filter.options.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        ))}
      </div>

      {/* Product listing based on filtered results */}
      <div className="product-list">
        {filteredProducts.length > 0 ? (
          filteredProducts.map(product => (
            <div key={product.id} className="product">
              <img src={product.image} alt={product.name} />
              <h3>{product.name}</h3>
              <p>Giá: {product.price.toLocaleString()}₫</p>
              <p>Chất liệu: {product.material}</p>
              <p>Đã bán: {product.totalrate} (Đánh giá: {product.peoplerate})</p>
            </div>
          ))
        ) : (
          <p>Không có sản phẩm nào phù hợp với bộ lọc của bạn.</p>
        )}
      </div>
    </div>
  );
};

export default ProductFilter;
