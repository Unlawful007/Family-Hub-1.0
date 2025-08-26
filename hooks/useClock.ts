import { useState, useEffect } from 'react';

const useClock = (timeZone: string): { fullDate: string } => {
  const [date, setDate] = useState(new Date());

  useEffect(() => {
    // Update once a minute is sufficient for displaying the date
    const timerId = setInterval(() => {
      setDate(new Date());
    }, 60 * 1000);

    return () => clearInterval(timerId);
  }, []);

  const options: Intl.DateTimeFormatOptions = {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    timeZone: timeZone,
  };

  return { fullDate: new Intl.DateTimeFormat('en-US', options).format(date) };
};

export default useClock;
