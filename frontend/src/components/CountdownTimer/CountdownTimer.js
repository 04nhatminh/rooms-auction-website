import React, { useState, useEffect } from 'react';
import './CountdownTimer.css';

const CountdownTimer = ({ details }) => {
    const calculateTimeLeft = () => {
        const difference = +new Date(details.endDate) - +new Date();
        let timeLeft = {};

        if (difference > 0) {
            timeLeft = {
                hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
                minutes: Math.floor((difference / 1000 / 60) % 60),
                seconds: Math.floor((difference / 1000) % 60),
            };
        }
        return timeLeft;
    };

    const [timeLeft, setTimeLeft] = useState(calculateTimeLeft());

    useEffect(() => {
        const timer = setTimeout(() => {
            setTimeLeft(calculateTimeLeft());
        }, 1000);
        return () => clearTimeout(timer);
    });

    const formatTime = (time) => String(time).padStart(2, '0');

  return (
    <div className="countdown-timer">
        <p>Thời gian còn lại</p>
        <span>{formatTime(timeLeft.hours)}:{formatTime(timeLeft.minutes)}:{formatTime(timeLeft.seconds)}</span>
    </div>
  );
};

export default CountdownTimer;
