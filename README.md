# Tila: React State Manager

Tila is a lightweight state management library for React applications, offering simplicity and flexibility in managing application state. With Tila, you can easily create and manage atoms to store various types of data, including primitives, objects, and computed values.

## Features

- **Atom Management**: Easily create and manage atoms to store different types of data.
- **LocalStorage Integration**: Option to persist atom values in the browser's localStorage.
- **Computed Values**: Support for computed values, enabling dynamic updates based on other atoms.
- **Flexible Usage**: Tila provides hooks for convenient integration into React components.

## Installation

You can install Tila via npm or yarn:

```bash
npm install @your-package/tila
```

or

```bash
yarn add @your-package/tila
```

## Usage

### Creating Atoms

To create an atom, use the `atom` function provided by Tila. You can specify the initial value and optional configuration options such as localStorage key or counter options.

```javascript
import { atom } from '@your-package/tila';

// Example atoms
export const myText = atom < string > ('Hello world!', { localStorageKey: 'test-text' });

export const myNumber = atom < number > (0, { counterOptions: { min: 0, max: 10 } });

export const myBoolean = atom < boolean > false;

export const myObj =
  atom <
  MyType >
  {
    name: 'John Doe',
    age: 25,
    address: {
      city: 'New York',
      street: '5th Avenue',
      number: 123,
    },
  };
```

### Using Atoms in Components

Once atoms are defined, you can use them in your React components using various hooks provided by Tila.

```javascript
import React from 'react';
import { useAtom, useAtomCounter, useAtomDisclosure, useAtomObject, useAtomValues, useAtomStore } from '@your-package/tila';
import { myText, myNumber, myBoolean, myObj } from './store'; // Import your atoms

const MyComponent = () => {
  // Usage examples
  const [text, setText] = useAtom(myText);
  const [num, { increment, decrement, set, reset }] = useAtomCounter(myNumber);
  const [opened, { open, close, toggle }] = useAtomDisclosure(myBoolean);
  const [obj, setObj] = useAtomObject(myObj);

  // Using multiple atoms
  const { myText, myNumber, myBoolean } = useAtomStore(store);

  // Using multiple atom values
  const [value1, value2, value3] = useAtomValues(myText, myNumber, myBoolean);

  // Updating object atom
  const updateObject = () => {
    setObj([
      { path: 'name', value: 'Max' },
      { path: 'address.street', value: 'new street' },
      { path: 'address.city', value: 'new city' },
    ]);
  };

  return <div>{/* Your component JSX here */}</div>;
};

export default MyComponent;
```

## Example

For a complete example, you can refer to the provided example stores and their usage in components.

## Conclusion

Tila offers a simple yet powerful solution for state management in React applications. With its intuitive API and flexible usage, it's a great choice for managing your application's state efficiently. Try Tila in your next React project and experience the ease of managing state. Happy coding! 🚀
