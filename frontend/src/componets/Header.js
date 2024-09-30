import React, { useState, useEffect } from "react";
import { Layout, Menu, Input, Row, Col, Badge, Button, Image, Dropdown } from "antd";
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

const { Header } = Layout;

const AppHeader = ({ username, password, consumerid }) => {
  const navigate = useNavigate();

  // Thêm state để quản lý mục được chọn
  const [selectedKey, setSelectedKey] = useState("1");
  
  const [isSearchModalVisible, setIsSearchModalVisible] = useState(false);
  // Hàm xử lý khi người dùng chọn mục khác
  const handleMenuClick = (e) => {
    setSelectedKey(e.key); // Cập nhật mục được chọn
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/');
  };

  const customTheme = {
    backgroundColor: "#3988D7",
    color: "#fff",
  };

  const userMenu = (
    <Menu>
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
      <Menu.Item key="3" icon={<LogoutOutlined />} onClick={()=>navigate("/")}>
        Đăng nhập {consumerid}
      </Menu.Item>
      }
      

      {
        (consumerid===11) && (<Menu.Item key="4" icon={<LineChartOutlined />} onClick={() => navigate("/dashboard")}>
          Quản lý sản phẩm
        </Menu.Item>)
        
      }
    </Menu>
  );

  // const [text, setText] = useState(
  //   "https://youtu.be/0tDtRBvPCrk?si=ymfkdLX86OwFSt5_"
  // );

  return (
    <Layout>
      {/* Phần trên của header */}
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
                <EnvironmentOutlined style={{ fontSize: "16px" }} /> Cửa Hàng
              </Col>
              <Col>
                <PhoneOutlined style={{ fontSize: "16px" }} /> 094 808 6971
              </Col>
            </Row>
          </Col>
          <Col>
            <Row gutter={16} align="middle">
              <Col>
                <Dropdown overlay={userMenu} trigger={['click']}>
                  <a className="ant-dropdown" onClick={e => e.preventDefault()} style={{ textDecoration: "none", color: "black" }}>
                    <UserOutlined style={{ fontSize: "16px", marginRight: "5px" }} />
                    {username}
                  </a>
                </Dropdown>
              </Col>
              <Col>
                <Badge count={0} offset={[9, 0]}>
                  <ShoppingCartOutlined style={{ fontSize: "16px" }} /> Giỏ Hàng
                </Badge>
              </Col>
            </Row>
          </Col>
        </Row>
      </Header>

      {/* Phần dưới của header */}
      <Header style={{ backgroundColor: "#fff", padding: "0 50px" }}>
        <Row justify="space-between" align="middle">
          <Col span={2}>
            <Image src="logoshop.png" style={{ maxHeight: '60px', width: 'auto', fontSize: '30px', cursor: 'pointer' }} preview={false} onClick={() => navigate("/home")} />
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
                <Link to="/" style={{ color: customTheme.color }}>
                  <HomeFilled style={{ color: customTheme.color }} />
                </Link>
              </Menu.Item>

              <SubMenu
                key="1"
                title="Trang Sức"
                className={
                  selectedKey.startsWith("1") ? "menu-item-selected" : ""
                }
                onTitleClick={() => navigate("/gioi-thieu")}
              >

                {/* vòng cổ */}
                <Menu.Item
                  em
                  key="1.1"
                  className={selectedKey === "1.1" ? "menu-item-selected" : ""}
                  onClick={() => navigate("/gioi-thieu/2")}
                >
                  Vòng Cổ
                </Menu.Item>


                {/* vòng tay */}
                <Menu.Item
                  key="1.2"
                  className={selectedKey === "1.2" ? "menu-item-selected" : ""}
                  onClick={() => navigate("/gioi-thieu/3")}
                >
                  Vòng Tay
                </Menu.Item>


                {/* nhẫn */}
                <Menu.Item
                  key="1.3"
                  className={selectedKey === "1.3" ? "menu-item-selected" : ""}
                  onClick={() => navigate("/gioi-thieu/4")}
                >
                  Nhẫn
                </Menu.Item>
              </SubMenu>

              <SubMenu
                key="2"
                title="Chất liệu"
                className={
                  selectedKey.startsWith("2") ? "menu-item-selected" : ""
                }
                onTitleClick={() => navigate("/chat-lieu")}
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
                onTitleClick={() => navigate("/qua-tang")}
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
                title="Blog"
                className={
                  selectedKey.startsWith("4") ? "menu-item-selected" : ""
                }
                onTitleClick={() => navigate("/blog")}
              ></SubMenu>


              <SubMenu
                key="5"
                title="Khuyến Mãi"
                className={
                  selectedKey.startsWith("5") ? "menu-item-selected" : ""
                }
                onTitleClick={() => navigate("/khuyen-mai")}
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











{/* 
      // import { QRCode, Space } from "antd";
      <Space direction="vertical" align="center">
        <QRCode value={text || "-"} />
        <Input
          placeholder="-"
          maxLength={60}
          value={text}
          onChange={(e) => setText(e.target.value)}
        />
      </Space> */}