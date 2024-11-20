import React, { useState } from 'react';
import { Form, Button, Alert, Container, Row, Col, Card } from 'react-bootstrap';
import axios from 'axios';

const VNPayPayment = () => {
    const [amount, setAmount] = useState('');
    const [bankCode, setBankCode] = useState('');
    const [language, setLanguage] = useState('vn');
    const [error, setError] = useState(null);
    const [successMessage, setSuccessMessage] = useState(null);

    const handlePaymentSubmit = async (event) => {
        event.preventDefault();
        try {
            const response = await axios.post('http://localhost:8088/create_payment_url', {
                amount,
                bankCode,
                language
            });
            if (response.data.redirectUrl) {
                window.location.href = response.data.redirectUrl;
            }
        } catch (error) {
            setError("Failed to create payment URL. Please try again.");
        }
    };

    const handleVnpayReturn = async () => {
        try {
            const params = new URLSearchParams(window.location.search);
            const response = await axios.get('http://localhost:8088/vnpay_return', { params });
            if (response.data.code === '00') {
                setSuccessMessage("Payment verification successful!");
            } else {
                setError("Payment verification failed.");
            }
        } catch (error) {
            setError("Failed to verify payment. Please try again.");
        }
    };

    React.useEffect(() => {
        if (window.location.pathname.includes('http://localhost:8088/vnpay_return')) {
            handleVnpayReturn();
        }
    }, []);

    return (
        <Container className="d-flex justify-content-center align-items-center min-vh-100">
            <Card style={{ maxWidth: '600px', width: '100%' }} className="shadow-sm p-4">
                <h3 className="text-center mb-4">VNPay Payment</h3>
                {error && <Alert variant="danger">{error}</Alert>}
                {successMessage && <Alert variant="success">{successMessage}</Alert>}
                <Form onSubmit={handlePaymentSubmit}>
                    <Form.Group controlId="formAmount" className="mb-3">
                        <Form.Label>Amount (VND)</Form.Label>
                        <Form.Control
                            type="number"
                            placeholder="Enter amount"
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            required
                        />
                    </Form.Group>

                    <Form.Group controlId="formBankCode" className="mb-3">
                        <Form.Label>Bank Code (Optional)</Form.Label>
                        <Form.Control as="select" value={bankCode} onChange={(e) => setBankCode(e.target.value)}>
                            <option value="">Không chọn</option>
                            <option value="QRONLY">Thanh toan QRONLY</option>
                            <option value="MBAPP">Ung dung MobileBanking</option>
                            <option value="VNPAYQR">VNPAYQR</option>
                            <option value="VNBANK">LOCAL BANK</option>
                            <option value="IB">INTERNET BANKING</option>
                            <option value="ATM">ATM CARD</option>
                            <option value="INTCARD">INTERNATIONAL CARD</option>
                            <option value="VISA">VISA</option>
                            <option value="MASTERCARD">MASTERCARD</option>
                            <option value="JCB">JCB</option>
                            <option value="UPI">UPI</option>
                            <option value="VIB">VIB</option>
                            <option value="VIETCAPITALBANK">VIETCAPITALBANK</option>
                            <option value="SCB">Ngan hang SCB</option>
                            <option value="NCB">Ngan hang NCB</option>
                            <option value="SACOMBANK">Ngan hang SacomBank</option>
                            <option value="EXIMBANK">Ngan hang EximBank</option>
                            <option value="MSBANK">Ngan hang MSBANK</option>
                            <option value="NAMABANK">Ngan hang NamABank</option>
                            <option value="VNMART">Vi dien tu VnMart</option>
                            <option value="VIETINBANK">Ngan hang Vietinbank</option>
                            <option value="VIETCOMBANK">Ngan hang VCB</option>
                            <option value="HDBANK">Ngan hang HDBank</option>
                            <option value="DONGABANK">Ngan hang Dong A</option>
                            <option value="TPBANK">Ngân hàng TPBank</option>
                            <option value="OJB">Ngân hàng OceanBank</option>
                            <option value="BIDV">Ngân hàng BIDV</option>
                            <option value="TECHCOMBANK">Ngân hàng Techcombank</option>
                            <option value="VPBANK">Ngan hang VPBank</option>
                            <option value="AGRIBANK">Ngan hang Agribank</option>
                            <option value="MBBANK">Ngan hang MBBank</option>
                            <option value="ACB">Ngan hang ACB</option>
                            <option value="OCB">Ngan hang OCB</option>
                            <option value="IVB">Ngan hang IVB</option>
                            <option value="SHB">Ngan hang SHB</option>
                            <option value="APPLEPAY">Apple Pay</option>
                            <option value="GOOGLEPAY">Google Pay</option>
                        </Form.Control>
                    </Form.Group>

                    <Form.Group controlId="formLanguage" className="mb-4">
                        <Form.Label>Language</Form.Label>
                        <Form.Select
                            value={language}
                            onChange={(e) => setLanguage(e.target.value)}
                        >
                            <option value="vn">Vietnamese</option>
                            <option value="en">English</option>
                        </Form.Select>
                    </Form.Group>

                    <Button variant="primary" type="submit" className="w-100">
                        Create Payment
                    </Button>
                </Form>
            </Card>
        </Container>
    );
};

export default VNPayPayment;
