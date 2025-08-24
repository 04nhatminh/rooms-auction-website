import React, { useEffect, useMemo, useState } from 'react';
import './CountdownTimer.css';

const CountdownTimer = ({ details }) => {
    const endTs = useMemo(() => {
        const v = details?.endDate ? new Date(details.endDate) : null;
        return v && !isNaN(v) ? v.getTime() : null;
    }, [details]);

    const calc = () => {
        if (!endTs) return { done: true, days: 0, hours: 0, minutes: 0, seconds: 0 };
        let diff = endTs - Date.now();
        if (diff <= 0) return { done: true, days: 0, hours: 0, minutes: 0, seconds: 0 };

        const days = Math.floor(diff / 86400000); diff %= 86400000;
        const hours = Math.floor(diff / 3600000);  diff %= 3600000;
        const minutes = Math.floor(diff / 60000);  diff %= 60000;
        const seconds = Math.floor(diff / 1000);
        return { done: false, days, hours, minutes, seconds };
    };

    const [timeLeft, setTimeLeft] = useState(calc);

    useEffect(() => {
        const id = setInterval(() => setTimeLeft(calc), 1000);
        return () => clearInterval(id);
    }, [endTs]); // cập nhật lại khi endDate đổi

    const pad2 = (n) => String(n).padStart(2, '0');

    return (
        <div className="countdown-timer">
        <p>Thời gian còn lại</p>
        {timeLeft.done ? (
            <span>ĐÃ KẾT THÚC</span>
        ) : (
            <span>
                {timeLeft.days} ngày {pad2(timeLeft.hours)}:{pad2(timeLeft.minutes)}:{pad2(timeLeft.seconds)}
            </span>
        )}
        </div>
    );
};

export default CountdownTimer;
