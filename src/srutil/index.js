import pluralize from './pluralize';
import pickRandom from './pick-random';

import * as React from 'react';


function useFlavor(options: React.Node[]): React.Node {
    console.log('called useflavor');
    const [result, _] = React.useState(() => pickRandom(options));
    return result;
}


export { pluralize, pickRandom, useFlavor };
