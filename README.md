````md
# 📄 Adding New Pages (React Router Guide)

Follow these steps to add a new page to the project.

---

## 🧩 Step 1: Create a New Page File

Go to the `pages` folder and create a new file. Name it based on the page.

📁 Example:
src/pages/Browse.jsx

---

## 🛠️ Step 2: Create the Component

Inside the file, create your component and make sure to export it as **default**.

```jsx
export default function Browse() {
  return <h1>Browse Page</h1>;
}
````

---

## 📥 Step 3: Import the Page in `App.jsx`

Import the page into your `App.jsx` file.

```jsx
import Browse from "./pages/Browse";
```

Structure:

```
import FunctionName from "Location exe .Pages/Function"
```

---

## 🛣️ Step 4: Add Route

Add the route inside the `<Routes>` component.

```jsx
<Route path="/browse" element={<Browse />} />
```

---

## ✅ Example `App.jsx`

```jsx
import { Routes, Route } from "react-router-dom";
import Browse from "./pages/Browse";

function App() {
  return (
    <Routes>
      <Route path="/browse" element={<Browse />} />
    </Routes>
  );
}

export default App;
```

---

## 📌 Summary

* Add a new file in the `pages` folder
* Create a component and use `export default`
* Import it in `App.jsx`
* Add a route to display it

---

# You're good to go 🚀

