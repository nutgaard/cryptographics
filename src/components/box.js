import React from 'react';
import './box.css';

function Box({ title, children, className = '' }){
    return (
        <div className={['box', className].join(' ')}>
            <h2 className="box__title">{title}</h2>
            <div className="box__content">
                {children}
            </div>
        </div>
    );
}

Box.propTypes = {};

export default Box;
