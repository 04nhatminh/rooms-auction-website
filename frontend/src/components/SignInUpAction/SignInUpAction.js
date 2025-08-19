import React from 'react';
import { useNavigate } from 'react-router-dom';
import './SignInUpAction.css';

const SignInUpAction = ({ type = 'home' }) => {
    const navigate = useNavigate();

    return (
        <div className={type === 'home' ? "login-signup" : "others-login-signup"}>
            <button 
                className={type === 'home' ? 'home-login-button' : 'others-login-button'}
                onClick={() => navigate('/login')}
            >
                Đăng nhập
            </button>
            <button 
                className={type === 'home' ? 'home-signup-button' : 'others-signup-button'}
                onClick={() => navigate('/signup')}
            >
                Đăng ký
            </button>
        </div>
    );

};

export default SignInUpAction;