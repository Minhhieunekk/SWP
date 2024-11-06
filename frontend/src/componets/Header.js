import React, { useState, useEffect } from "react";
import { Layout, Menu, Input, Row, Col, Badge, Button, Image, Dropdown, Modal } from "antd";
import {
  UserOutlined,
  ShoppingCartOutlined,
  EnvironmentOutlined,
  PhoneOutlined,
  LogoutOutlined,
  EditOutlined,
  LineChartOutlined,
} from "@ant-design/icons";
import SubMenu from "antd/es/menu/SubMenu";
import { Link, useNavigate } from "react-router-dom";
import { HomeFilled, SearchOutlined } from "@ant-design/icons";
import CentralSearchModal from "./Search";
import axios from "axios";
import { useLocation } from "react-router-dom";

const { Header } = Layout;

const AppHeader = () => {
  const [isMapModalVisible, setIsMapModalVisible] = useState(false);
  const [user, setUser] = useState(null);
  const username = user?.username;
  const password = user?.password;
  const consumerid = user?.consumerid;
  const navigate = useNavigate();
  const [selectedKey, setSelectedKey] = useState("1");
  const [isSearchModalVisible, setIsSearchModalVisible] = useState(false);

  if (consumerid) {
    localStorage.setItem('userId', consumerid);
  }

  const showMapModal = () => {
    setIsMapModalVisible(true);
  };

  const handleMapModalCancel = () => {
    setIsMapModalVisible(false);
  };

  const openGoogleMaps = () => {
    // Mở Google Maps trong tab mới
    window.open(
      'https://www.google.com/maps/place/1988+BBQ/@21.0173888,105.5170942,17z/data=!3m1!4b1!4m6!3m5!1s0x31345b40fe069629:0xa8a839ddef069b6a!8m2!3d21.0173838!4d105.5196691',
      '_blank'
    );
  };

  const handleMenuClick = (e) => {
    setSelectedKey(e.key);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('userId');
    navigate('/login');
  };

  const customTheme = {
    backgroundColor: "#3988D7",
    color: "#fff",
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
  const location=useLocation();
  useEffect(()=>{
    const token = localStorage.getItem('token');
        const queryParams = new URLSearchParams(location.search);
        const tokenFromUrl = queryParams.get('token');
        if (!token && tokenFromUrl) {
          localStorage.setItem('token', tokenFromUrl);
          fetchUserData(tokenFromUrl);
      } else if (token) {
          fetchUserData(token);
      }
  },[location.search])
  const userMenu = (
    <Menu >
      {consumerid && <Menu.Item key="1" icon={<UserOutlined />} onClick={()=>navigate("/detailuser")}>
        Thông tin người dùng 
      </Menu.Item>}
      {
        password &&
        <Menu.Item key="2" icon={<EditOutlined />} onClick={() => navigate(`/resetpassword/${consumerid}`)}>
          Thay đổi mật khẩu
        </Menu.Item>
      }
      {consumerid ? 
      <Menu.Item key="3" icon={<LogoutOutlined />} onClick={handleLogout}>
        Đăng xuất
      </Menu.Item> :
      <Menu.Item key="3" icon={<LogoutOutlined />} onClick={()=>navigate("/login")}>
        Đăng nhập {consumerid}
      </Menu.Item>
      }
      

      {
        (consumerid===11) && (<Menu.Item key="4" icon={<LineChartOutlined />} onClick={() => navigate("/dashboard")}>
          Quản lý sản phẩm
        </Menu.Item>)
      }
      {
        (consumerid===11) && (<Menu.Item key="5" icon={<LineChartOutlined />} onClick={() => navigate("/trackingorder")}>
          Quản lý đơn hàng
        </Menu.Item>)
      }
    </Menu>
  );

  return (
    <Layout style={{position: "fixed", width: "100%", zIndex: "2"}}>
      <Header
        style={{
          backgroundColor: "#fff",
          padding: "0 50px",
          borderBottom: "1px solid #f0f0f0",
        }}
      >
        <Row justify="space-between" align="middle">
          <Col>
            <Row gutter={16} align="middle">
              <Col>
                <div 
                  style={{ cursor: 'pointer' }} 
                  onClick={showMapModal}
                >
                  <EnvironmentOutlined style={{ fontSize: "16px", marginRight: "5px" }} />
                  Cửa Hàng
                </div>
              </Col>
              <Col>
                <PhoneOutlined style={{ fontSize: "16px", marginRight: "5px" }} />
                094 808 6971
              </Col>
            </Row>
          </Col>
          <Col>
            <Row gutter={16} align="middle">
              <Col>
                <Dropdown overlay={userMenu} trigger={['click']} >
                  <div className="ant-dropdown" onClick={e => e.preventDefault()} style={{cursor:"pointer" }}>
                    <UserOutlined style={{ fontSize: "16px", marginRight: "5px" }} />
                    {username}
                  </div>
                </Dropdown>
              </Col>
              <Col>
                <Badge count={0} offset={[9, 0]}>
                  <div onClick={() => navigate(`/cart/${consumerid}`)}><ShoppingCartOutlined style={{ fontSize: "16px" }} /> Giỏ Hàng </div>
                </Badge>
              </Col>
            </Row>
          </Col>
        </Row>
      </Header>
      <Modal
        title="Vị trí cửa hàng"
        open={isMapModalVisible}
        onCancel={handleMapModalCancel}
        footer={[
          <Button key="openMaps" type="primary" onClick={openGoogleMaps}>
            Mở trong Google Maps
          </Button>,
          <Button key="close" onClick={handleMapModalCancel}>
            Đóng
          </Button>
        ]}
        width={800}
      >
        <div style={{ width: '100%', height: '400px' }}>
          <iframe
            src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3725.5!2d105.5196691!3d21.0173838!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x31345b40fe069629%3A0xa8a839ddef069b6a!2s1988%20BBQ!5e0!3m2!1sen!2s!4v1"
            width="100%"
            height="100%"
            style={{ border: 0 }}
            allowFullScreen=""
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
          />
        </div>
      </Modal>
      {/* Phần dưới của header */}
      <Header style={{ backgroundColor: "#fff", padding: "0 50px" }}>
        <Row justify="space-between" align="middle">
          <Col span={2}>
            <Image src="/images/logoshop.png" style={{ maxHeight: '60px', width: 'auto', fontSize: '30px', cursor: 'pointer' }} preview={false} onClick={() => navigate("/")} />
          </Col>
          <Col span={8}>
            <Menu
              theme={customTheme}
              mode="horizontal"
              selectedKeys={[selectedKey]}
              onClick={handleMenuClick} // Sự kiện khi nhấp vào mục menu
            >
              <Menu.Item
                key="home"
                className={selectedKey === "home" ? "menu-item-selected" : ""}
              >
                <Link to="/login" style={{ color: customTheme.color }}>
                  <HomeFilled style={{ color: customTheme.color }} />
                </Link>
              </Menu.Item>

              <SubMenu
                key="1"
                title="Trang Sức"
                className={
                  selectedKey.startsWith("1") ? "menu-item-selected" : ""
                }
                onTitleClick={() => navigate("/filter")}
                theme="dark"
              >

                {/* vòng cổ */}
                <Menu.Item
                  em
                  key="1.1"
                  className={selectedKey === "1.1" ? "menu-item-selected" : ""}
                  onClick={() => navigate("/gioithieu/1")}
                >
                  Dây chuyền
                </Menu.Item>


                {/* vòng tay */}
                <Menu.Item
                  key="1.2"
                  className={selectedKey === "1.2" ? "menu-item-selected" : ""}
                  onClick={() => navigate("/gioithieu/2")}
                >
                  Vòng Tay
                </Menu.Item>


                {/* nhẫn */}
                <Menu.Item
                  key="1.3"
                  className={selectedKey === "1.3" ? "menu-item-selected" : ""}
                  onClick={() => navigate("/gioithieu/3")}
                >
                  Nhẫn
                </Menu.Item>
                <Menu.Item
                  key="1.4"
                  className={selectedKey === "1.4" ? "menu-item-selected" : ""}
                  onClick={() => navigate("/gioithieu/4")}
                >
                  Khuyên tai
                </Menu.Item>
              </SubMenu>

              <SubMenu
                key="2"
                title="Chất liệu"
                className={
                  selectedKey.startsWith("2") ? "menu-item-selected" : ""
                }
                
                theme="dark"
              >


                {/* Vàng */}
                <Menu.Item
                  key="2.1"
                  className={selectedKey === "2.1" ? "menu-item-selected" : ""}
                  onClick={() => navigate("/chat-lieu/1")}
                >
                  Vàng
                </Menu.Item>


                {/*Bạc */}
                <Menu.Item
                  key="2.2"
                  className={selectedKey === "2.2" ? "menu-item-selected" : ""}
                  onClick={() => navigate("/chat-lieu/2")}
                >
                  Bạc
                </Menu.Item>
              </SubMenu>

              <SubMenu
                key="3"
                title="Quà Tặng"
                className={
                  selectedKey.startsWith("3") ? "menu-item-selected" : ""
                }
               
                theme="dark"
              >
                {/* Cho Nam */}
                <Menu.Item
                  key="3.1"
                  className={selectedKey === "3.1" ? "menu-item-selected" : ""}
                  onClick={() => navigate("/qua-tang/1")}
                >
                  Cho Nam
                </Menu.Item>
                {/*Bạc */}
                <Menu.Item
                  key="3.2"
                  className={selectedKey === "3.2" ? "menu-item-selected" : ""}
                  onClick={() => navigate("/qua-tang/2")}
                >
                  Cho Nữ
                </Menu.Item>
              </SubMenu>
              <SubMenu
                key="4"
                title="Tư vấn"
                className={
                  selectedKey.startsWith("4") ? "menu-item-selected" : ""
                }
                onTitleClick={() => navigate("/chat")}
              ></SubMenu>


              <SubMenu
                key="5"
                title="Liên hệ"
                className={
                  selectedKey.startsWith("5") ? "menu-item-selected" : ""
                }
                onTitleClick={() => navigate("/contact")}
              ></SubMenu>


              {/* Thêm các SubMenu khác */}
            </Menu>
          </Col>
          <Col span={-1}>
            <Button
              icon={<SearchOutlined />}
              onClick={() => setIsSearchModalVisible(true)}
            >
              Tìm kiếm
            </Button>
            <CentralSearchModal
              visible={isSearchModalVisible}
              onClose={() => setIsSearchModalVisible(false)}
            />
          </Col>
        </Row>
      </Header>


    </Layout>
  );
};

export default AppHeader;






