import Swal from 'sweetalert2/dist/sweetalert2.js'
import 'sweetalert2/src/sweetalert2.scss'
const Validationsignup = (values) => {
    const email_pattern = /^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/
    let error = {}

    
    if (!email_pattern.test(values.email)) {
        error.email="Sai định dạng email"
        Swal.fire({
            title: "Lỗi đăng ký",
            text: "Sai định dạng email ",
            icon: "warning"
          });
    }
    if (values.password.length < 8) {
        error.password="Mật khẩu phải có ít nhất 8 kí tự"
        Swal.fire({
            title: "Lỗi đăng ky",
            text: "Mật khẩu phải có ít nhất 8 kí tự",
            icon: "warning"
          });
    }
    
   if (Object.keys(error).length===0) {
    Swal.fire({
        title: "Đăng ký thành công",
        text: "Hãy bấm đăng nhập ngay",
        icon: "success",
        showCancelButton: true,
        confirmButtonColor: "#3085d6",
        cancelButtonColor: "#d33",
        confirmButtonText: "Đăng nhập"
    }).then((result) => {
        if (result.isConfirmed) {
            window.location.href="/login"
        }
    });
   }
    return error
}
export default Validationsignup