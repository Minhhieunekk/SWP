import Swal from 'sweetalert2/dist/sweetalert2.js'
import 'sweetalert2/src/sweetalert2.scss'
const Validation = (values) => {
    
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
    
    return error;
}
export default Validation