import React from 'react';
import { PulseLoader } from "react-spinners";

const LoaderPage = () => {
  return (
    <div className="loader-container">
      <PulseLoader color="#36D7B7" size={15} margin={2} />
    </div>
  );
}

export default LoaderPage;