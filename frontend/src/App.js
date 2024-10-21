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
function App() {
  return (
    <div className="App">
      <BrowserRouter>
        <Routes>
          <Route path='/' element={<Login />}></Route>
          <Route path='/signup' element={<Signup />}></Route>
          <Route path='/home' element={<Home />}></Route>
          <Route path='/dashboard' element={<Dashboard />}></Route>
          <Route path='/otp' element={<OTP />}></Route>
          <Route path='/resetpassword/:consumerid' element={<PasswordChangeForm/>}></Route>
          <Route path='/detailuser' element={<Detailuser/>}></Route>
          <Route path='/productdetail/:productid' element={<ProductDetailPage/>}></Route>
          <Route path='/filter' element={<ProductFilter/>}></Route>
          <Route path="/gioi-thieu" element={<div>HomePage</div>} />
          <Route path="/gioi-thieu/1" element={<div>Vòng Cổ</div>} />
          <Route path="/gioi-thieu/2" element={<div>vòng tay</div>} />
          <Route path="/gioi-thieu/3" element={<div>nhẫn</div>} />
          <Route path="/gioi-thieu/4" element={<div>khuyên tai</div>} />



          <Route path="/chat-lieu" element={<div>HomePage</div>} />
          <Route path="/chat-lieu/1" element={<div>Vàng</div>} />
          <Route path="/chat-lieu/2" element={<div>Bạc</div>} />



          <Route path="/qua-tang" element={<div>HomePage</div>} />
          <Route path="/qua-tang/1" element={<div>Trang sức nam</div>} />
          <Route path="/qua-tang/2" element={<div>trang sức nữ</div>} />


          <Route path="/blog" element={<div>Blog</div>} />

          <Route path="/khuyen-mai" element={<div>khuyen mai</div>} />
          <Route path="/cart/:consumerid" element={<Cart />} />
          <Route path="/trackingorder" element={<TrackingOrder />} />
        </Routes>
      </BrowserRouter>

    </div>
  );
}

export default App;
