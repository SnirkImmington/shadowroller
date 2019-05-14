import * as React from 'react';
import Measure from 'react-measure';

export default class ItemToMeasure extends React.Component {
  state = {
    dimensions: {
      width: -1,
      height: -1,
    },
  }

  render() {
    const { width, height } = this.state.dimensions;
    const className = 'toMeasure';

    return (
      <Measure
        bounds
        onResize={contentRect => {
          this.setState({ dimensions: contentRect.bounds })
        }}
      >
        {({ measureRef }) => (
          <div ref={measureRef} className={className}>
            I can do cool things with my dimensions now :D
            {height > 250 && (
              <div>Render responsive content based on the component size!</div>
            )}
          </div>
        )}
      </Measure>
    )
  }
}
