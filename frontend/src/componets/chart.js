import { useState } from "react";

import { Bar, Line, Pie } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";

// Register the necessary components for Chart.js
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

export const UserData = [
  {
    id: 1,
    year: 2016,
    userGain: 80000,
    userLost: 823,
  },
  {
    id: 2,
    year: 2017,
    userGain: 45677,
    userLost: 443,
  },
  {
    id: 3,
    year: 2018,
    userGain: 900,
    userLost: 723,
  },
  {
    id: 4,
    year: 2019,
    userGain: 40000,
    userLost: 423,
  },
  {
    id: 5,
    year: 2020,
    userGain: 70000,
    userLost: 923,
  },
];

function Chart() {
  const [userData] = useState({
    labels: UserData.map((data) => data.year),
    datasets: [
      {
        label: "Users Gained",
        data: UserData.map((data) => data.userGain),
        backgroundColor: [
          "rgba(75,192,192,1)",
          "#ecf0f1",
          "#50AF95",
          "#f3ba2f",
          "#2a71d0",
        ],
        borderColor: "black",
        borderWidth: 2,
      },
    ],
  });

  return (
    <div className="App">
      <div style={{ width: 700 }}>
        <Bar data={userData} />
      </div>
      <div style={{ width: 700, marginTop: 30 }}>
        <Line data={userData} />
      </div>
      <div style={{ width: 700, marginTop: 30 }}>
        <Pie data={userData} />
      </div>
    </div>
  );
}

export default Chart;
