import { useEffect, useSyncExternalStore } from 'react';

type AtomOptions<T> = {
  localStorageKey?: string;
} & (T extends number ? { counterOptions?: CounterOptions } : {});

type Atom<T> = {
  get: () => T;
  set: (newValue: T) => void;
  options: () => AtomOptions<T> | undefined;
  reset: () => T;
  subscribe: (callback: (newValue: T) => void) => () => void;
  readonly subscribers: Set<(newValue: T) => void>;
};

type AtomGetter<T> = (get: <R>(atom: Atom<R>) => R) => T;

type StorageProvider = {
  getItem: (key: string) => string | null | Promise<string | null>;
  setItem: (key: string, value: string) => void | Promise<void>;
  removeItem: (key: string) => void | Promise<void>;
};

type DisclosureHandlers = { open: () => void; close: () => void; toggle: () => void };

type CounterOptions = {
  min?: number;
  max?: number;
};

type CounterHandlers = {
  increment: () => void;
  decrement: () => void;
  set: (value: number) => void;
  reset: () => void;
};

const createStorageProvider = (): StorageProvider => {
  if (typeof localStorage !== 'undefined') {
    return {
      getItem: (key: string) => localStorage.getItem(key),
      setItem: (key: string, value: string) => localStorage.setItem(key, value),
      removeItem: (key: string) => localStorage.removeItem(key),
    };
  } else {
    return {
      getItem: async (key: string) => await Promise.resolve(null),
      setItem: async (key: string, value: string) => await Promise.resolve(),
      removeItem: async (key: string) => await Promise.resolve(),
    };
  }
};

export const atom = <T>(initialValue: T | AtomGetter<T>, options?: AtomOptions<T>): Atom<T> => {
  let isInitialized = false;
  let value = typeof initialValue === 'function' ? (null as T) : initialValue;
  const storageProvider = createStorageProvider();
  const subscribers = new Set<(newValue: T) => void>();
  const subscribed = new Set<Atom<any>>();

  const get = <R>(atom: Atom<R>) => {
    let currentValue = atom.get();

    if (!subscribed.has(atom)) {
      subscribed.add(atom);
      atom.subscribe((newValue) => {
        if (currentValue === newValue) return;
        currentValue = newValue;
        computeValue();
      });
    }

    return currentValue;
  };

  const computeValue = async () => {
    const storedValue = options?.localStorageKey ? await storageProvider.getItem(options?.localStorageKey) : null;
    const newValue = typeof initialValue === 'function' ? (initialValue as AtomGetter<T>)(get) : value;
    value = null as T;
    value = await newValue;

    if (isInitialized && options?.localStorageKey && typeof initialValue !== 'function') {
      if (newValue === null) value = storedValue ? JSON.parse(storedValue) : value;
      if (newValue !== null) await storageProvider.setItem(options.localStorageKey, JSON.stringify(newValue));
    }

    isInitialized = true;
    subscribers.forEach((callback) => callback(value));
  };

  computeValue();

  return {
    get: () => value,
    set: (newValue) => {
      value = newValue;
      computeValue();
    },
    options: () => {
      return options;
    },
    reset: () => (typeof initialValue === 'function' ? (null as T) : initialValue),
    subscribe: (callback) => {
      subscribers.add(callback);
      return () => {
        subscribers.delete(callback);
      };
    },
    subscribers,
  };
};

export const useAtom = <T>(atom: Atom<T>): [T, (newValue: T) => void] => {
  const options = atom.options() || ({} as AtomOptions<T>);
  const { localStorageKey: key } = options;

  useEffect(() => {
    const storedValue = key ? localStorage.getItem(key) : null;
    if (storedValue !== null && storedValue !== undefined) atom.set(JSON.parse(storedValue));
  }, []);

  return [useSyncExternalStore(atom.subscribe, atom.get, atom.get), atom.set];
};

export const useAtomValue = <T>(atom: Atom<T>): T => {
  const options = atom.options() || ({} as AtomOptions<T>);
  const { localStorageKey: key } = options;

  useEffect(() => {
    const storedValue = key ? localStorage.getItem(key) : null;
    if (storedValue !== null && storedValue !== undefined) atom.set(JSON.parse(storedValue));
  }, []);

  return useSyncExternalStore(atom.subscribe, atom.get, atom.get);
};

export const useAtomDisclosure = (atom: Atom<boolean>): [boolean, DisclosureHandlers] => {
  const options = atom.options() || {};
  const { localStorageKey: key } = options;

  useEffect(() => {
    const storedValue = key ? localStorage.getItem(key) : null;
    if (storedValue && typeof JSON.parse(storedValue) === 'boolean') atom.set(storedValue === 'true' ? true : false);
  }, []);

  const open = () => {
    atom.set(true);
  };
  const close = () => {
    atom.set(false);
  };
  const toggle = () => {
    atom.set(!atom.get());
  };
  return [useSyncExternalStore(atom.subscribe, atom.get, atom.get), { open, close, toggle }];
};

export const useAtomCounter = (atom: Atom<number>): [number, CounterHandlers] => {
  const options = atom.options() || {};
  const { counterOptions = {}, localStorageKey: key } = options;

  useEffect(() => {
    const storedValue = key ? localStorage.getItem(key) : null;
    if (!!storedValue && !isNaN(Number(JSON.parse(storedValue)))) atom.set(Number(JSON.parse(storedValue)));
  }, []);

  const increment = () => {
    const currentValue = atom.get();
    const { max = Number.MAX_SAFE_INTEGER } = counterOptions;
    if (currentValue < max) {
      atom.set(currentValue + 1);
    }
  };

  const decrement = () => {
    const currentValue = atom.get();
    const { min = Number.MIN_SAFE_INTEGER } = counterOptions;
    if (currentValue > min) {
      atom.set(currentValue - 1);
    }
  };

  const set = (value: number) => {
    const { min = Number.MIN_SAFE_INTEGER, max = Number.MAX_SAFE_INTEGER } = counterOptions;
    if (value >= min && value <= max) {
      atom.set(value);
    }
  };

  const reset = () => {
    atom.set(atom.reset());
  };

  return [useSyncExternalStore(atom.subscribe, atom.get, atom.get), { increment, decrement, set, reset }];
};
