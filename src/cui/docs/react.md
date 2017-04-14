# Usage Notes for React.js

## Upgrading to v16 (mid-2017)

Core UI currently supports v15.5. In preparation for v16 and its internal rewrite, [v15.5 adds a number of new deprecation notices](https://facebook.github.io/react/blog/2017/04/07/react-v15.5.0.html). One new requirement is the use of the `prop-types` Node module. Since Core UI's RequireJS setup doesn't allow for importing Node modules within components, thethis module was added as a library called `reactproptypes`.

To update `reactproptypes`:

- Run `npm install prop-types`
    + This can be done anywhere, even outside of a Core UI project
- Navigate to `node_modules/prop-types/` and find the file called `prop-types.js`
- In the Core UI repo, pen `src/cui/libs/reactproptypes/reactproptypes.js` and replace its contents with the contents of `prop-types.js`

In all React component files, include the library like this:

```js
define(['react', 'reactproptypes'], function (React, ReactPropTypes) {
    class MyComponent extends React.Component {
        // ...
    }

    MyComponent.propTypes = {
        foo: ReactPropTypes.string,
    };

    MyComponent.defaultProps = {
        foo: '',
    };

    return MyComponent;
});
```
