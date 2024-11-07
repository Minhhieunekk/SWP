import './App.css';
import Login from './componets/Login';
import { BrowserRouter, Route, Routes } from 'react-router-dom'
import Signup from './componets/Signup';
import Home from './componets/Home';
import Dashboard from './componets/dashboard';
import OTP from './componets/otp';
import PasswordChangeForm from './componets/Resetpassword';
import Detailuser from './componets/Detailuser';
import ProductDetailPage from './componets/Detailproduct';
import Cart from './componets/cart';
import TrackingOrder from './componets/order';
import ProductFilter from './componets/Filter';
import Chart from './componets/chart';
import Chatbot from './componets/chatbot';
import Contact from './componets/Contact';
import DiscountForm from './componets/discount';
import { JewelryCategory } from './componets/JewelryCategory';
import { MaterialCategory } from './componets/MaterialCategory';
import { GiftCategory } from './componets/GiftCategory';
import ManageDiscounts from './componets/managedicount';
import UserManagementComponent from './componets/manageruser';
import OrderInfo from './componets/Orderinfo';
function App() {
  return (
    <div className="App">
      <BrowserRouter>
        <Routes>
          <Route path='/login' element={<Login />}></Route>
          <Route path='/signup' element={<Signup />}></Route>
          <Route path='/' element={<Home />}></Route>
          <Route path='/dashboard' element={<Dashboard />}></Route>
          <Route path='/otp' element={<OTP />}></Route>
          <Route path='/resetpassword/:consumerid' element={<PasswordChangeForm />}></Route>
          <Route path='/detailuser' element={<Detailuser />}></Route>
          <Route path='/productdetail/:productid' element={<ProductDetailPage />}></Route>
          <Route path='/filter' element={<ProductFilter />}></Route>
          <Route path='/chart' element={<Chart />}></Route>
          <Route path="/gioithieu/:type" element={<JewelryCategory />} />
          <Route path="/chat-lieu/:id" element={<MaterialCategory />} />
          <Route path="/qua-tang/:id" element={<GiftCategory />} />
          <Route path="/manageuser" element={<UserManagementComponent />} />

          <Route path="/chat" element={<Chatbot />} />
          <Route path="/orderinfo" element={<OrderInfo />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/cart/:consumerid" element={<Cart />} />
          <Route path="/trackingorder" element={<TrackingOrder />} />
          <Route path="/create-discount" element={<DiscountForm />} /> 
          <Route path="/manage-discount" element={<ManageDiscounts />} /> 
        </Routes>
      </BrowserRouter>

    </div>
  );
}

export default App;
