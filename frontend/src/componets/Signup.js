import React, { useEffect, useState } from "react";
import "../styles/signup.scss";
import axios from 'axios';
import AppHeader from "./Header";

const Signup = () => {
    const [values, setValues] = useState({
        username: '',
        password: '',
        phone: '',
        email: '',
        address: '',
        streetAddress: '',
        province: '',
        district: '',
        ward: ''
    });
    const [errors, setErrors] = useState({});
    const [messages, setMessages] = useState({
        username: '',
        email: '',
        phone: ''
    });
    const [addressComponents, setAddressComponents] = useState({
        provinces: [],
        districts: [],
        wards: []
    });
    const [isUsernameAvailable, setIsUsernameAvailable] = useState(true);
    const [isEmailAvailable, setIsEmailAvailable] = useState(true);
    const [isPhoneAvailable, setIsPhoneAvailable] = useState(true);

    const SearchableSelect = ({
        options,
        value,
        onChange,
        placeholder,
        name
    }) => {
        const [searchTerm, setSearchTerm] = useState('');
        const [isOpen, setIsOpen] = useState(false);
        const [filteredOptions, setFilteredOptions] = useState([]);

        useEffect(() => {
            if (value) {
                const selectedOption = options.find(opt => opt.code === parseInt(value));
                if (selectedOption) {
                    setSearchTerm(selectedOption.name);
                }
            } else {
                setSearchTerm('');
            }
        }, [value, options]);

        useEffect(() => {
            const filtered = options.filter(option =>
                option.name.toLowerCase().includes(searchTerm.toLowerCase())
            );
            setFilteredOptions(filtered);
        }, [searchTerm, options]);

        const handleInputChange = (e) => {
            setSearchTerm(e.target.value);
            setIsOpen(true);
            if (e.target.value === '') {
                onChange({ target: { name, value: '' } });
            }
        };

        const handleOptionClick = (option) => {
            setSearchTerm(option.name);
            onChange({ target: { name, value: option.code.toString() } });
            setIsOpen(false);
        };

        return (
            <div className="searchable-select">
                <input
                    type="text"
                    className="login__input"
                    value={searchTerm}
                    onChange={handleInputChange}
                    onFocus={() => setIsOpen(true)}
                    placeholder={placeholder}
                />
                {isOpen && searchTerm && filteredOptions.length > 0 && (
                    <div className="searchable-select__dropdown">
                        {filteredOptions.map((option) => (
                            <div
                                key={option.code}
                                className="searchable-select__option"
                                onClick={() => handleOptionClick(option)}
                            >
                                {option.name}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        );
    };

    // Fetch provinces on component mount
    useEffect(() => {
        const fetchProvinces = async () => {
            try {
                const response = await axios.get('https://provinces.open-api.vn/api/p/');
                setAddressComponents(prev => ({
                    ...prev,
                    provinces: response.data
                }));
            } catch (error) {
                console.error('Error fetching provinces:', error);
            }
        };
        fetchProvinces();
    }, []);

    // Fetch districts when province changes
    useEffect(() => {
        const fetchDistricts = async () => {
            if (values.province) {
                try {
                    const response = await axios.get(`https://provinces.open-api.vn/api/p/${values.province}?depth=2`);
                    setAddressComponents(prev => ({
                        ...prev,
                        districts: response.data.districts,
                        wards: []
                    }));
                    setValues(prev => ({ ...prev, district: '', ward: '' }));
                } catch (error) {
                    console.error('Error fetching districts:', error);
                }
            }
        };
        fetchDistricts();
    }, [values.province]);

    // Fetch wards when district changes
    useEffect(() => {
        const fetchWards = async () => {
            if (values.district) {
                try {
                    const response = await axios.get(`https://provinces.open-api.vn/api/d/${values.district}?depth=2`);
                    setAddressComponents(prev => ({
                        ...prev,
                        wards: response.data.wards
                    }));
                    setValues(prev => ({ ...prev, ward: '' }));
                } catch (error) {
                    console.error('Error fetching wards:', error);
                }
            }
        };
        fetchWards();
    }, [values.district]);

    // Update full address when any address component changes
    useEffect(() => {
        const updateFullAddress = () => {
            const province = addressComponents.provinces.find(p => p.code === parseInt(values.province))?.name || '';
            const district = addressComponents.districts.find(d => d.code === parseInt(values.district))?.name || '';
            const ward = addressComponents.wards.find(w => w.code === parseInt(values.ward))?.name || '';
            const streetAddress = values.streetAddress.trim();

            if (streetAddress && province && district && ward) {
                const fullAddress = `${streetAddress}, ${ward}, ${district}, ${province}`;
                setValues(prev => ({ ...prev, address: fullAddress }));
            }
        };

        updateFullAddress();
    }, [values.province, values.district, values.ward, values.streetAddress, addressComponents]);

    const validateFields = (field, value) => {
        const newErrors = { ...errors };

        if (field === "email") {
            newErrors.email = value && !/^[\w-.]+@([\w-]+\.)+[\w-]{2,4}$/.test(value)
                ? "Sai định dạng email"
                : "";
        }

        if (field === "password") {
            newErrors.password = value && value.length < 8
                ? "Mật khẩu phải có ít nhất 8 kí tự"
                : "";
        }

        if (field === "phone") {
            newErrors.phone = value && value.length < 10
                ? "Số điện thoại phải có ít nhất 10 ký tự"
                : "";
        }

        if (field === "address" || field === "streetAddress" || field === "province" || field === "district" || field === "ward") {
            newErrors.address = values.streetAddress && values.province && values.district && values.ward
                ? ""
                : "Vui lòng nhập đầy đủ thông tin địa chỉ";
        }

        setErrors(newErrors);
    };

    const handleSignup = async (e) => {
        e.preventDefault();
        const validationErrors = validateFields();

        if (Object.keys(validationErrors).length === 0 && isUsernameAvailable && isEmailAvailable && isPhoneAvailable) {
            try {
                const response = await axios.post('http://localhost:8088/signup', {
                    username: values.username,
                    password: values.password,
                    phone: values.phone,
                    email: values.email,
                    address: values.address
                });
                console.log("Registration successful", response.data);
            } catch (err) {
                console.error("Registration error", err);
                setMessages((prev) => ({ ...prev, general: "Registration failed. Please try again." }));
            }
        } else {
            console.log("Validation errors:", validationErrors);
        }
    };

    const handleInput = (event) => {
        const { name, value } = event.target;
        setValues((prev) => ({ ...prev, [name]: value }));
        validateFields(name, value);  // Validate the specific field on input
    };
    // Username check effect
    useEffect(() => {
        const checkUsername = async () => {
            if (values.username) {
                try {
                    const response = await axios.post('http://localhost:8088/checkuser', { username: values.username });
                    setIsUsernameAvailable(!response.data.exists);
                    setMessages((prev) => ({ ...prev, username: response.data.message }));
                } catch (err) {
                    console.error("Error checking username:", err);
                    setMessages((prev) => ({ ...prev, username: "Error checking username availability" }));
                }
            }
        };

        const debounceTimer = setTimeout(checkUsername, 500);
        return () => clearTimeout(debounceTimer);
    }, [values.username]);

    // Email check effect
    useEffect(() => {
        const checkEmail = async () => {
            if (values.email) {
                try {
                    const response = await axios.post('http://localhost:8088/checkemail', { email: values.email });
                    setIsEmailAvailable(!response.data.exists);
                    setMessages((prev) => ({ ...prev, email: response.data.message }));
                } catch (err) {
                    console.error("Error checking email:", err);
                    setMessages((prev) => ({ ...prev, email: "Error checking email availability" }));
                }
            }
        };

        const debounceTimer = setTimeout(checkEmail, 500);
        return () => clearTimeout(debounceTimer);
    }, [values.email]);

    // Phone check effect
    useEffect(() => {
        const checkPhone = async () => {
            if (values.phone) {
                try {
                    const response = await axios.post('http://localhost:8088/checkphone', { phone: values.phone });
                    setIsPhoneAvailable(!response.data.exists);
                    setMessages((prev) => ({ ...prev, phone: response.data.message }));
                } catch (err) {
                    console.error("Error checking phone:", err);
                    setMessages((prev) => ({ ...prev, phone: "Error checking phone availability" }));
                }
            }
        };

        const debounceTimer = setTimeout(checkPhone, 500);
        return () => clearTimeout(debounceTimer);
    }, [values.phone]);
    return (
        <>
            <AppHeader />
            <div className="container" style={{ position: 'relative', top: '80px' }}>
                <div className="screen">
                    <div className="screen__content">
                        <form className="login" onSubmit={handleSignup}>
                            <h3 className="form-title">Đăng ký</h3>
                            <div className="form-columns">
                                <div className="form-column">
                                    <div className="login__field">
                                        <input
                                            type="text"
                                            className="login__input"
                                            placeholder="Tên đăng nhập"
                                            onChange={handleInput}
                                            name="username"
                                            required
                                        />
                                        {messages.username && (
                                            <span className={isUsernameAvailable ? "success" : "error"}>
                                                {messages.username}
                                            </span>
                                        )}
                                    </div>
                                    <div className="login__field">
                                        <input
                                            type="password"
                                            className="login__input"
                                            placeholder="Mật khẩu"
                                            onChange={handleInput}
                                            name="password"
                                            required
                                        />
                                        {errors.password && <span className="error">{errors.password}</span>}
                                    </div>
                                    <div className="login__field">
                                        <input
                                            type="number"
                                            className="login__input"
                                            placeholder="Số điện thoại"
                                            onChange={handleInput}
                                            name="phone"
                                            required
                                        />
                                        {(errors.phone || messages.phone) && (
                                            <span className={isPhoneAvailable ? "error" : "error"}>
                                                {errors.phone || messages.phone}
                                            </span>
                                        )}
                                    </div>
                                    <div className="login__field">
                                        <input
                                            type="email"
                                            className="login__input"
                                            placeholder="Email"
                                            onChange={handleInput}
                                            name="email"
                                            required
                                        />
                                        {(errors.email || messages.email) && (
                                            <span className={isEmailAvailable ? "error" : "error"}>
                                                {errors.email || messages.email}
                                            </span>
                                        )}
                                    </div>

                                </div>
                                <div className="form-column">
                                    
                                    <div className="login__field">
                                        <SearchableSelect
                                            options={addressComponents.provinces}
                                            value={values.province}
                                            onChange={handleInput}
                                            placeholder="Tỉnh/Thành phố"
                                            name="province"
                                        />
                                    </div>
                                    <div className="login__field">
                                        <SearchableSelect
                                            options={addressComponents.districts}
                                            value={values.district}
                                            onChange={handleInput}
                                            placeholder="Quận/Huyện"
                                            name="district"
                                        />
                                    </div>
                                    <div className="login__field">
                                        <SearchableSelect
                                            options={addressComponents.wards}
                                            value={values.ward}
                                            onChange={handleInput}
                                            placeholder="Xã/Phường"
                                            name="ward"
                                        />
                                    </div>
                                    <div className="login__field">
                                        <input
                                            type="text"
                                            className="login__input"
                                            placeholder="Địa chỉ (Số nhà, tên đường)"
                                            onChange={handleInput}
                                            name="streetAddress"
                                            required
                                        />
                                        {errors.address && <span className="error">{errors.address}</span>}
                                    </div>
                                </div>
                            </div>
                            <button className="button login__submit" type="submit">
                                <span className="button__text">Đăng ký</span>
                            </button>
                        </form>
                    </div>
                </div>
            </div>
        </>
    );
};

export default Signup;
