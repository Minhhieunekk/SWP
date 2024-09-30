import Swal from 'sweetalert2/dist/sweetalert2.js'
import 'sweetalert2/src/sweetalert2.scss'
const Validationsignup = (values) => {
    const email_pattern = /^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/
    let error = {}
    if (values.username==="") {
        error.username="Username should not be empty"
        Swal.fire({
            title: "Error signup",
            text: "Username should not be empty",
            icon: "warning"
          });
    } 
    
    if (values.password ===""){
        error.password="Password should not be empty"
        Swal.fire({
            title: "Error signup",
            text: "Password should not be empty",
            icon: "warning"
          });
    }
   
    if (values.phone ===""){
        error.phone="Phone should not be empty"
        Swal.fire({
            title: "Error signup",
            text: "Phone should not be empty",
            icon: "warning"
          });
    }
    
    if (!email_pattern.test(values.email)) {
        error.email="Wrong email format"
        Swal.fire({
            title: "Error signup",
            text: "Wrong email format",
            icon: "warning"
          });
    }
    
    if (values.address ===""){
        error.address="Address should not be empty"
        Swal.fire({
            title: "Error signup",
            text: "Address should not be empty",
            icon: "warning"
          });
    }
    
   if (Object.keys(error).length===0) {
    Swal.fire({
        title: "Success Signup",
        text: "Do you want to login?",
        icon: "success",
        showCancelButton: true,
        confirmButtonColor: "#3085d6",
        cancelButtonColor: "#d33",
        confirmButtonText: "Login"
    }).then((result) => {
        if (result.isConfirmed) {
            window.location.href="/"
        }
    });
   }
    return error
}
export default Validationsignup