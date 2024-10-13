import React, { useState } from 'react';
import './Star.css';

const Star = ({ totalStars = 5 }) => {
    const [rating, setRating] = useState(0);

    const handleRating = (starValue) => {
        setRating(starValue);
    };

    return (
        <div className="star-rating">
            {[...Array(totalStars)].map((star, index) => {
                const starValue = index + 1;
                return (
                    <span
                        key={index}
                        className={`star ${starValue <= rating ? 'selected' : ''}`}
                        onClick={() => handleRating(starValue)}
                    >
                        ★
                    </span>
                );
            })}
            <p>{rating} out of {totalStars}</p>
        </div>
    );
};

export default Star;
