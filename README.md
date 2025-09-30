# react-searchx

A lightweight search library with caching, pagination, and debouncing, built for React.
It helps avoid unnecessary API calls while typing and provides a hook for seamless integration in React apps.

---

## ✨ Features

- Debounced search (avoids multiple API calls while typing)
- Built-in caching with configurable limits
- Pagination support (`loadMore`)
- React hook (`useSearch`) for easy integration
- Supports aborting in-flight requests

---

## 📦 Installation

```bash
npm install react-searchx
```

or

```bash
yarn add react-searchx
```

---

## 🚀 Usage

### 1. Define your API function

Your API function must return an object with `{ items: [], total: number }`.

```js
async function myApi(query, limit, offset, signal) {
  const res = await fetch(
    `/api/search?q=${query}&limit=${limit}&offset=${offset}`,
    { signal }
  );
  return res.json(); // should be { items: [...], total: 100 }
}
```

---

### 2. Use the `useSearch` hook in React

```jsx
import React, { useState } from "react";
import useSearch from "react-searchx";

export default function App() {
  const { items, loading, hasMore, setQuery, loadMore } = useSearch(myApi, {
    debounceTime: 500,
    limit: 10,
  });

  return (
    <div>
      <input
        type="text"
        placeholder="Search..."
        onChange={(e) => setQuery(e.target.value)}
      />
      {loading && <p>Loading...</p>}
      <ul>
        {items.map((item, i) => (
          <li key={i}>{item.name}</li>
        ))}
      </ul>
      {hasMore && <button onClick={loadMore}>Load More</button>}
    </div>
  );
}
```

---

### 3. Use the class directly (non-React)

```js
import SearchLibrary from "react-searchx/lib/searchLibrary.js";

const searchLib = new SearchLibrary(myApi, { debounceTime: 400 });

searchLib.search("apple").then((res) => {
  console.log(res.items); // combined items
  console.log(res.total); // total count
});
```

---

## ⚙️ API

### `useSearch(apiFn, options)`

- `apiFn(query, limit, offset, signal)` → must return `{ items, total }`
- `options.debounceTime` → debounce delay in ms (default `400`)
- `options.limit` → number of items per page (default `20`)

Returns:

- `items`: array of results
- `total`: total number of results
- `loading`: boolean
- `hasMore`: boolean
- `setQuery(query: string)`: set the search string
- `loadMore()`: fetch the next page

---

### `SearchLibrary`

Class-based API if you don’t use React.

Methods:

- `search(query, limit)` → fetch first page with debounce
- `loadMore(query, limit)` → fetch next page
- `fetchPage(query, limit, offset)` → fetch specific page

---

## 📄 License

MIT © 2025 [Uditha Vithanage](https://github.com/yourusername)
