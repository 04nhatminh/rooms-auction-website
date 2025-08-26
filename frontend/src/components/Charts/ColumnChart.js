import React from 'react';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';
import { Bar } from 'react-chartjs-2';
import styles from './Chart.module.css';

ChartJS.register(
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend
);

const ColumnChart = ({ data, title, yAxisLabel }) => {
    const options = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                position: 'top',
                labels: {
                usePointStyle: true,
                    font: {
                        family: 'Montserrat',
                        size: 12,
                        weight: 500
                    },
                    color: '#000'
                }
            },
            title: {
                display: true,
                text: title,
                font: {
                    family: 'Montserrat',
                    size: 16,
                    weight: 600
                },
                color: '#000'
            },
            tooltip: {
                backgroundColor: 'rgba(0,0,0,0.8)',
                titleColor: '#fff',
                bodyColor: '#fff',
                borderColor: '#ddd',
                borderWidth: 1,
                cornerRadius: 6,
                displayColors: true,
            }
        },
        scales: {
            x: {
                grid: {
                    display: true,
                    color: 'rgba(0,0,0,0.1)'
                },
                ticks: {
                    font: {
                        family: 'Montserrat',
                        size: 11,
                        weight: 500
                    },
                    color: '#000'
                }
            },
            y: {
                grid: {
                    display: true,
                    color: 'rgba(0,0,0,0.1)'
                },
                ticks: {
                    font: {
                        family: 'Montserrat',
                        size: 11,
                        weight: 500
                    },
                    color: '#000'
                },
                title: {
                display: true,
                text: yAxisLabel,
                    font: {
                        family: 'Montserrat',
                        size: 12,
                        weight: 600
                    },
                    color: '#000'
                }
            }
        },
        elements: {
            bar: {
                borderRadius: 4,
                borderSkipped: false,
            }
        }
    };

    return (
        <div className={styles.chartContainer}>
            <Bar data={data} options={options} />
        </div>
    );
};

export default ColumnChart;
