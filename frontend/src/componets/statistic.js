import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Bar, Line } from 'react-chartjs-2';
import Chart from 'chart.js/auto';
import AppHeader from './Header';

const Statistic = () => {
  const [earnings, setEarnings] = useState({});
  const [salesByCategory, setSalesByCategory] = useState([]);
  const [orderStatusOverview, setOrderStatusOverview] = useState([]);
  const [monthlyEarnings, setMonthlyEarnings] = useState([]);
  const [topProducts, setTopProducts] = useState([]);
  const [topProductsLast30Days, setTopProductsLast30Days] = useState([]);

  useEffect(() => {
    axios.get('http://localhost:8088/earnings').then((res) => setEarnings(res.data));
    axios.get('http://localhost:8088/sales-by-category').then((res) => setSalesByCategory(res.data));
    axios.get('http://localhost:8088/order-status-overview').then((res) => setOrderStatusOverview(res.data));
    axios.get('http://localhost:8088/monthly-earnings').then((res) => setMonthlyEarnings(res.data));
    axios.get('http://localhost:8088/top-products').then((res) => setTopProducts(res.data));
    axios.get('http://localhost:8088/top-products-last-30-days').then((res) => setTopProductsLast30Days(res.data));
  }, []);


  const options = {
    responsive: true,
    scales: {
      x: {
        stacked: false,  // Don't stack the bars, so each category has its own column
      },
      y: {
        stacked: true,  // Stack the bars vertically (total sales per month)
      }
    },
    plugins: {
      legend: {
        position: 'top',
      },
    },
  };
  // Data formatting for charts
  const categoryChartData = {
    labels: salesByCategory.map(item => `Month ${item.month}`),  // Month labels
    datasets: [
      {
        label: 'Khuyên tai',
        data: salesByCategory.map(item => item.khuyen_tai_sales),
        backgroundColor: 'rgba(75, 192, 192, 0.6)',  // Khuyên tai color
        categoryPercentage: 0.5, // Adjust column width to fit 4 columns per month
        barPercentage: 1,
      },
      {
        label: 'Dây chuyền',
        data: salesByCategory.map(item => item.day_chuyen_sales),
        backgroundColor: 'rgba(153, 102, 255, 0.6)',  // Dây chuyền color
        categoryPercentage: 0.5,
        barPercentage: 1,
      },
      {
        label: 'Vòng tay',
        data: salesByCategory.map(item => item.vong_tay_sales),
        backgroundColor: 'rgba(255, 159, 64, 0.6)',  // Vòng tay color
        categoryPercentage: 0.5,
        barPercentage: 1,
      },
      {
        label: 'Nhẫn',
        data: salesByCategory.map(item => item.nhan_sales),
        backgroundColor: 'rgba(255, 99, 132, 0.6)',  // Nhẫn color
        categoryPercentage: 0.5,
        barPercentage: 1,
      }
    ]
  };

  const orderStatusChartData = {
    labels: orderStatusOverview.map(item => item.month),
    datasets: [{
      label: 'Đơn hàng bị hủy',
      data: orderStatusOverview.map(item => item.canceled_orders),
      borderColor: 'red',
      
    }, {
      label: 'Tổng số đơn hàng',
      data: orderStatusOverview.map(item => item.total_orders),
      borderColor: 'green',
      
    }]
  };

  const earningsChartData = {
    labels: monthlyEarnings.map(item => item.month),
    datasets: [{
      label: 'Doanh thu theo tháng',
      data: monthlyEarnings.map(item => item.monthly_earnings),
      backgroundColor: 'rgba(153, 102, 255, 0.6)'
    }]
  };

  return (
    <>
    <AppHeader/>
    <br></br>
    <br></br>
    <br></br>
    <br></br>
    <br></br>
    <br></br>
    <br></br>
    <div className="dashboard">
      <h1>Dashboard</h1>

      {/* Earnings Table */}
      <div class="container-fluid pt-4 px-4">
                <div class="row g-4">
                    <div class="col-sm-6 col-xl-3">
                        <div class="bg-light rounded d-flex align-items-center justify-content-between p-4">
                            <i class="fa fa-chart-line fa-3x text-primary"></i>
                            <div class="ms-3">
                                <p class="mb-2">Doanh thu ngày</p>
                                <h6 class="mb-0">{!earnings.today_earn?'0':(earnings.today_earn*1).toLocaleString()} VND</h6>
                            </div>
                        </div>
                    </div>
                    <div class="col-sm-6 col-xl-3">
                        <div class="bg-light rounded d-flex align-items-center justify-content-between p-4">
                            <i class="fa fa-chart-bar fa-3x text-primary"></i>
                            <div class="ms-3">
                                <p class="mb-2">Doanh thu tháng</p>
                                <h6 class="mb-0">{!earnings.this_month_earn?'0':(earnings.this_month_earn*1).toLocaleString()} VND</h6>
                            </div>
                        </div>
                    </div>
                    <div class="col-sm-6 col-xl-3">
                        <div class="bg-light rounded d-flex align-items-center justify-content-between p-4">
                            <i class="fa fa-chart-area fa-3x text-primary"></i>
                            <div class="ms-3">
                                <p class="mb-2">Tổng doanh thu</p>
                                <h6 class="mb-0">{!earnings.all_time_earn?'0':(earnings.all_time_earn*1).toLocaleString()} VND</h6>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <div class="container-fluid pt-4 px-4">
                <div class="row g-4">
                    <div class="col-sm-12 col-xl-6">
                        <div class="bg-light text-center rounded p-4">
                            <div class="d-flex align-items-center justify-content-between mb-4">
                                <h6 class="mb-0">Doanh số theo tháng</h6>
                            </div>
                            <Bar data={categoryChartData} />
                        </div>
                    </div>
                    <div class="col-sm-12 col-xl-6">
                        <div class="bg-light text-center rounded p-4">
                            <div class="d-flex align-items-center justify-content-between mb-4">
                                <h6 class="mb-0">Đơn hàng</h6>
                            </div>
                            <Line data={orderStatusChartData} />
                        </div>
                    </div>
                </div>
            </div>
			<div class="container-fluid pt-4 px-4">
                <div class="row g-4">
                    <div class="col-sm-12 col-xl-6">
                        <div class="bg-light text-center rounded p-4">
                            <div class="d-flex align-items-center justify-content-between mb-4">
                                <h6 class="mb-0">Doanh thu theo tháng</h6>
                            </div>
                            <Bar data={earningsChartData} />
                        </div>
                    </div>
                </div>
            </div>
            <div class="container-fluid pt-4 px-4">
                <div class="row g-4">
                    <div class="col-sm-12 col-xl-6">
                        <div class="bg-light text-center rounded p-4">
                            <div class="d-flex align-items-center justify-content-between mb-4">
                                <h6 class="mb-0">Top bán chạy trong tháng</h6>
                            </div>
                            <div class="table-responsive">
								<table class="table text-start align-middle table-bordered table-hover mb-0">
									<thead>
										<tr class="text-dark">
											<th scope="col">Sản phẩm</th>
											<th scope="col">Số lượng bán ra(30 ngày gần nhất)</th>
										</tr>
									</thead>
									<tbody>
										{topProductsLast30Days.map((product, index) => (
										  <tr key={index}>
											<td>{product.name}</td>
											<td>{product.total_sold}</td>
										  </tr>
										))}
									</tbody>
								</table>
							</div>
                        </div>
                    </div>
                    <div class="col-sm-12 col-xl-6">
                        <div class="bg-light text-center rounded p-4">
                            <div class="d-flex align-items-center justify-content-between mb-4">
                                <h6 class="mb-0">Top sản phẩm bán chạy nhất</h6>
                            </div>
                            <div class="table-responsive">
								<table class="table text-start align-middle table-bordered table-hover mb-0">
									<thead>
										<tr class="text-dark">
											<th scope="col">Sản phẩm</th>
											<th scope="col">Số lượng bán ra</th>
										</tr>
									</thead>
									<tbody>
										{topProducts.map((product, index) => (
										  <tr key={index}>
											<td>{product.name}</td>
											<td>{product.total_sold}</td>
										  </tr>
										))}
									</tbody>
								</table>
							</div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        </>
  );
};

export default Statistic;
