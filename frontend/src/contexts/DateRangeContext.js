import React, {createContext, useContext, useState} from 'react';

const DateRangeContext = createContext(null);

export const DateRangeProvider = ({children}) => {
  const [checkinDate, setCheckinDate] = useState('');   // 'YYYY-MM-DD' nếu dùng <input type="date">
  const [checkoutDate, setCheckoutDate] = useState('');

  const setRange = ({checkin, checkout}) => {
    if (checkin !== undefined) setCheckinDate(checkin);
    if (checkout !== undefined) setCheckoutDate(checkout);
  };

  return (
    <DateRangeContext.Provider value={{
      checkinDate, checkoutDate, setCheckinDate, setCheckoutDate, setRange
    }}>
      {children}
    </DateRangeContext.Provider>
  );
};

export const useDateRange = () => useContext(DateRangeContext);
