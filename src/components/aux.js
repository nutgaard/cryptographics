import PT from 'prop-types';

function Aux({ children }){
    return children;
}

Aux.propTypes = {
    children: PT.node.isRequired
};

export default Aux;
