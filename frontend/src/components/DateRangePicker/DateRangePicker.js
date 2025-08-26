import React, { useState, useEffect } from 'react';
import styles from './DateRangePicker.module.css';

const DateRangePicker = ({ 
    onDateRangeChange, 
    periodType = 'month',
    defaultStartDate = null,
    defaultEndDate = null 
}) => {
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [startYear, setStartYear] = useState(new Date().getFullYear());
    const [endYear, setEndYear] = useState(new Date().getFullYear());
    const [startMonth, setStartMonth] = useState(new Date().getMonth() + 1);
    const [endMonth, setEndMonth] = useState(new Date().getMonth() + 1);

    // Khởi tạo giá trị mặc định
    useEffect(() => {
        const now = new Date();
        const currentYear = now.getFullYear();
        const currentMonth = now.getMonth() + 1;
        
        if (defaultStartDate && defaultEndDate) {
        setStartDate(defaultStartDate);
        setEndDate(defaultEndDate);
        } else {
        if (periodType === 'day') {
            // Mặc định: 7 ngày gần nhất
            const startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            setStartDate(startDate.toISOString().split('T')[0]);
            setEndDate(now.toISOString().split('T')[0]);
        } else if (periodType === 'month') {
            // Mặc định: năm hiện tại
            setStartYear(currentYear);
            setEndYear(currentYear);
            setStartMonth(1);
            setEndMonth(currentMonth);
        } else if (periodType === 'year') {
            // Mặc định: 5 năm gần nhất
            setStartYear(currentYear - 4);
            setEndYear(currentYear);
        }
        }
    }, [periodType, defaultStartDate, defaultEndDate]);

    // Xử lý thay đổi ngày tháng
    const handleDateChange = () => {
        let dateRange = {};
        
        if (periodType === 'day') {
        dateRange = {
            startDate,
            endDate,
            type: 'day'
        };
        } else if (periodType === 'month') {
        dateRange = {
            startYear,
            endYear,
            startMonth,
            endMonth,
            type: 'month'
        };
        } else if (periodType === 'year') {
        dateRange = {
            startYear,
            endYear,
            type: 'year'
        };
        }
        
        onDateRangeChange(dateRange);
    };

    // Tự động gọi callback khi có thay đổi
    useEffect(() => {
        handleDateChange();
    }, [startDate, endDate, startYear, endYear, startMonth, endMonth]);

    // Tạo danh sách các năm (từ 2020 đến năm hiện tại + 1)
    const generateYearOptions = () => {
        const currentYear = new Date().getFullYear();
        const years = [];
        for (let year = 2020; year <= currentYear + 1; year++) {
        years.push(year);
        }
        return years;
    };

    // Tạo danh sách các tháng
    const generateMonthOptions = () => {
        const months = [];
        for (let month = 1; month <= 12; month++) {
        months.push({
            value: month,
            label: `Tháng ${month}`
        });
        }
        return months;
    };

    const renderDayPicker = () => (
        <div className={styles.dateRangeContainer}>
        <div className={styles.dateGroup}>
            <label className={styles.dateLabel}>Từ ngày:</label>
            <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className={styles.dateInput}
            max={endDate || undefined}
            />
        </div>
        <div className={styles.dateGroup}>
            <label className={styles.dateLabel}>Đến ngày:</label>
            <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className={styles.dateInput}
            min={startDate || undefined}
            />
        </div>
        </div>
    );

    const renderMonthPicker = () => (
        <div className={styles.dateRangeContainer}>
        <div className={styles.monthYearGroup}>
            <div className={styles.dateGroup}>
            <label className={styles.dateLabel}>Từ tháng:</label>
            <select
                value={startMonth}
                onChange={(e) => setStartMonth(parseInt(e.target.value))}
                className={styles.selectInput}
            >
                {generateMonthOptions().map(month => (
                <option key={month.value} value={month.value}>
                    {month.label}
                </option>
                ))}
            </select>
            </div>
            <div className={styles.dateGroup}>
            <label className={styles.dateLabel}>Năm:</label>
            <select
                value={startYear}
                onChange={(e) => setStartYear(parseInt(e.target.value))}
                className={styles.selectInput}
            >
                {generateYearOptions().map(year => (
                <option key={year} value={year}>{year}</option>
                ))}
            </select>
            </div>
        </div>
        <div className={styles.monthYearGroup}>
            <div className={styles.dateGroup}>
            <label className={styles.dateLabel}>Đến tháng:</label>
            <select
                value={endMonth}
                onChange={(e) => setEndMonth(parseInt(e.target.value))}
                className={styles.selectInput}
            >
                {generateMonthOptions().map(month => (
                <option key={month.value} value={month.value}>
                    {month.label}
                </option>
                ))}
            </select>
            </div>
            <div className={styles.dateGroup}>
            <label className={styles.dateLabel}>Năm:</label>
            <select
                value={endYear}
                onChange={(e) => setEndYear(parseInt(e.target.value))}
                className={styles.selectInput}
            >
                {generateYearOptions().map(year => (
                <option key={year} value={year}>{year}</option>
                ))}
            </select>
            </div>
        </div>
        </div>
    );

    const renderYearPicker = () => (
        <div className={styles.dateRangeContainer}>
        <div className={styles.dateGroup}>
            <label className={styles.dateLabel}>Từ năm:</label>
            <select
            value={startYear}
            onChange={(e) => setStartYear(parseInt(e.target.value))}
            className={styles.selectInput}
            >
            {generateYearOptions().map(year => (
                <option key={year} value={year}>{year}</option>
            ))}
            </select>
        </div>
        <div className={styles.dateGroup}>
            <label className={styles.dateLabel}>Đến năm:</label>
            <select
            value={endYear}
            onChange={(e) => setEndYear(parseInt(e.target.value))}
            className={styles.selectInput}
            >
            {generateYearOptions().map(year => (
                <option key={year} value={year}>{year}</option>
            ))}
            </select>
        </div>
        </div>
    );

    return (
        <div className={styles.dateRangePicker}>
        {periodType === 'day' && renderDayPicker()}
        {periodType === 'month' && renderMonthPicker()}
        {periodType === 'year' && renderYearPicker()}
        </div>
    );
};

export default DateRangePicker;
